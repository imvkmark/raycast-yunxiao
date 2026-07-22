/**
 * 任务列表命令（list-tasks）。
 * 顶部提供项目下拉与类别下拉，触发后渲染工作项列表。
 * 支持分页（nextToken）。
 */

import {
  Action,
  ActionPanel,
  Form,
  Icon,
  LaunchType,
  List,
  Toast,
  launchCommand,
  showToast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { listWorkitems } from "./api/workitems";
import { listProjects } from "./api/projects";
import { WORKITEM_CATEGORIES, type Project, type Workitem, type WorkitemCategory } from "./api/types";
import { categoryLabel } from "./utils/format";

interface Arguments {
  projectId?: string;
  category?: string;
}

const ALL_PROJECT_VALUE = "__ALL__";
const ALL_CATEGORY_VALUE = "All";

const CATEGORY_OPTIONS: { value: WorkitemCategory | "All"; title: string }[] = [
  { value: "All", title: "全部类别" },
  ...WORKITEM_CATEGORIES.map((c) => ({ value: c, title: `${categoryLabel(c)} (${c})` })),
];

function normalizeCategory(input: string | undefined): WorkitemCategory | "All" | undefined {
  if (!input) return undefined;
  if (input === "All") return "All";
  if (WORKITEM_CATEGORIES.includes(input as WorkitemCategory)) {
    return input as WorkitemCategory;
  }
  return undefined;
}

export default function ListTasks({ arguments: args }: { arguments?: Arguments } = {}) {
  const { push } = useNavigation();
  const initialProject = (args?.projectId ?? "").trim();
  const initialCategory = normalizeCategory(args?.category);

  const [projectId, setProjectId] = useState<string>(initialProject || ALL_PROJECT_VALUE);
  const [category, setCategory] = useState<string>(initialCategory ?? ALL_CATEGORY_VALUE);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectError, setProjectError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listProjects();
        if (!cancelled) {
          setProjects(items);
          if (items.length === 0) setProjectError("没有可访问的项目。");
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setProjectError(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(values: { projectId: string; category: string }) {
    const pid = values.projectId === ALL_PROJECT_VALUE ? "" : values.projectId;
    const cat = (values.category || ALL_CATEGORY_VALUE) as WorkitemCategory | "All";
    if (!pid) {
      void showToast({
        style: Toast.Style.Failure,
        title: "请选择项目",
        message: "任务列表需要按项目过滤，请先选择一个项目。",
      });
      return;
    }
    push(<TaskResult projectId={pid} category={cat} projectName={findProjectName(projects ?? [], pid)} />);
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="查看任务"
            onSubmit={(values) => handleSubmit(values as { projectId: string; category: string })}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="projectId" title="项目" value={projectId} onChange={(v) => setProjectId(v)}>
        <Form.Dropdown.Item value={ALL_PROJECT_VALUE} title="全部项目（必选）" />
        {(projects ?? []).map((p) => (
          <Form.Dropdown.Item key={p.id} value={p.id} title={p.name ? `${p.name} (${p.identifier ?? p.id})` : p.id} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="category" title="类别" value={category} onChange={setCategory}>
        {CATEGORY_OPTIONS.map((c) => (
          <Form.Dropdown.Item key={c.value} value={c.value} title={c.title} />
        ))}
      </Form.Dropdown>
      <Form.Description
        text={
          projectError
            ? `项目列表加载失败：${projectError}`
            : projects === null
              ? "正在加载项目…"
              : "选择项目与类别后按 Cmd+Return 加载工作项。"
        }
      />
    </Form>
  );
}

function findProjectName(projects: Project[], id: string): string {
  const p = projects.find((x) => x.id === id);
  return p?.name ?? id;
}

interface TaskResultProps {
  projectId: string;
  category: WorkitemCategory | "All";
  projectName: string;
}

function TaskResult({ projectId, category, projectName }: TaskResultProps) {
  const [items, setItems] = useState<Workitem[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();

  const reload = useMemo(
    () => async () => {
      setLoading(true);
      setError(undefined);
      try {
        const res = await listWorkitems({
          projectId,
          category,
          page: 1,
          perPage: 200,
        });
        setItems(res.items);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        await showToast({ style: Toast.Style.Failure, title: "加载失败", message: msg });
      } finally {
        setLoading(false);
      }
    },
    [projectId, category],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  async function openWorkitem(item: Workitem) {
    try {
      await launchCommand({
        name: "get-workitem",
        type: LaunchType.UserInitiated,
        arguments: {
          workitemId: item.id,
          projectId: item.projectId ?? projectId,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await showToast({ style: Toast.Style.Failure, title: "打开详情失败", message: msg });
    }
  }

  const titleSuffix = category === "All" ? "全部类别" : categoryLabel(category);

  return (
    <List isLoading={isLoading} searchBarPlaceholder={`在 ${projectName} · ${titleSuffix} 中筛选…`}>
      <List.EmptyView
        icon={error ? Icon.ExclamationMark : Icon.Checkmark}
        title={error ? "无法加载工作项" : items.length === 0 ? "暂无工作项" : "没有匹配项"}
        description={error ?? "尝试切换项目或类别后再试一次。"}
        actions={
          error ? (
            <ActionPanel>
              <Action title="重新加载" onAction={() => void reload()} />
            </ActionPanel>
          ) : undefined
        }
      />
      <List.Section title={`${projectName} · ${titleSuffix}`}>
        {items.map((w) => (
          <List.Item
            key={w.id}
            icon={iconForCategory(w.category)}
            title={w.subject ?? "(无标题)"}
            subtitle={w.identifier ?? w.id}
            accessories={[
              { tag: { value: w.category ? categoryLabel(w.category) : "-", color: undefined } },
              { text: w.assignee?.name ?? "未指派" },
              { tag: { value: w.status?.name ?? "-", color: undefined } },
            ]}
            actions={
              <ActionPanel>
                <Action title="查看详情" icon={Icon.Eye} onAction={() => openWorkitem(w)} />
                <Action.CopyToClipboard title="复制工作项 ID" content={w.id} />
                <Action.OpenInBrowser
                  title="在云效中打开"
                  url={`https://devops.aliyun.com/project/${encodeURIComponent(
                    w.projectId ?? projectId,
                  )}/workitem/${encodeURIComponent(w.id)}`}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

function iconForCategory(category: WorkitemCategory | string | undefined): Icon {
  switch (category) {
    case "Bug":
      return Icon.Bug;
    case "Task":
      return Icon.Checkmark;
    case "Req":
      return Icon.Document;
    case "Risk":
      return Icon.ExclamationMark;
    case "Request":
      return Icon.Envelope;
    case "Topic":
      return Icon.Tag;
    default:
      return Icon.Circle;
  }
}
