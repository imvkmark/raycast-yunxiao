import test from "node:test";
import assert from "node:assert/strict";

import {
    organizationAdminUrl,
    projectCategoryUrl,
    projectUrl,
    projectWorkitemsUrl,
    sprintBacklogUrl,
    sprintUrl,
    testPlanListUrl,
    testPlanUrl,
    workitemUrl,
} from "../src/utils/urls.ts";

const WORKITEM_TYPES = {
    Req: "req",
    Bug: "bug",
    Task: "task",
    Risk: "risk",
    Request: "request",
    Topic: "topic",
};

test("maps all six workitem categories to canonical typed URLs", () => {
    for (const [category, type] of Object.entries(WORKITEM_TYPES)) {
        assert.equal(
            workitemUrl("project-id", category, "workitem-id"),
            `https://devops.aliyun.com/projex/project/project-id/${type}/workitem-id`,
        );
    }
});

test("does not build workitem URLs for missing or unknown categories", () => {
    assert.equal(workitemUrl("project-id", undefined, "workitem-id"), undefined);
    assert.equal(workitemUrl("project-id", "Unknown", "workitem-id"), undefined);
    assert.equal(workitemUrl("", "Req", "workitem-id"), undefined);
    assert.equal(workitemUrl("project-id", "Req", ""), undefined);
});

test("encodes every dynamic URL path segment", () => {
    assert.equal(
        workitemUrl("project /?#", "Req", "item /?#"),
        "https://devops.aliyun.com/projex/project/project%20%2F%3F%23/req/item%20%2F%3F%23",
    );
    assert.equal(
        sprintUrl("project /", "sprint /"),
        "https://devops.aliyun.com/projex/project/project%20%2F/sprint/sprint%20%2F",
    );
    assert.equal(testPlanUrl("plan /"), "https://devops.aliyun.com/testhub/plan/plan%20%2F/dashboard");
    assert.equal(organizationAdminUrl("org /"), "https://devops.aliyun.com/org-admin/org%20%2F/members/member");
});

test("builds project, sprint, test plan, and organization URLs exactly", () => {
    assert.equal(projectUrl("p1"), "https://devops.aliyun.com/projex/project/p1");
    assert.equal(projectCategoryUrl("p1", "risk"), "https://devops.aliyun.com/projex/project/p1/risk");
    assert.equal(
        projectWorkitemsUrl("p1"),
        "https://devops.aliyun.com/projex/project/p1/workitem#viewIdentifier=b3d95a58f1270afe4d4c7ae746",
    );
    assert.equal(sprintBacklogUrl("p1"), "https://devops.aliyun.com/projex/project/p1/sprint/backlog");
    assert.equal(sprintUrl("p1", "s1"), "https://devops.aliyun.com/projex/project/p1/sprint/s1");
    assert.equal(testPlanListUrl("p1"), "https://devops.aliyun.com/projex/project/p1/testplan");
    assert.equal(testPlanUrl("tp1"), "https://devops.aliyun.com/testhub/plan/tp1/dashboard");
    assert.equal(organizationAdminUrl("org-abc"), "https://devops.aliyun.com/org-admin/org-abc/members/member");
});
