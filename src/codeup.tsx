/**
 * Codeup 命令（codeup）。
 * 代码管理（云效 Codeup）的总览页：
 *   - 「我的项目」分区内的「代码库」「合并请求」两个入口，分别跳转到底层命令
 *     `list-repositories` / `list-merge-requests`（由 package.json 注册）。
 *
 * Codeup 浏览器快速入口（代码库 / 代码组 / 合并请求）已合并到 `yunxiao-entry` 的
 * 「代码管理」分组下，避免重复入口。
 *
 * 列表的具体实现已抽到 `src/list-repositories.tsx` 与 `src/list-merge-requests.tsx`，
 * 这里只承担"概览 + 跳转"的角色，不重复实现列表加载、错误展示等逻辑。
 */
import { Action, ActionPanel, Icon, LaunchType, List, launchCommand } from "@raycast/api";

export default function Codeup() {
    return (
        <List navigationTitle="Codeup">
            <List.Section title="我的项目">
                <List.Item
                    icon={Icon.Folder}
                    title="代码库"
                    subtitle="我参与的代码库，支持名称 / 路径 / 命名空间本地搜索"
                    actions={
                        <ActionPanel>
                            <Action
                                title="查看代码库"
                                onAction={() =>
                                    launchCommand({ name: "list-repositories", type: LaunchType.UserInitiated })
                                }
                            />
                        </ActionPanel>
                    }
                />
                <List.Item
                    icon={Icon.Link}
                    title="合并请求"
                    subtitle="支持按开启 / 已合并 / 已关闭 状态筛选"
                    actions={
                        <ActionPanel>
                            <Action
                                title="查看合并请求"
                                onAction={() =>
                                    launchCommand({
                                        name: "list-merge-requests",
                                        type: LaunchType.UserInitiated,
                                    })
                                }
                            />
                        </ActionPanel>
                    }
                />
            </List.Section>
        </List>
    );
}
