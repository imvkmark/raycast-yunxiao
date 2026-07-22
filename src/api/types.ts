/**
 * 云效 OpenAPI 共享类型定义。
 *
 * 官方文档：https://help.aliyun.com/document_detail/460575.html
 */

/** 工作项的大类型。官方取值：Req/Bug/Task/Risk/Request/Topic。 */
export type WorkitemCategory = "Req" | "Bug" | "Task" | "Risk" | "Request" | "Topic";

/** 全部类别数组，便于在 UI 中下拉枚举。 */
export const WORKITEM_CATEGORIES: WorkitemCategory[] = ["Req", "Bug", "Task", "Risk", "Request", "Topic"];

export interface Project {
  id: string;
  /** 项目名 */
  name?: string;
  /** 项目标识，例如 PROJ */
  identifier?: string;
  /** 项目可见性。文档约定：private/public */
  visibility?: "private" | "public" | string;
  /** 项目图标 URL，可选 */
  iconUrl?: string;
}

export interface WorkitemStatusRef {
  id?: string;
  name?: string;
  category?: string;
}

export interface WorkitemPriorityRef {
  id?: string;
  name?: string;
  /** 数值级别，越小越紧急 */
  level?: number;
}

export interface WorkitemUserRef {
  id?: string;
  name?: string;
  /** 工号 */
  employeeId?: string;
}

export interface Workitem {
  id: string;
  /** 可读 id，例如 PROJ-123 */
  identifier?: string;
  subject: string;
  status?: WorkitemStatusRef;
  priority?: WorkitemPriorityRef;
  assignee?: WorkitemUserRef | null;
  creator?: WorkitemUserRef | null;
  category?: WorkitemCategory;
  /** ISO 时间字符串 */
  updatedAt?: string;
  createdAt?: string;
  /** 项目 id */
  projectId?: string;
  description?: string;
  /** 处理人列表 */
  participants?: WorkitemUserRef[];
}

export interface WorkitemListResponse {
  items?: Workitem[];
  /** 分页标记，对应 nextToken */
  nextToken?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextToken?: string;
}

export interface Sprint {
  id: string;
  /** 迭代名称 */
  name?: string;
  /** 状态，例如 进行中/已结束 */
  status?: string;
  /** 计划开始 / 结束；ISO 时间 */
  startDate?: string;
  endDate?: string;
  /** 所属项目 id */
  projectId?: string;
}

export interface TestPlan {
  id: string;
  /** 测试计划名称 */
  name?: string;
  /** 状态 */
  status?: string;
  /** 关联的项目 id */
  projectId?: string;
  /** 负责人 id */
  ownerId?: string;
}

export class YunxiaoApiError extends Error {
  readonly status: number;
  readonly bodyText?: string;
  readonly url?: string;
  readonly method?: string;

  constructor(status: number, message: string, opts: { bodyText?: string; url?: string; method?: string } = {}) {
    super(message);
    this.name = "YunxiaoApiError";
    this.status = status;
    this.bodyText = opts.bodyText;
    this.url = opts.url;
    this.method = opts.method;
  }
}

export class UnauthorizedError extends YunxiaoApiError {
  constructor(bodyText?: string, url?: string) {
    super(401, "Personal Access Token 无效或缺失，请在扩展偏好中重新设置。", { bodyText, url });
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends YunxiaoApiError {
  constructor(message: string, bodyText?: string, url?: string) {
    super(404, message, { bodyText, url });
    this.name = "NotFoundError";
  }
}
