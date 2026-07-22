/**
 * 云效 OpenAPI 客户端。
 *
 * - 基础 URL 通过 Preferences.baseUrl 配置；默认官方中心版。
 * - 个人访问令牌通过 `x-yunxiao-token` 请求头传递。
 * - 不缓存任何响应；不在日志中输出令牌；错误对象包含 status。
 */

import { getPreferenceValues } from "@raycast/api";
import { NotFoundError, UnauthorizedError, YunxiaoApiError } from "./types";

/** 中心版统一接入域名（云效 rdc 接入层）。 */
export const DEFAULT_BASE_URL = "https://openapi-rdc.aliyuncs.com";

/** 接入点模式：中心版 path 含 organizations/{orgId}/，Region 版不带 */
export type EndpointMode = "central" | "region";

export interface ResolvedCredentials {
  baseUrl: string;
  personalAccessToken: string;
  organizationId: string;
  /** 接入点模式：central / region */
  mode: EndpointMode;
}

/**
 * 按 mode + organizationId 构造 projex 命名空间的 path。
 *
 *  - central: /oapi/v1/projex/organizations/{orgId}/...
 *  - region : /oapi/v1/projex/...
 */
export function buildProjexPath(creds: ResolvedCredentials, suffix: string): string {
  if (creds.mode === "region") {
    return `/oapi/v1/projex/${suffix}`;
  }
  return `/oapi/v1/projex/organizations/${encodeURIComponent(creds.organizationId)}/${suffix}`;
}

/**
 * 读取并校验偏好：返回 null 表示必要字段缺失，调用方应引导用户在偏好中补全。
 */
export function resolveCredentials(): ResolvedCredentials | null {
  const prefs = getPreferenceValues<{
    personalAccessToken?: string;
    organizationId?: string;
    endpointMode?: EndpointMode;
    regionUrl?: string;
  }>();
  const token = (prefs.personalAccessToken ?? "").trim();
  const orgId = (prefs.organizationId ?? "").trim();
  const mode: EndpointMode = prefs.endpointMode === "region" ? "region" : "central";
  let baseUrl: string;
  if (mode === "region") {
    baseUrl = (prefs.regionUrl ?? "").trim();
    if (!baseUrl) {
      // Region 模式下 baseUrl 必填，未填则视作未配置
      return null;
    }
  } else {
    baseUrl = DEFAULT_BASE_URL;
  }
  if (!token || !orgId) {
    return null;
  }
  return { baseUrl, personalAccessToken: token, organizationId: orgId, mode };
}

interface RequestOptions {
  method?: "GET" | "POST";
  /** Query 字符串参数；undefined 会被剔除 */
  query?: Record<string, string | number | undefined | null>;
  /** body 对象，自动序列化 JSON */
  body?: unknown;
  /** 信号量，用于列表主动放弃加载 */
  signal?: AbortSignal;
}

function buildQuery(query: RequestOptions["query"]): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

/**
 * 通用请求封装。返回反序列化后的 JSON。
 *
 * 错误处理：
 *  - 401 → UnauthorizedError
 *  - 404 → NotFoundError（message 由调用方提供）
 *  - 其他非 2xx → YunxiaoApiError（含 status、bodyText）
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const creds = resolveCredentials();
  if (!creds) {
    throw new UnauthorizedError("缺少 Personal Access Token 或 Organization Id。");
  }
  const method = options.method ?? "GET";
  const url = `${creds.baseUrl}${path}${buildQuery(options.query)}`;
  const headers: Record<string, string> = {
    "x-yunxiao-token": creds.personalAccessToken,
    Accept: "application/json",
  };
  const init: RequestInit = { method, headers };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  if (options.signal) {
    init.signal = options.signal;
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new YunxiaoApiError(0, `网络错误：${msg}`, { url, method });
  }

  const text = await res.text();
  if (res.status === 401) {
    throw new UnauthorizedError(text, url);
  }
  if (res.status === 404) {
    throw new NotFoundError(`资源不存在 (404)，请检查 baseUrl 与 organizationId：${path}`, text, url);
  }
  if (!res.ok) {
    const snippet = text ? text.slice(0, 200) : "(empty body)";
    throw new YunxiaoApiError(res.status, `云效 OpenAPI ${res.status}：${snippet}`, {
      bodyText: text,
      url,
      method,
    });
  }

  // 允许响应为空（云效部分接口返回空体 200）
  if (!text) {
    return undefined as unknown as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new YunxiaoApiError(res.status, `响应非 JSON：${msg}`);
  }
}
