/**
 * 我的云效（my-yunxiao）。
 *
 * 两条静态 URL 直跳项,无需 API 调用,无 PAT 凭据依赖:
 *   - 负责的工作项  → https://devops.aliyun.com/projex/workitem
 *   - 参与的项目    → https://devops.aliyun.com/projex/project
 *
 * 设计意图:用户输入「我的云效」即可一键跳到云效内置的「我负责/我参与」视图,
 * 避免在 Raycast 内再起一次 listProjects() 网络请求。
 */

import { Action, ActionPanel, Keyboard, List } from "@raycast/api";

interface MyItem {
  id: string;
  title: string;
  subtitle: string;
  /** assets/ 下的图标文件名 */
  iconSource: string;
  url: string;
  shortcut: { modifiers: Keyboard.KeyModifier[]; key: Keyboard.KeyEquivalent };
}

const MY_ITEMS: MyItem[] = [
  {
    id: "my-workitems",
    title: "负责的工作项",
    subtitle: "我负责的全部工作项视图",
    iconSource: "assets/my.png",
    url: "https://devops.aliyun.com/projex/workitem",
    shortcut: { modifiers: ["cmd", "shift"], key: "a" },
  },
  {
    id: "my-projects",
    title: "参与的项目",
    subtitle: "我参与的全部项目视图",
    iconSource: "assets/project.svg",
    url: "https://devops.aliyun.com/projex/project",
    shortcut: { modifiers: ["cmd", "shift"], key: "p" },
  },
];

export default function MyYunxiao() {
  return (
    <List filtering={false} searchBarPlaceholder="跳转到我的云效…">
      <List.Section title="我的云效">
        {MY_ITEMS.map((item) => (
          <List.Item
            key={item.id}
            icon={{ source: item.iconSource }}
            title={item.title}
            subtitle={item.subtitle}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title={item.title} url={item.url} shortcut={item.shortcut} />
                <Action.CopyToClipboard title="复制链接" content={item.url} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
