/**
 * 测试计划列表命令（list-test-plans）。
 *
 * 进入命令后直接展示当前组织下所有可见的测试计划（在前后端都不过滤项目）；
 * 用户可在搜索栏右侧的两个下拉里进一步按「项目」「状态」筛选。
 *
 * 项目列表与测试计划列表是两次独立的网络拉取：
 *   - 项目列表用于构造项目下拉，过滤失败时仍允许按测试计划列表自己的过滤展示；
 *   - 测试计划列表是命令主体，使用当前项目 + 状态过滤调用 `listTestPlans`。
 *
 * 错误展示策略与 `list-projects.tsx` / `list-repositories.tsx` 一致：
 * toast 只显示一行短因，详情保留在 EmptyView + 「复制错误详情」动作里。
 */

import { Action, ActionPanel, Icon, List, Toast, showToast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { resolveCredentials } from "./api/client";
import { listProjects } from "./api/projects";
import { listTestPlans, type TestPlanStatus } from "./api/testplans";
import type { Project, TestPlan } from "./api/types";
import { testPlanUrl } from "./utils/urls";

interface ErrorDetails {
    brief: string;
    details: string;
}

function toErrorDetails(err: unknown): ErrorDetails {
    const msg = err instanceof Error ? err.message : String(err);
    const anyErr = err as { status?: number; bodyText?: string; name?: string; url?: string; method?: string };
    const status = anyErr?.status;
    const body = anyErr?.bodyText ?? "";
    const url = anyErr?.url;
    const method = anyErr?.method ?? "POST";
    const firstLine = msg.split("\n")[0] || "未知错误";
    const brief = typeof status === "number" && status > 0 ? `${status} · ${firstLine}` : firstLine;
    const lines: string[] = [];
    lines.push(`时间: ${new Date().toISOString()}`);
    try {
        const creds = resolveCredentials();
        if (creds) {
            lines.push(`baseUrl: ${creds.baseUrl}`);
            lines.push(`mode: ${creds.mode}`);
            lines.push(`organizationId: ${creds.organizationId}`);
        }
    } catch {
        /* ignore */
    }
    lines.push(`request: ${method} ${url ?? "(URL 未捕获)"}`);
    if (typeof status === "number") lines.push(`status: ${status}`);
    lines.push(`name: ${anyErr?.name ?? "Error"}`);
    lines.push(`message: ${msg}`);
    if (body) {
        lines.push(`response body:`);
        lines.push(body.length > 4000 ? body.slice(0, 4000) + "\n…(已截断)" : body);
    }
    lines.push("");
    lines.push("排查建议:");
    lines.push("1. 偏好里 Personal Access Token 是否勾选了「测试管理 / 测试计划 / 只读」？");
    lines.push("2. Organization Id 是否与浏览器登录后 URL 中的一致？");
    lines.push("3. 接入点模式是否选对：默认中心版（openapi-rdc.aliyuncs.com），Region 版需要填自部署 URL；");
    lines.push("   Region 版请求 path 不带 organizations/{organizationId}/ 段。");
    lines.push("4. 把上面的 request 行复制到终端，用 curl 加 x-yunxiao-token 头直连，看返回。");
    return { brief, details: lines.join("\n") };
}

const PROJECT_ALL = "__ALL__";
const STATUS_ALL = "ALL";
/** 联合 dropdown 的项目 / 状态分隔符；取值中不会出现的字符 */
const FILTER_DELIMITER = "|";

function combineFilter(project: string, status: TestPlanStatus | typeof STATUS_ALL): string {
    return `${project}${FILTER_DELIMITER}${status}`;
}

function parseFilter(raw: string): { project: string; status: TestPlanStatus | typeof STATUS_ALL } {
    const [project = PROJECT_ALL, status = STATUS_ALL] = raw.split(FILTER_DELIMITER);
    return { project, status: status as TestPlanStatus | typeof STATUS_ALL };
}

const STATUS_OPTIONS: { value: TestPlanStatus | typeof STATUS_ALL; title: string }[] = [
    { value: STATUS_ALL, title: "全部状态" },
    { value: "TODO", title: "未开始" },
    { value: "DOING", title: "进行中" },
    { value: "DONE", title: "已完成" },
];

function statusFilterValue(value: TestPlanStatus | typeof STATUS_ALL): TestPlanStatus | undefined {
    return value === STATUS_ALL ? undefined : value;
}

function statusTitle(value: string | undefined): string {
    switch (value) {
        case "TODO":
            return "未开始";
        case "DOING":
            return "进行中";
        case "DONE":
            return "已完成";
        default:
            return value ?? "-";
    }
}

/** 把 ISO 时间截到日；非字符串原样返回。 */
function dateOnly(value: string | undefined): string | undefined {
    return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : undefined;
}

/** "开始 - 结束"；任一缺失时回退到另一个或创建时间，最后降级为 "-" */
function planTimeRange(plan: TestPlan): string {
    const start = dateOnly(plan.startTime);
    const end = dateOnly(plan.endTime);
    if (start && end) return `${start} - ${end}`;
    if (start) return `${start} -`;
    if (end) return `- ${end}`;
    return dateOnly(plan.createdAt) ?? "-";
}

function projectDisplayName(project: Project | undefined): string | undefined {
    if (!project) return undefined;
    return project.name ?? project.identifier ?? project.id;
}

export default function ListTestPlans() {
    const [plans, setPlans] = useState<TestPlan[] | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsError, setProjectsError] = useState<ErrorDetails>();

    const [plansError, setPlansError] = useState<ErrorDetails>();
    const [search, setSearch] = useState("");
    const [projectFilter, setProjectFilter] = useState<string>(PROJECT_ALL);
    const [statusFilter, setStatusFilter] = useState<TestPlanStatus | typeof STATUS_ALL>(STATUS_ALL);
    const [reloadKey, setReloadKey] = useState(0);

    // 项目列表用于构造下拉与「项目 ID → 项目名」映射；不阻塞测试计划列表的展示
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const items = await listProjects({ perPage: 200 });
                if (cancelled) return;
                setProjects(items);
            } catch (err) {
                if (cancelled) return;
                const { brief, details } = toErrorDetails(err);
                setProjectsError({ brief, details });
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // 测试计划列表：项目 + 状态过滤变化时重新拉取
    useEffect(() => {
        const controller = new AbortController();
        setPlans(null);
        setPlansError(undefined);
        void listTestPlans({
            projectId: projectFilter === PROJECT_ALL ? null : projectFilter,
            status: statusFilterValue(statusFilter),
            signal: controller.signal,
        })
            .then((items) => {
                if (controller.signal.aborted) return;
                setPlans(items);
            })
            .catch(async (reason) => {
                if (controller.signal.aborted) return;
                const { brief, details } = toErrorDetails(reason);
                const next: ErrorDetails = { brief, details };
                setPlansError(next);
                await showToast({ style: Toast.Style.Failure, title: "加载测试计划失败", message: brief });
            });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectFilter, statusFilter, reloadKey]);

    const projectIndex = useMemo(() => {
        const map = new Map<string, Project>();
        for (const project of projects) map.set(project.id, project);
        return map;
    }, [projects]);

    const projectOptions = useMemo(() => {
        const sorted = [...projects].sort((a, b) => projectDisplayName(a)?.localeCompare(projectDisplayName(b) ?? "") ?? 0);
        return [
            { value: PROJECT_ALL, title: "全部项目" },
            ...sorted.map((project) => ({
                value: project.id,
                title: projectDisplayName(project) ?? project.id,
            })),
        ];
    }, [projects]);

    const statusOption =
        STATUS_OPTIONS.find((option) => option.value === statusFilter) ?? STATUS_OPTIONS[0];

    const normalized = search.trim().toLocaleLowerCase();
    const filtered = useMemo(() => {
        const rows = plans ?? [];
        if (!normalized) return rows;
        return rows.filter((plan) => {
            const projectName = plan.projectId ? projectDisplayName(projectIndex.get(plan.projectId)) : undefined;
            const haystack = [
                plan.name,
                plan.id,
                plan.status,
                plan.projectId,
                plan.ownerId,
                projectName,
            ]
                .filter((value): value is string => Boolean(value))
                .map((value) => value.toLocaleLowerCase());
            return haystack.some((value) => value.includes(normalized));
        });
    }, [plans, normalized, projectIndex]);

    // 全部状态时按各状态计数；与 STATUS_OPTIONS 顺序保持一致，未知状态聚合到尾部
    const statusBreakdown = useMemo(() => {
        const rows = plans ?? [];
        const counts = new Map<string, number>();
        for (const plan of rows) {
            const key = plan.status ?? "";
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const known: { title: string; value: string; count: number }[] = STATUS_OPTIONS
            .filter((option) => option.value !== STATUS_ALL)
            .map((option) => ({
                title: option.title,
                value: option.value,
                count: counts.get(option.value) ?? 0,
            }));
        const knownValues = new Set(known.map((entry) => entry.value));
        const unknown: { title: string; value: string; count: number }[] = Array.from(counts.entries())
            .filter(([key]) => key && !knownValues.has(key))
            .map(([key, count]) => ({ title: key, value: key, count }));
        return known.concat(unknown);
    }, [plans]);

    const statusTitleText = useMemo(() => {
        if (statusFilter !== STATUS_ALL) return statusOption.title;
        const parts = statusBreakdown.map((entry) => `${entry.title} ${entry.count}`);
        return parts.length > 0 ? `全部状态 · ${parts.join(" · ")}` : "全部状态";
    }, [statusFilter, statusBreakdown, statusOption.title]);

    function reload() {
        setReloadKey((value) => value + 1);
    }

    const projectFilterLabel =
        projectFilter === PROJECT_ALL
            ? "全部项目"
            : projectOptions.find((option) => option.value === projectFilter)?.title ?? projectFilter;

    const isLoading = plans === null && !plansError;

    return (
        <List
            isLoading={isLoading}
            filtering={false}
            onSearchTextChange={setSearch}
            searchBarPlaceholder={`搜索测试计划…`}
            searchBarAccessory={
                <List.Dropdown
                    tooltip="项目 + 状态过滤"
                    storeValue={true}
                    value={combineFilter(projectFilter, statusFilter)}
                    onChange={(raw) => {
                        const { project, status } = parseFilter(raw);
                        setProjectFilter(project || PROJECT_ALL);
                        setStatusFilter(status || STATUS_ALL);
                    }}
                >
                    {projectOptions.map((projectOption) =>
                        STATUS_OPTIONS.map((statusOption) => (
                            <List.Dropdown.Item
                                key={combineFilter(projectOption.value, statusOption.value)}
                                value={combineFilter(projectOption.value, statusOption.value)}
                                title={`${projectOption.title} · ${statusOption.title}`}
                            />
                        )),
                    )}
                </List.Dropdown>
            }
        >
            <List.EmptyView
                icon={plansError ? Icon.ExclamationMark : Icon.Bug}
                title={
                    plansError
                        ? "无法加载测试计划"
                        : filtered.length === 0 && plans?.length
                          ? "没有匹配项"
                          : isLoading
                            ? "加载测试计划…"
                            : projectFilter === PROJECT_ALL
                              ? "暂无测试计划"
                              : `该项目暂无测试计划`
                }
                description={
                    plansError?.brief ??
                    (filtered.length === 0 && plans?.length
                        ? "尝试切换项目 / 状态过滤或换个搜索关键词。"
                        : "在 Testhub 创建测试计划后回来查看。")
                }
                actions={
                    plansError?.details ? (
                        <ActionPanel>
                            <Action title="重新加载" icon={Icon.ArrowClockwise} onAction={reload} />
                            <Action.CopyToClipboard
                                title="复制错误详情"
                                content={plansError.details}
                                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                            />
                        </ActionPanel>
                    ) : undefined
                }
            />
            <List.Section title={`测试计划 / ${projectFilterLabel}（${statusTitleText}）`}>
                {filtered.map((plan) => {
                    const projectName = plan.projectId ? projectDisplayName(projectIndex.get(plan.projectId)) : undefined;
                    const subtitleParts: string[] = [];
                    if (projectName && projectFilter === PROJECT_ALL) subtitleParts.push(projectName);
                    subtitleParts.push(plan.id);
                    const accessories: Array<{ tag?: string; text?: string }> = [
                        { tag: statusTitle(plan.status) },
                    ];
                    accessories.push({ text: planTimeRange(plan) });
                    return (
                        <List.Item
                            key={plan.id}
                            icon={Icon.Bug}
                            title={plan.name || `(未命名) ${plan.id}`}
                            subtitle={subtitleParts.join(" · ")}
                            accessories={accessories}
                            actions={
                                <ActionPanel>
                                    <Action.OpenInBrowser title="在 Testhub 中打开" url={testPlanUrl(plan.id)} />
                                    <Action.CopyToClipboard title="复制计划 ID" content={plan.id} />
                                    {projectFilter === PROJECT_ALL && projectsError?.details ? (
                                        <Action.CopyToClipboard
                                            title="复制项目列表错误详情"
                                            content={projectsError.details}
                                            shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
                                        />
                                    ) : null}
                                </ActionPanel>
                            }
                        />
                    );
                })}
            </List.Section>
        </List>
    );
}
