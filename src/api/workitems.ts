/**
 * 云效工作项相关接口。
 * 官方文档：
 *   - SearchWorkitems: https://help.aliyun.com/zh/yunxiao/developer-reference/searchworkitems
 *   - GetWorkitem:     https://help.aliyun.com/zh/yunxiao/developer-reference/getworkitem
 *
 * 中心版统一接入域名：https://openapi-rdc.aliyuncs.com
 * 列工作项走 POST `:search`，单条走 GET + spaceId 查询参数。
 */

import { buildProjexPath, resolveCredentials, request } from "./client";
import type { PaginatedResult, Workitem, WorkitemCategory } from "./types";

const MAX_RESULTS = 50;

export interface ListWorkitemsOptions {
  projectId?: string | null;
  /** 必填：工作项大类型；"All" 时分多次拉取再合并 */
  category?: WorkitemCategory | "All" | null;
  /** 分页，从 1 开始，默认 1 */
  page?: number;
  /** 每页大小，默认 50 */
  perPage?: number;
  signal?: AbortSignal;
}

/**
 * 列出项目下的工作项。
 *
 * SearchWorkitems 返回裸数组；category 多值用逗号分隔。
 * 当传 "All" 时，由调用方决定要不要循环全部类别。
 */
export async function listWorkitems(opts: ListWorkitemsOptions): Promise<PaginatedResult<Workitem>> {
  const creds = resolveCredentials();
  if (!creds) {
    throw new Error("缺少必要的偏好（Personal Access Token / Organization Id）。");
  }
  const projectId = (opts.projectId ?? "").trim();
  if (!projectId) {
    throw new Error("缺少 projectId（spaceId）。请在扩展命令参数或表单中提供。");
  }

  const perPage = clampPerPage(opts.perPage ?? MAX_RESULTS);
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const category = opts.category && opts.category !== "All" ? opts.category : "";

  const path = buildProjexPath(creds, "workitems:search");
  const body: Record<string, unknown> = {
    spaceId: projectId,
    spaceType: "Project",
    page,
    perPage,
    orderBy: "gmtCreate",
    sort: "desc",
  };
  if (category) body.category = category;

  const data = await request<Workitem[]>(path, {
    method: "POST",
    body,
    signal: opts.signal,
  });
  return {
    items: Array.isArray(data) ? data : [],
  };
}

/**
 * 拉取单个工作项详情。
 * 官方文档：/oapi/v1/projex/organizations/{organizationId}/workitems/{workitemId}?spaceId=...
 */
export async function getWorkitem(workitemId: string, projectId?: string): Promise<Workitem> {
  const creds = resolveCredentials();
  if (!creds) {
    throw new Error("缺少必要的偏好（Personal Access Token / Organization Id）。");
  }
  const id = (workitemId ?? "").trim();
  if (!id) throw new Error("缺少 workitemId。");

  const path = `${buildProjexPath(creds, `workitems/${encodeURIComponent(id)}`)}${
    projectId ? `?spaceId=${encodeURIComponent(projectId)}` : ""
  }`;

  // 详情接口直接返回对象（或对象包装），按需适配
  const data = await request<Workitem | { workitem?: Workitem }>(path);
  if (data && typeof data === "object" && "subject" in (data as object)) {
    return data as Workitem;
  }
  const wrapped = (data as { workitem?: Workitem })?.workitem;
  if (wrapped) return wrapped;
  throw new Error("工作项详情为空。");
}

function clampPerPage(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, Math.floor(n)));
}
