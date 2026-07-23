/**
 * 测试计划列表命令（list-test-plans）。
 *
 * 流程：
 *   1. 进入时弹出「选择项目」表单；
 *   2. 选定项目后进入 TestPlansView 列出该项目的测试计划；
 *   3. 搜索栏右侧提供状态过滤下拉（全部 / TODO / DOING / DONE）；
 *   4. 选中计划后可在 Testhub 中打开，或复制计划 ID。
 *
 * 错误展示策略与 `list-projects.tsx` / `list-repositories.tsx` 一致：
 * toast 只显示一行短因，详情保留在 EmptyView + 「复制错误详情」动作里。
 */

import { Action, ActionPanel, Form, Icon, List, Toast, showToast, useNavigation } from "@raycast/api";
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

const STATUS_OPTIONS: { value: TestPlanStatus | "ALL"; title: string }[] = [
    { value: "ALL", title: "全部" },
    { value: "TODO", title: "未开始" },
    { value: "DOING", title: "进行中" },
    { value: "DONE", title: "已完成" },
];

function statusFilterValue(value: TestPlanStatus | "ALL"): TestPlanStatus | undefined {
    return value === "ALL" ? undefined : value;
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

/* ---------- Root command ---------- */

export default function ListTestPlans() {
    const { push } = useNavigation();
    const [projects, setProjects] = useState<Project[] | null>(null);
    const [error, setError] = useState<string>();
    const [errorDetails, setErrorDetails] = useState<string>();
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const items = await listProjects({ perPage: 200 });
                if (cancelled) return;
                setProjects(items);
                if (items.length === 0) {
                    setError("当前组织下没有可访问的项目。");
                }
            } catch (err) {
                if (cancelled) return;
                const { brief, details } = toErrorDetails(err);
                setError(brief);
                setErrorDetails(details);
                await showToast({ style: Toast.Style.Failure, title: "加载项目失败", message: brief });
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // 项目准备好且只剩一个时，自动选中以减少一步操作
    useEffect(() => {
        if (!projects || projects.length === 0) return;
        if (projects.length === 1 && !selectedProjectId) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    if (error && (!projects || projects.length === 0)) {
        return (
            <List>
                <List.EmptyView
                    icon={Icon.ExclamationMark}
                    title="无法加载项目"
                    description={error}
                    actions={
                        <ActionPanel>
                            <Action.CopyToClipboard
                                title="复制错误详情"
                                content={errorDetails ?? error}
                                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                            />
                        </ActionPanel>
                    }
                />
            </List>
        );
    }

    if (!projects) {
        return <List isLoading={true} searchBarPlaceholder="加载项目中…" />;
    }

    function submit(projectId: string) {
        if (!projectId) return;
        const project = projects?.find((p) => p.id === projectId);
        if (!project) return;
        push(<TestPlansView projectId={project.id} projectName={project.name ?? project.identifier ?? project.id} />);
    }

    return (
        <Form
            actions={
                <ActionPanel>
                    <Action.SubmitForm
                        title="查看测试计划"
                        onSubmit={(values: { projectId: string }) => submit(values.projectId)}
                    />
                </ActionPanel>
            }
        >
            <Form.Dropdown id="projectId" title="选择项目" value={selectedProjectId} onChange={setSelectedProjectId}>
                {projects.map((p) => (
                    <Form.Dropdown.Item key={p.id} value={p.id} title={p.name ?? p.identifier ?? p.id} />
                ))}
            </Form.Dropdown>
        </Form>
    );
}

/* ---------- TestPlans sub-view ---------- */

interface TestPlansViewProps {
    projectId: string;
    projectName: string;
}

function TestPlansView({ projectId, projectName }: TestPlansViewProps) {
    const [plans, setPlans] = useState<TestPlan[] | null>(null);
    const [error, setError] = useState<string>();
    const [errorDetails, setErrorDetails] = useState<string>();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TestPlanStatus | "ALL">("ALL");

    function load() {
        setPlans(null);
        setError(undefined);
        setErrorDetails(undefined);
        const controller = new AbortController();
        void listTestPlans({
            projectId,
            status: statusFilterValue(statusFilter),
            signal: controller.signal,
        })
            .then((items) => {
                setPlans(items);
            })
            .catch(async (reason) => {
                if (controller.signal.aborted) return;
                const { brief, details } = toErrorDetails(reason);
                setError(brief);
                setErrorDetails(details);
                await showToast({ style: Toast.Style.Failure, title: "加载测试计划失败", message: brief });
            });
        return controller;
    }

    useEffect(() => {
        const controller = load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, statusFilter]);

    const statusOption = STATUS_OPTIONS.find((option) => option.value === statusFilter) ?? STATUS_OPTIONS[0];

    const normalized = search.trim().toLocaleLowerCase();
    const filtered = useMemo(() => {
        const rows = plans ?? [];
        if (!normalized) return rows;
        return rows.filter((plan) =>
            [plan.name, plan.id, plan.status, plan.projectId, plan.ownerId]
                .filter((value): value is string => Boolean(value))
                .some((value) => value.toLocaleLowerCase().includes(normalized)),
        );
    }, [plans, normalized]);

    return (
        <List
            isLoading={plans === null && !error}
            filtering={false}
            onSearchTextChange={setSearch}
            searchBarPlaceholder={`搜索 ${projectName} 的测试计划…`}
            searchBarAccessory={
                <List.Dropdown
                    tooltip="测试计划状态"
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as TestPlanStatus | "ALL")}
                >
                    {STATUS_OPTIONS.map((option) => (
                        <List.Dropdown.Item key={option.value} value={option.value} title={option.title} />
                    ))}
                </List.Dropdown>
            }
        >
            <List.EmptyView
                icon={error ? Icon.ExclamationMark : Icon.Bug}
                title={
                    error
                        ? "无法加载测试计划"
                        : plans?.length
                          ? "没有匹配项"
                          : `暂无${statusOption.title === "全部" ? "" : statusOption.title}测试计划`
                }
                description={error ?? (plans?.length ? "尝试其他搜索关键词。" : "在 Testhub 创建测试计划后回来查看。")}
                actions={
                    error && errorDetails ? (
                        <ActionPanel>
                            <Action title="重新加载" icon={Icon.ArrowClockwise} onAction={() => load()} />
                            <Action.CopyToClipboard
                                title="复制错误详情"
                                content={errorDetails}
                                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                            />
                        </ActionPanel>
                    ) : undefined
                }
            />
            <List.Section title={`测试计划 / ${projectName}（${statusOption.title}）`}>
                {filtered.map((plan) => {
                    const accessories: Array<{ tag?: string; text?: string }> = [{ tag: statusTitle(plan.status) }];
                    if (plan.createdAt) accessories.push({ text: plan.createdAt.slice(0, 10) });
                    return (
                        <List.Item
                            key={plan.id}
                            icon={Icon.Bug}
                            title={plan.name || `(未命名) ${plan.id}`}
                            subtitle={plan.id}
                            accessories={accessories}
                            actions={
                                <ActionPanel>
                                    <Action.OpenInBrowser title="在 Testhub 中打开" url={testPlanUrl(plan.id)} />
                                    <Action.CopyToClipboard title="复制计划 ID" content={plan.id} />
                                </ActionPanel>
                            }
                        />
                    );
                })}
            </List.Section>
        </List>
    );
}
