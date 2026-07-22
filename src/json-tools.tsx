import {
  Action,
  ActionPanel,
  Detail,
  Form,
  Toast,
  showToast,
  useNavigation,
} from "@raycast/api";
import { useState } from "react";
import { formatJson, minifyJson } from "./utils/json";
import { unicodeDecode, unicodeEncode } from "./utils/unicode";

type Operation = "format" | "minify" | "encode" | "decode";

const OPERATIONS: { value: Operation; label: string }[] = [
  { value: "format", label: "Format（格式化）" },
  { value: "minify", label: "Minify（压缩）" },
  { value: "encode", label: "Unicode Encode（编码）" },
  { value: "decode", label: "Unicode Decode（解码）" },
];

function ResultView({ result, operation }: { result: string; operation: Operation }) {
  const label = OPERATIONS.find((o) => o.value === operation)?.label ?? operation;
  const markdown = `## ${label}\n\n\`\`\`json\n${result}\n\`\`\``;

  return (
    <Detail
      navigationTitle={label}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Result" content={result} shortcut={{ modifiers: ["cmd"], key: "c" }} />
          <Action.Paste title="Paste to Active App" content={result} shortcut={{ modifiers: ["cmd"], key: "v" }} />
        </ActionPanel>
      }
    />
  );
}

export default function JsonTools() {
  const { push } = useNavigation();
  const [inputError, setInputError] = useState<string | undefined>();

  function handleSubmit(values: { input: string; operation: Operation }) {
    const { input, operation } = values;

    if (!input.trim()) {
      setInputError("请输入 JSON 内容");
      return;
    }

    try {
      let result: string;

      if (operation === "format") {
        result = formatJson(input);
      } else if (operation === "minify") {
        result = minifyJson(input);
      } else if (operation === "encode") {
        // For encode/decode we don't require valid JSON — operate on raw string
        result = unicodeEncode(input);
      } else {
        result = unicodeDecode(input);
      }

      push(<ResultView result={result} operation={operation} />);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showToast({ style: Toast.Style.Failure, title: "Invalid JSON", message });
    }
  }

  return (
    <Form
      navigationTitle="JSON Tools"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Run" onSubmit={handleSubmit} shortcut={{ modifiers: ["cmd"], key: "return" }} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="input"
        title="JSON Input"
        placeholder="粘贴 JSON 内容..."
        error={inputError}
        onChange={() => setInputError(undefined)}
      />
      <Form.Dropdown id="operation" title="Operation" defaultValue="format">
        {OPERATIONS.map((op) => (
          <Form.Dropdown.Item key={op.value} value={op.value} title={op.label} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
