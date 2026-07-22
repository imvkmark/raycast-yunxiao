/**
 * 云效扩展根菜单。
 * 提供统一的 List 入口，分子集（任务、项目、代码、测试）。
 */

import { Action, ActionPanel, Icon, LaunchType, List, Toast, launchCommand, showToast } from "@raycast/api";
import { useState } from "react";

interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: Icon;
  /** 通过 launchCommand 跳转到其他命令；不传则为占位提示 */
  open?: { name: string; arguments?: Record<string, string> };
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "yunxiao-entry",
    title: "Yunxiao Entry",
    subtitle: "工作台 / 项目协作 / 测试管理 / 代码管理 / 制品仓库 / 企业管理后台 / 个人设置",
    icon: Icon.Link,
    open: { name: "yunxiao-entry" },
  },
  {
    id: "my-yunxiao",
    title: "我的云效",
    subtitle: "我负责的工作项 / 我参与的项目",
    icon: Icon.Person,
    open: { name: "my-yunxiao" },
  },
  {
    id: "list-tasks",
    title: "任务列表",
    subtitle: "按项目与类别过滤查看我的工作项",
    icon: Icon.List,
    open: { name: "list-tasks" },
  },
  {
    id: "list-projects",
    title: "项目列表",
    subtitle: "浏览我可访问的云效项目",
    icon: Icon.Folder,
    open: { name: "list-projects" },
  },
  {
    id: "code-overview",
    title: "代码总览",
    subtitle: "即将推出",
    icon: Icon.Code,
  },
  {
    id: "list-test-plans",
    title: "测试计划",
    subtitle: "即将推出",
    icon: Icon.Bug,
  },
];

export default function Menu() {
  const [filter, setFilter] = useState("");

  async function open(item: MenuItem) {
    if (!item.open) {
      await showToast({
        style: Toast.Style.Success,
        title: "即将推出",
        message: `${item.title} 模块正在设计中。`,
      });
      return;
    }
    try {
      await launchCommand({
        name: item.open.name,
        type: LaunchType.UserInitiated,
        ...(item.open.arguments ? { arguments: item.open.arguments } : {}),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await showToast({ style: Toast.Style.Failure, title: "跳转失败", message: msg });
    }
  }

  const items = MENU_ITEMS.filter((m) => (filter ? m.title.includes(filter) || m.subtitle.includes(filter) : true));

  return (
    <List filtering={false} onSearchTextChange={setFilter} searchBarPlaceholder="搜索云效子模块…">
      <List.Section title="云效">
        {items.map((item) => (
          <List.Item
            key={item.id}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            actions={
              <ActionPanel>
                <Action title={item.open ? "打开" : "提示即将推出"} onAction={() => open(item)} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.EmptyView icon={Icon.MagnifyingGlass} title="无匹配项" />
    </List>
  );
}
