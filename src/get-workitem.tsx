/**
 * 工作项详情命令（get-workitem）。
 * 由 list-projects 的「查看工作项」子视图通过 launchCommand 跳入；也可在 Raycast 中直接调用。
 */

import { Action, ActionPanel, Detail, Icon, Toast, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { type Workitem } from "./api/types";
import { getWorkitem } from "./api/workitems";
import { renderWorkitemMarkdown } from "./utils/format";
import { workitemUrl } from "./utils/urls";

interface Arguments {
  workitemId: string;
  projectId?: string;
}

export default function GetWorkitem({ arguments: args }: { arguments: Arguments }) {
  const [workitem, setWorkitem] = useState<Workitem | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!args?.workitemId) {
        setError("缺少 workitemId。");
        setLoading(false);
        return;
      }
      try {
        const result = await getWorkitem(args.workitemId, args.projectId);
        if (!cancelled) setWorkitem(result);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          await showToast({ style: Toast.Style.Failure, title: "加载详情失败", message });
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
    return (
      <Detail
        isLoading={isLoading}
        markdown={`# 无法加载工作项\n\n**错误：** ${error}`}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="复制错误信息" content={error} />
          </ActionPanel>
        }
      />
    );
  }

  const markdown = workitem ? renderWorkitemMarkdown(workitem) : "加载中…";
  const navigationTitle = workitem?.identifier ?? args?.workitemId ?? "工作项详情";
  const browserUrl = workitem
    ? workitemUrl(workitem.projectId ?? args?.projectId, workitem.category, workitem.id)
    : undefined;

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={navigationTitle}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="复制工作项 ID" content={args?.workitemId ?? ""} />
          <Action.CopyToClipboard title="复制 JSON" content={JSON.stringify(workitem ?? {}, null, 2)} />
          {browserUrl ? <Action.OpenInBrowser title="在云效中打开" url={browserUrl} /> : null}
          {workitem ? <Action.CopyToClipboard title="复制详情为 Markdown" content={markdown} /> : null}
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
