/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Personal Access Token - 在 devops.aliyun.com 个人信息 -> 个人访问令牌 中生成。 */
  "personalAccessToken": string,
  /** Organization Id - 企业标识，多企业用户必填。 */
  "organizationId": string,
  /** 接入点 - 中心版与 Region 版的 URL 形态不同：中心版 path 含 organizations/{organizationId}/，Region 版不带。 */
  "endpointMode": "central" | "region",
  /** Region 版 API Base URL - 仅在「接入点 = Region 版」时使用。自部署实例可填自建域名。 */
  "regionUrl"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `menu` command */
  export type Menu = ExtensionPreferences & {}
  /** Preferences accessible in the `yunxiao-entry` command */
  export type YunxiaoEntry = ExtensionPreferences & {}
  /** Preferences accessible in the `my-yunxiao` command */
  export type MyYunxiao = ExtensionPreferences & {}
  /** Preferences accessible in the `list-tasks` command */
  export type ListTasks = ExtensionPreferences & {}
  /** Preferences accessible in the `list-projects` command */
  export type ListProjects = ExtensionPreferences & {}
  /** Preferences accessible in the `get-workitem` command */
  export type GetWorkitem = ExtensionPreferences & {}
  /** Preferences accessible in the `code-overview` command */
  export type CodeOverview = ExtensionPreferences & {}
  /** Preferences accessible in the `list-test-plans` command */
  export type ListTestPlans = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `menu` command */
  export type Menu = {}
  /** Arguments passed to the `yunxiao-entry` command */
  export type YunxiaoEntry = {}
  /** Arguments passed to the `my-yunxiao` command */
  export type MyYunxiao = {}
  /** Arguments passed to the `list-tasks` command */
  export type ListTasks = {
  /** 项目 ID (可留空) */
  "projectId": string,
  /** 类别: Req/Bug/Task/Risk/Request/Topic */
  "category": string
}
  /** Arguments passed to the `list-projects` command */
  export type ListProjects = {}
  /** Arguments passed to the `get-workitem` command */
  export type GetWorkitem = {
  /** 工作项 ID */
  "workitemId": string,
  /** 项目 ID (可选) */
  "projectId": string
}
  /** Arguments passed to the `code-overview` command */
  export type CodeOverview = {}
  /** Arguments passed to the `list-test-plans` command */
  export type ListTestPlans = {}
}

