export const YUNXIAO_WEB_ROOT = "https://devops.aliyun.com";

export const WORKITEM_VIEW_ID = "b3d95a58f1270afe4d4c7ae746";

export type WorkitemUrlCategory = "Req" | "Bug" | "Task" | "Risk" | "Request" | "Topic";
export type ProjectCategoryPath = "req" | "bug" | "task" | "risk" | "request" | "topic";

const WORKITEM_CATEGORY_PATHS: Record<WorkitemUrlCategory, ProjectCategoryPath> = {
    Req: "req",
    Bug: "bug",
    Task: "task",
    Risk: "risk",
    Request: "request",
    Topic: "topic",
};

function segment(value: string): string {
    return encodeURIComponent(value);
}

export function projectUrl(projectId: string): string {
    return `${YUNXIAO_WEB_ROOT}/projex/project/${segment(projectId)}`;
}

export function projectCategoryUrl(projectId: string, category: ProjectCategoryPath): string {
    return `${projectUrl(projectId)}/${category}`;
}

export function projectWorkitemsUrl(projectId: string): string {
    return `${projectUrl(projectId)}/workitem#viewIdentifier=${WORKITEM_VIEW_ID}`;
}

export function workitemUrl(
    projectId: string | null | undefined,
    category: string | null | undefined,
    workitemId: string | null | undefined,
): string | undefined {
    const normalizedProjectId = projectId?.trim();
    const normalizedWorkitemId = workitemId?.trim();
    const type = category ? WORKITEM_CATEGORY_PATHS[category as WorkitemUrlCategory] : undefined;
    if (!normalizedProjectId || !normalizedWorkitemId || !type) return undefined;
    return `${projectUrl(normalizedProjectId)}/${type}/${segment(normalizedWorkitemId)}`;
}

export function sprintBacklogUrl(projectId: string): string {
    return `${projectUrl(projectId)}/sprint/backlog`;
}

export function sprintUrl(projectId: string, sprintId: string): string {
    return `${projectUrl(projectId)}/sprint/${segment(sprintId)}`;
}

export function testPlanListUrl(projectId: string): string {
    return `${projectUrl(projectId)}/testplan`;
}

export function testPlanUrl(planId: string): string {
    return `${YUNXIAO_WEB_ROOT}/testhub/plan/${segment(planId)}/dashboard`;
}

export function organizationAdminUrl(organizationId: string): string {
    return `${YUNXIAO_WEB_ROOT}/org-admin/${segment(organizationId)}/members/member`;
}
