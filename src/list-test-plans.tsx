/**
 * 测试计划（占位）。后续阶段实现测试计划与用例。
 */

import { Action, ActionPanel, Detail, Icon, Toast, showToast } from "@raycast/api";

const MARKDOWN = `# 测试计划

模块正在设计中。

下一阶段将支持：

- 列出关联项目的测试计划与用例。
- 一键跳转到用例详情。
- 在云效界面中打开对应的测试报告。
`;

export default function ListTestPlans() {
  return (
    <Detail
      navigationTitle="测试计划"
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
                message: "关注后续版本以获取测试模块更新。",
              })
            }
          />
        </ActionPanel>
      }
    />
  );
}
