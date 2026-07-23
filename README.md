# 云效（Yunxiao）Raycast 扩展

使用阿里云 [云效](https://devops.aliyun.com) 的个人访问令牌（Personal Access Token）在 Raycast 中快速查看项目、任务，**无需打开网页**。

## 功能

本版本（v0.2）提供：

- **项目列表** —— 列出你所属 organization 下的所有项目，支持关键字筛选；在项目上按回车即可展开「查看工作项」子视图（按类别筛选、本地搜索、跳转详情），并提供迭代、测试计划、概览、各类别深链等一键直达动作。
- **工作项详情** —— 由「查看工作项」子视图打开，或以 `workitemId` 参数直接调用。
- **占位命令** —— 代码总览、测试计划（下一阶段实现）。

## 偏好设置

进入 Raycast → 输入 `Manage Extensions` → 找到 **云效** → 填写：

| 字段                     | 必填             | 说明                                                                                                      |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------- |
| `Personal Access Token`  | 是               | 在 devops.aliyun.com → 个人信息 → 个人访问令牌 中生成；建议至少勾选「项目」「工作项」读权限。             |
| `Organization Id`        | 是               | 企业标识。devops.aliyun.com 登录后 URL 中 `/organization/<id>/...` 的 `<id>` 段，或在"成员管理"页面获取。 |
| `接入点`                 | 是               | 下拉：`中心版`（默认）/`Region 版`。中心版走 rdc 统一接入层；Region 版用于自部署或其他地域实例。          |
| `Region 版 API Base URL` | 仅 Region 版必填 | 自部署域名，例如 `https://devops.cn-hangzhou.aliyuncs.com`。中心版无需填写。                              |

> 详细使用与排查请见 [docs/readme/usage.md](docs/readme/usage.md)。

## 命令清单

| 命令              | 入口         | 行为                                            |
| ----------------- | ------------ | ----------------------------------------------- |
| `menu`            | `云效`       | 根菜单，分子模块跳转                            |
| `list-projects`   | `项目列表`   | 浏览我的项目 → 「查看工作项」子视图（类别筛选 + 本地搜索 + 详情跳转）；同时支持关键字筛选 |
| `get-workitem`    | `工作项详情` | 由「查看工作项」子视图跳转；同时支持 Raycast 直接调用           |
| `code-overview`   | `代码总览`   | 占位                                            |
| `list-test-plans` | `测试计划`   | 占位                                            |

## 开发

```bash
npm install
npm run dev        # ray develop
npm test           # Node 24 原生测试
npm run lint       # ray lint  (manifest + icons + eslint + prettier)
npm run build      # ray build
npx tsc --noEmit   # 类型检查
```

> 架构、目录结构、扩展点见 [docs/readme/development.md](docs/readme/development.md)。
> 本项目使用 TypeScript + ESLint（flat config）+ Prettier。`eslint.config.js` 将 `@raycast/eslint-config` 中可能嵌套的数组（`typescript.configs.recommended`）扁平化以兼容 ESLint 10+。

## API 参考

> 鉴权：所有端点统一使用 `x-yunxiao-token: <PAT>` 头。

| 操作               | 文档                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| SearchProjects     | https://help.aliyun.com/zh/yunxiao/developer-reference/searchprojects  |
| SearchWorkitems    | https://help.aliyun.com/zh/yunxiao/developer-reference/searchworkitems |
| GetWorkitem        | https://help.aliyun.com/zh/yunxiao/developer-reference/getworkitem     |
| ListProjectMembers | https://help.aliyun.com/document_detail/2870170.html                   |
| API 列表总览       | https://help.aliyun.com/document_detail/460575.html                    |

> ⚠️ 历史上 `/organization/{orgId}/listProjects` 这类 `devops/2021-06-25` 端点需要阿里云 ROA 签名（AccessKey），不能用 PAT —— 本扩展已避开，统一走 `:search` 命名空间。

## 路线图

- [ ] 工作项创建/编辑/状态切换
- [ ] 代码模块：仓库 + PR + commit 概览
- [ ] 测试模块：测试计划 + 用例列表
- [ ] 分页加载更多（当前一次性拉满 200 条）
- [ ] 本地缓存以避免每次重新拉取

## 隐私

PAT 仅存储在 Raycast 偏好中（已加密），扩展不会写入任何仓库文件，也不会上传云效以外的服务。错误信息中不会泄露令牌。
