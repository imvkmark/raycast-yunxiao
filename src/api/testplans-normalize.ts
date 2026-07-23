/**
 * 测试计划响应归一化（无 @raycast/api 依赖，可独立测试）。
 *
 * 官方 ListTestPlan 响应字段：
 *   testPlanIdentifier / name / status / gmtCreate / managers / spaceIdentifier
 * 归一化到内部 TestPlan：
 *   testPlanIdentifier → id
 *   spaceIdentifier    → projectId
 *   managers[0]        → ownerId
 *   managers           → managerIds
 *   gmtCreate          → createdAt
 *
 * 同时兼容裸数组与 { result / data } 包裹结构。
 */

import type { TestPlan } from "./types";

function stringValue(value: unknown): string | undefined {
    return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

export function normalizeTestPlans(response: unknown): TestPlan[] {
    let rows: unknown[];
    if (Array.isArray(response)) {
        rows = response;
    } else if (response && typeof response === "object") {
        const value = response as { result?: unknown[]; data?: unknown[] };
        rows = value.result ?? value.data ?? [];
    } else {
        rows = [];
    }

    const result: TestPlan[] = [];
    for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const value = row as Record<string, unknown>;
        const identifier = stringValue(value.testPlanIdentifier ?? value.id);
        if (!identifier) continue;

        const managers = Array.isArray(value.managers)
            ? value.managers.filter((m): m is string => typeof m === "string" && m.length > 0)
            : [];
        const projectId = stringValue(value.spaceIdentifier);
        const name = stringValue(value.name);
        const status = stringValue(value.status);
        const createdAt = stringValue(value.gmtCreate);

        result.push({
            id: identifier,
            name,
            status,
            projectId,
            ownerId: managers[0],
            managerIds: managers,
            createdAt,
        });
    }
    return result;
}
