/**
 * 云效迭代（Sprint）相关接口。
 *
 * 命名空间：:search
 *   POST /oapi/v1/projex/organizations/{organizationId}/sprints:search    (central)
 *   POST /oapi/v1/projex/sprints:search                                   (region)
 * 鉴权：x-yunxiao-token
 * 响应：裸数组 [Sprint, ...]
 */

import { buildProjectPath, resolveCredentials, request } from "./client";
import type { Sprint } from "./types";

export interface SearchSprintsOptions {
  /** 项目 id（空间 id） */
  projectId: string;
  /** 每页大小，默认 50 */
  perPage?: number;
  /** 页码，从 1 开始 */
  page?: number;
  signal?: AbortSignal;
}

export async function searchSprints(opts: SearchSprintsOptions): Promise<Sprint[]> {
  const creds = resolveCredentials();
  const projectId = (opts.projectId ?? "").trim();
  if (!projectId) throw new Error("缺少 projectId。");

  const path = buildProjectPath(creds, "sprints:search");
  const body = {
    spaceId: projectId,
    spaceType: "Project",
    perPage: clampPerPage(opts.perPage ?? 50),
    page: Math.max(1, Math.floor(opts.page ?? 1)),
    orderBy: "startDate",
    sort: "desc",
  };

  const data = await request<Sprint[]>(path, { method: "POST", body, signal: opts.signal });
  return Array.isArray(data) ? data : [];
}

function clampPerPage(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, Math.floor(n)));
}
