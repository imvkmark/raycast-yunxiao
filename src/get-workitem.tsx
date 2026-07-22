/**
 * 工作项详情命令（get-workitem）。
 * 由 list-tasks 通过 launchCommand 跳入；也可在 Raycast 中直接调用。
 */

import { Action, ActionPanel, Detail, Icon, Toast, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { getWorkitem } from "./api/workitems";
import type { Workitem } from "./api/types";
import { renderWorkitemMarkdown } from "./utils/format";

interface Arguments {
  workitemId: string;
  projectId?: string;
}

export default function GetWorkitem({ arguments: args }: { arguments: Arguments }) {
  const [workitem, setWorkitem] = useState<Workitem | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!args?.workitemId) {
        setError("缺少 workitemId。");
        setLoading(false);
        return;
      }
      try {
        const w = await getWorkitem(args.workitemId, args.projectId);
        if (!cancelled) setWorkitem(w);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          await showToast({ style: Toast.Style.Failure, title: "加载详情失败", message: msg });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [args?.workitemId, args?.projectId]);

  if (error) {
    const markdown = `# 无法加载工作项\n\n**错误：** ${error}`;
    return (
      <Detail
        isLoading={isLoading}
        markdown={markdown}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="复制错误信息" content={error} />
            <Action.OpenInBrowser
              title="在云效中打开"
              url={`https://devops.aliyun.com/${
                args?.projectId ? `project/${encodeURIComponent(args.projectId)}/` : ""
              }workitem/${encodeURIComponent(args?.workitemId ?? "")}`}
            />
          </ActionPanel>
        }
      />
    );
  }

  const markdown = workitem ? renderWorkitemMarkdown(workitem) : "加载中…";
  const navigationTitle = workitem?.identifier ?? args?.workitemId ?? "工作项详情";

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={navigationTitle}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="复制工作项 ID"
            content={args?.workitemId ?? ""}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard title="复制 JSON" content={JSON.stringify(workitem ?? {}, null, 2)} />
          <Action.OpenInBrowser
            title="在云效中打开"
            url={`https://devops.aliyun.com/${args?.projectId ? `project/${encodeURIComponent(args.projectId)}/` : ""}workitem/${encodeURIComponent(args?.workitemId ?? "")}`}
          />
          {workitem ? <Action.Paste title="复制详情为 Markdown" content={markdown} /> : null}
          <Action.OpenInBrowser
            icon={Icon.Book}
            title="开发文档"
            url="https://help.aliyun.com/document_detail/460575.html"
          />
        </ActionPanel>
      }
    />
  );
}
