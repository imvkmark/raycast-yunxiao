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
        id: "list-projects",
        title: "项目列表",
        subtitle: "浏览我可访问的云效项目",
        icon: Icon.Folder,
        open: { name: "list-projects" },
    },
    {
        id: "codeup",
        title: "代码管理",
        subtitle: "Codeup 总览：代码库与合并请求命令入口",
        icon: Icon.Globe,
        open: { name: "codeup" },
    },
    {
        id: "list-repositories",
        title: "代码库",
        subtitle: "按名称 / 路径 / 命名空间筛选组织内的代码库",
        icon: Icon.Folder,
        open: { name: "list-repositories" },
    },
    {
        id: "list-merge-requests",
        title: "合并请求",
        subtitle: "按状态筛选开启 / 已合并 / 已关闭的合并请求",
        icon: Icon.Link,
        open: { name: "list-merge-requests" },
    },
    {
        id: "list-test-plans",
        title: "测试计划",
        subtitle: "按项目列出测试计划，支持 TODO / DOING / DONE 状态过滤",
        icon: Icon.Bug,
        open: { name: "list-test-plans" },
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
