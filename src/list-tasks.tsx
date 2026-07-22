/**
 * 任务列表命令（list-tasks）。
 * 有 projectId 参数时直达工作项列表；否则先显示项目选择表单。
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
import { useEffect, useMemo, useRef, useState } from "react";
import { listProjects } from "./api/projects";
import { WORKITEM_CATEGORIES, type Project, type Workitem, type WorkitemCategory } from "./api/types";
import { listWorkitems } from "./api/workitems";
import { categoryLabel } from "./utils/format";
import { workitemUrl } from "./utils/urls";

interface Arguments {
  projectId?: string;
  category?: string;
}

const ALL_PROJECT_VALUE = "__ALL__";
const ALL_CATEGORY_VALUE = "All";
type CategoryFilter = WorkitemCategory | typeof ALL_CATEGORY_VALUE;

const CATEGORY_OPTIONS: { value: CategoryFilter; title: string }[] = [
  { value: ALL_CATEGORY_VALUE, title: "全部" },
  ...WORKITEM_CATEGORIES.map((category) => ({ value: category, title: categoryLabel(category) })),
];

function normalizeCategory(input: string | undefined): CategoryFilter {
  const normalized = input?.trim();
  if (normalized === ALL_CATEGORY_VALUE || WORKITEM_CATEGORIES.includes(normalized as WorkitemCategory)) {
    return normalized as CategoryFilter;
  }
  return ALL_CATEGORY_VALUE;
}

export default function ListTasks({ arguments: args }: { arguments?: Arguments } = {}) {
  const projectId = (args?.projectId ?? "").trim();
  const category = normalizeCategory(args?.category);

  if (projectId) {
    return <TaskResult projectId={projectId} initialCategory={category} projectName={projectId} />;
  }

  return <ProjectSelectionForm initialCategory={category} />;
}

function ProjectSelectionForm({ initialCategory }: { initialCategory: CategoryFilter }) {
  const { push } = useNavigation();
  const [projectId, setProjectId] = useState(ALL_PROJECT_VALUE);
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectError, setProjectError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await listProjects();
        if (!cancelled) {
          setProjects(items);
          if (items.length === 0) setProjectError("没有可访问的项目。");
        }
      } catch (err) {
        if (!cancelled) setProjectError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(values: { projectId: string; category: CategoryFilter }) {
    const selectedProjectId = values.projectId === ALL_PROJECT_VALUE ? "" : values.projectId;
    if (!selectedProjectId) {
      void showToast({
        style: Toast.Style.Failure,
        title: "请选择项目",
        message: "任务列表需要按项目过滤，请先选择一个项目。",
      });
      return;
    }
    push(
      <TaskResult
        projectId={selectedProjectId}
        initialCategory={values.category}
        projectName={findProjectName(projects ?? [], selectedProjectId)}
      />,
    );
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="查看任务"
            onSubmit={(values) => handleSubmit(values as { projectId: string; category: CategoryFilter })}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="projectId" title="项目" value={projectId} onChange={setProjectId}>
        <Form.Dropdown.Item value={ALL_PROJECT_VALUE} title="请选择项目" />
        {(projects ?? []).map((project) => (
          <Form.Dropdown.Item
            key={project.id}
            value={project.id}
            title={project.name ? `${project.name} (${project.identifier ?? project.id})` : project.id}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        id="category"
        title="类别"
        value={category}
        onChange={(value) => setCategory(normalizeCategory(value))}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <Form.Dropdown.Item key={option.value} value={option.value} title={option.title} />
        ))}
      </Form.Dropdown>
      <Form.Description
        text={
          projectError
            ? `项目列表加载失败：${projectError}`
            : projects === null
              ? "正在加载项目…"
              : "选择项目与类别后加载工作项。"
        }
      />
    </Form>
  );
}

function findProjectName(projects: Project[], id: string): string {
  return projects.find((project) => project.id === id)?.name ?? id;
}

interface TaskResultProps {
  projectId: string;
  initialCategory: CategoryFilter;
  projectName: string;
}

function TaskResult({ projectId, initialCategory, projectName }: TaskResultProps) {
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [items, setItems] = useState<Workitem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [reloadGeneration, setReloadGeneration] = useState(0);
  const requestGeneration = useRef(0);

  useEffect(() => {
    const generation = ++requestGeneration.current;
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    void (async () => {
      try {
        const result = await listWorkitems({
          projectId,
          category,
          page: 1,
          perPage: 200,
          signal: controller.signal,
        });
        if (generation === requestGeneration.current) setItems(result.items);
      } catch (err) {
        if (controller.signal.aborted || generation !== requestGeneration.current) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        await showToast({ style: Toast.Style.Failure, title: "加载失败", message });
      } finally {
        if (generation === requestGeneration.current) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [projectId, category, reloadGeneration]);

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
      const message = err instanceof Error ? err.message : String(err);
      await showToast({ style: Toast.Style.Failure, title: "打开详情失败", message });
    }
  }

  const normalizedSearch = searchText.trim().toLocaleLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return items;
    return items.filter((item) =>
      [
        item.subject,
        item.identifier,
        item.category,
        categoryLabel(item.category),
        item.assignee?.name,
        item.status?.name,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(normalizedSearch)),
    );
  }, [items, normalizedSearch]);
  const titleSuffix = category === ALL_CATEGORY_VALUE ? "全部" : categoryLabel(category);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={`搜索 ${projectName} · ${titleSuffix} 的工作项…`}
      searchBarAccessory={
        <List.Dropdown
          tooltip="工作项类别"
          value={category}
          onChange={(value) => setCategory(normalizeCategory(value))}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <List.Dropdown.Item key={option.value} value={option.value} title={option.title} />
          ))}
        </List.Dropdown>
      }
    >
      <List.EmptyView
        icon={error ? Icon.ExclamationMark : Icon.MagnifyingGlass}
        title={error ? "无法加载工作项" : items.length === 0 ? "暂无工作项" : "没有匹配项"}
        description={error ?? (items.length === 0 ? "尝试切换类别后再试一次。" : "尝试其他搜索关键词。")}
        actions={
          error ? (
            <ActionPanel>
              <Action title="重新加载" onAction={() => setReloadGeneration((value) => value + 1)} />
            </ActionPanel>
          ) : undefined
        }
      />
      <List.Section title={`${projectName} · ${titleSuffix}`}>
        {filteredItems.map((workitem) => {
          const browserUrl = workitemUrl(workitem.projectId ?? projectId, workitem.category, workitem.id);
          return (
            <List.Item
              key={workitem.id}
              icon={iconForCategory(workitem.category)}
              title={workitem.subject ?? "(无标题)"}
              subtitle={workitem.identifier ?? workitem.id}
              accessories={[
                { tag: { value: workitem.category ? categoryLabel(workitem.category) : "-", color: undefined } },
                { text: workitem.assignee?.name ?? "未指派" },
                { tag: { value: workitem.status?.name ?? "-", color: undefined } },
              ]}
              actions={
                <ActionPanel>
                  <Action title="查看详情" icon={Icon.Eye} onAction={() => openWorkitem(workitem)} />
                  <Action.CopyToClipboard title="复制工作项 ID" content={workitem.id} />
                  {browserUrl ? <Action.OpenInBrowser title="在云效中打开" url={browserUrl} /> : null}
                </ActionPanel>
              }
            />
          );
        })}
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
