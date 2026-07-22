/**
 * 云效测试计划（Test Plan）相关接口。
 *
 * 命名空间：:search
 *   POST /oapi/v1/projex/organizations/{organizationId}/testplans:search    (central)
 *   POST /oapi/v1/projex/testplans:search                                   (region)
 * 鉴权：x-yunxiao-token
 * 响应：裸数组 [TestPlan, ...]
 */

import { buildProjexPath, resolveCredentials, request } from "./client";
import type { TestPlan } from "./types";

export interface ListTestPlansOptions {
  /** 项目 id（空间 id） */
  projectId: string;
  /** 每页大小，默认 50 */
  perPage?: number;
  /** 页码，从 1 开始 */
  page?: number;
  signal?: AbortSignal;
}

export async function listTestPlans(opts: ListTestPlansOptions): Promise<TestPlan[]> {
  const creds = resolveCredentials();
  if (!creds) {
    throw new Error("缺少必要的偏好（Personal Access Token / Organization Id）。");
  }
  const projectId = (opts.projectId ?? "").trim();
  if (!projectId) throw new Error("缺少 projectId。");

  const path = buildProjexPath(creds, "testplans:search");
  const body = {
    spaceId: projectId,
    spaceType: "Project",
    perPage: clampPerPage(opts.perPage ?? 50),
    page: Math.max(1, Math.floor(opts.page ?? 1)),
  };

  const data = await request<TestPlan[]>(path, { method: "POST", body, signal: opts.signal });
  return Array.isArray(data) ? data : [];
}

function clampPerPage(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(200, Math.max(1, Math.floor(n)));
}
