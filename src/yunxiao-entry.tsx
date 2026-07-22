/**
 * 云效入口（yunxiao-entry）。
 *
 * 一键直达 8 个常用云效门户：
 *   工作台 / 项目协作 / 项目协作(个人工作项) / 测试管理 / 代码管理 /
 *   制品仓库 / 企业管理后台 / 个人设置
 *
 * 绝大多数是静态深链，直接 Action.OpenInBrowser；
 * 「企业管理后台」URL 含 {project_id}，因此：
 *   - 主快捷键 ⌘⇧M 走「默认项目」逻辑：用 listProjects() 拿到的第一个项目拼 URL；
 *   - 二级动作「选择项目」push 项目选择器，便于在多个项目间切换。
 *
 * 设计上尽量不依赖网络：除「企业管理后台」之外，其他条目无网络请求，
 * PAT 凭证缺失也不会阻塞（这些链接走浏览器登录态）。
 */

import { Action, ActionPanel, Icon, Keyboard, List, Toast, open, showToast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { listProjects } from "./api/projects";
import type { Project } from "./api/types";

const BASE = "https://devops.aliyun.com";

/** 跳到 devops 测试/制品等其它子域的根 */
const CODEUP_ROOT = "https://codeup.aliyun.com/";
const PACKAGES_ROOT = "https://packages.aliyun.com/";
const ACCOUNT_ROOT = "https://account-devops.aliyun.com";

/** 「个人工作项」视图的 viewIdentifier（云效固定值，从官方页面 URL 复制） */
const PERSONAL_WORKITEM_VIEW_ID = "441e17ad4f72718076eedcf5";

interface PortalItem {
  id: string;
  title: string;
  subtitle: string;
  /** assets/ 下的图标文件名 */
  iconSource: string;
  /** 静态 URL；dynamic 时为 null */
  url: string | null;
  /** 列表项主快捷键 */
  shortcut: { modifiers: Keyboard.KeyModifier[]; key: Keyboard.KeyEquivalent };
  /** 该条目需要选 projectId 才能拼 URL */
  dynamic?: "pick-project";
}

const PORTAL_ITEMS: PortalItem[] = [
  {
    id: "workbench",
    title: "工作台",
    subtitle: "通知、待办、最近访问",
    iconSource: "assets/icon.svg",
    url: `${BASE}/workbench`,
    shortcut: { modifiers: ["cmd", "shift"], key: "h" },
  },
  {
    id: "projex",
    title: "项目协作",
    subtitle: "项目协作总览页",
    iconSource: "assets/project.svg",
    url: `${BASE}/projex/project`,
    shortcut: { modifiers: ["cmd", "shift"], key: "p" },
  },
  {
    id: "projex-mine",
    title: "项目协作（个人工作项）",
    subtitle: "我负责的全部工作项视图",
    iconSource: "assets/project.svg",
    url: `${BASE}/projex/workitem#viewIdentifier=${PERSONAL_WORKITEM_VIEW_ID}`,
    shortcut: { modifiers: ["cmd", "shift"], key: "a" },
  },
  {
    id: "testhub",
    title: "测试管理",
    subtitle: "Testhub 仓库 / 用例库",
    iconSource: "assets/testhub.svg",
    url: `${BASE}/testhub/repo`,
    shortcut: { modifiers: ["cmd", "shift"], key: "t" },
  },
  {
    id: "codeup",
    title: "代码管理",
    subtitle: "Codeup 代码仓库主页",
    iconSource: "assets/codeup.svg",
    url: CODEUP_ROOT,
    shortcut: { modifiers: ["cmd", "shift"], key: "c" },
  },
  {
    id: "packages",
    title: "制品仓库",
    subtitle: "Packages 私有制品库",
    iconSource: "assets/packages.svg",
    url: PACKAGES_ROOT,
    shortcut: { modifiers: ["cmd", "shift"], key: "r" },
  },
  {
    id: "org-admin",
    title: "企业管理后台",
    subtitle: "成员 / 权限管理（默认用第一个项目，可切换）",
    iconSource: "assets/org-admin.svg",
    url: null,
    dynamic: "pick-project",
    shortcut: { modifiers: ["cmd", "shift"], key: "m" },
  },
  {
    id: "personal-settings",
    title: "个人设置",
    subtitle: "PAT / 个人偏好 / 头像",
    iconSource: "assets/icon.svg",
    url: `${ACCOUNT_ROOT}/settings/profile`,
    shortcut: { modifiers: ["cmd", "shift"], key: "s" },
  },
];

/* ---------- 主命令 ---------- */

export default function YunxiaoEntry() {
  const { push } = useNavigation();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectError, setProjectError] = useState<string | undefined>();

  /** 提前加载项目列表，给「企业管理后台」拼默认 URL；不影响其他条目 */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listProjects();
        if (!cancelled) setProjects(list);
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

  function resolveUrl(item: PortalItem): string | null {
    if (item.url) return item.url;
    if (item.dynamic === "pick-project") {
      if (!projects || projects.length === 0) return null;
      const first = projects[0];
      return `${BASE}/org-admin/${encodeURIComponent(first.id)}/members/member`;
    }
    return null;
  }

  async function openItem(item: PortalItem) {
    const url = resolveUrl(item);
    if (!url) {
      await showToast({
        style: Toast.Style.Failure,
        title: "无法跳转",
        message:
          item.dynamic === "pick-project"
            ? (projectError ?? "需要至少一个项目，请先在 devops.aliyun.com 加入组织。")
            : "没有可用的链接。",
      });
      return;
    }
    try {
      await open(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await showToast({ style: Toast.Style.Failure, title: "打开失败", message: msg });
    }
  }

  function pickProject() {
    push(
      <OrgAdminProjectPicker
        projects={projects}
        error={projectError}
        onPick={(p) => {
          const url = `${BASE}/org-admin/${encodeURIComponent(p.id)}/members/member`;
          void open(url);
        }}
        onRetry={() => {
          void (async () => {
            setProjectError(undefined);
            try {
              const list = await listProjects();
              setProjects(list);
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err);
              setProjectError(msg);
            }
          })();
        }}
      />,
    );
  }

  return (
    <List filtering={false} searchBarPlaceholder="搜索云效入口…">
      <List.Section title="云效门户">
        {PORTAL_ITEMS.map((item) => {
          const isDynamic = item.dynamic === "pick-project";
          const primaryUrl = isDynamic ? null : item.url;
          return (
            <List.Item
              key={item.id}
              icon={{ source: item.iconSource }}
              title={item.title}
              subtitle={item.subtitle}
              actions={
                <ActionPanel>
                  {primaryUrl ? (
                    <Action.OpenInBrowser title={item.title} url={primaryUrl} shortcut={item.shortcut} />
                  ) : (
                    <Action
                      title={item.title}
                      icon={Icon.Link}
                      shortcut={item.shortcut}
                      onAction={() => openItem(item)}
                    />
                  )}
                  {isDynamic ? <Action title="选择项目" icon={Icon.Folder} onAction={() => pickProject()} /> : null}
                  <Action.CopyToClipboard
                    title="复制链接"
                    content={isDynamic ? `${BASE}/org-admin/{project_id}/members/member` : (item.url as string)}
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
    </List>
  );
}

/* ---------- 「企业管理后台」项目选择器 ---------- */

interface OrgAdminPickerProps {
  projects: Project[] | null;
  error: string | undefined;
  onPick: (p: Project) => void;
  onRetry: () => void;
}

function OrgAdminProjectPicker({ projects, error, onPick, onRetry }: OrgAdminPickerProps) {
  const items = projects ?? [];
  return (
    <List isLoading={projects === null && !error} filtering={false} searchBarPlaceholder="按项目名称或标识筛选…">
      <List.EmptyView
        icon={error ? Icon.ExclamationMark : Icon.Folder}
        title={error ? "无法加载项目" : "暂无项目"}
        description={error ?? "先去 devops.aliyun.com 加入组织，再回来选择。"}
        actions={
          error ? (
            <ActionPanel>
              <Action title="重新加载" onAction={onRetry} />
            </ActionPanel>
          ) : undefined
        }
      />
      <List.Section title="选择项目（用于企业管理后台）">
        {items.map((p) => (
          <List.Item
            key={p.id}
            icon={Icon.Folder}
            title={p.name ?? "(未命名项目)"}
            subtitle={p.identifier ?? p.id}
            actions={
              <ActionPanel>
                <Action title="打开企业管理后台" icon={Icon.Link} onAction={() => onPick(p)} />
                <Action.CopyToClipboard title="复制项目 ID" content={p.id} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
