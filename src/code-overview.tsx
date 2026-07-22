/**
 * 代码总览（占位）。后续阶段实现仓库列表与最近 commits。
 */

import { Action, ActionPanel, Detail, Icon, Toast, showToast } from "@raycast/api";

const MARKDOWN = `# 代码总览

模块正在设计中。

下一阶段将支持：

- 列出项目下的代码仓库。
- 查看最近 commits 与 PR。
- 在 Raycast 中快速搜索文件。
`;

export default function CodeOverview() {
  return (
    <Detail
      navigationTitle="代码总览"
      markdown={MARKDOWN}
      actions={
        <ActionPanel>
          <Action
            title="敬请期待"
            icon={Icon.Bell}
            onAction={() =>
              showToast({
                style: Toast.Style.Success,
                title: "模块即将推出",
                message: "关注后续版本以获取代码模块更新。",
              })
            }
          />
        </ActionPanel>
      }
    />
  );
}
