# 使用说明

面向最终用户：在 Raycast 中安装并使用云效扩展。

## 1. 安装

1. 克隆本仓库或下载源码
2. 在仓库根目录执行 `npm install`
3. 在 Raycast 中通过 `Import Extension` 选择本目录完成本地安装；或在 Raycast Store 上架后用 `Install Extension`

## 2. 偏好设置

进入 Raycast → `Manage Extensions` → 找到 **云效** → 填下列字段：

| 字段                     | 必填             | 说明                                                                                                                          |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Personal Access Token`  | 是               | 在 devops.aliyun.com → 个人信息 → 个人访问令牌 中生成。建议至少勾选「项目」「工作项」读权限；多企业用户还需要「组织」读权限。 |
| `Organization Id`        | 是               | 企业标识。devops.aliyun.com 登录后 URL 中 `/organization/<id>/...` 的 `<id>` 段，或在"成员管理"页面查看。                     |
| `接入点`                 | 是               | 下拉选择 `中心版`（默认）或 `Region 版`。中心版对应阿里云 rdc 统一接入层；Region 版用于自部署或非中心地域实例。               |
| `Region 版 API Base URL` | 仅 Region 版必填 | 自部署实例域名，例如 `https://devops.cn-hangzhou.aliyuncs.com` 或你公司自建的接入地址。中心版无需填写。                       |

> 令牌仅在首次创建时返回，请在生成后立即保存。偏好存放在 Raycast 加密存储里，本扩展不会写入仓库文件，也不会上传到云效以外的任何服务。

## 3. 命令清单

| 命令              | 入口关键字   | 行为                                                |
| ----------------- | ------------ | --------------------------------------------------- |
| `menu`            | `云效`       | 根菜单，分子集（云效入口 / 我的云效 / 任务 / 项目 / 代码 / 测试） |
| `yunxiao-entry`   | `云效入口`   | 一键直达 8 个常用门户（工作台 / 项目协作 / 测试管理 / 代码管理 / 制品仓库 / 企业管理后台 / 个人设置） |
| `my-yunxiao`      | `我的云效`   | 快速直达我负责的工作项 ⌘⇧A / 我参与的项目 ⌘⇧P |
| `list-tasks`      | `任务列表`   | 选择项目与类别 → 展示工作项；支持本地关键字筛选     |
| `list-projects`   | `项目列表`   | 列出当前 organization 下可访问的项目 → 一键查看任务 |
| `get-workitem`    | `工作项详情` | 由任务列表跳转，或直接以参数 `workitemId` 打开      |
| `code-overview`   | `代码总览`   | 占位（即将推出）                                    |
| `list-test-plans` | `测试计划`   | 占位（即将推出）                                    |

### 3.1 云效入口（`yunxiao-entry`）

按 ⌘ 打开 Raycast → 输入 `云效入口` 进入。在 List 里选中条目 → 回车直接打开浏览器；每行都带一个 ⌘⇧ + 字母 的主快捷键：

| 条目           | 主快捷键 | 跳转 URL                                                          | 备注                                  |
| -------------- | -------- | ----------------------------------------------------------------- | ------------------------------------- |
| 工作台         | ⌘⇧H      | `devops.aliyun.com/workbench`                                     | -                                     |
| 项目协作       | ⌘⇧P      | `devops.aliyun.com/projex/project`                                | -                                     |
| 项目协作（个人）| ⌘⇧A      | `devops.aliyun.com/projex/workitem#viewIdentifier=441e17ad...`    | 我负责的全部工作项                    |
| 测试管理       | ⌘⇧T      | `devops.aliyun.com/testhub/repo`                                  | Testhub 仓库 / 用例库                 |
| 代码管理       | ⌘⇧C      | `codeup.aliyun.com/`                                              | Codeup 主页                           |
| 制品仓库       | ⌘⇧R      | `packages.aliyun.com/`                                            | Packages 私有制品库                   |
| 企业管理后台   | ⌘⇧M      | `devops.aliyun.com/org-admin/{project_id}/members/member`         | 主快捷键走第一个项目；二级菜单「选择项目」可手动切换 |
| 个人设置       | ⌘⇧S      | `account-devops.aliyun.com/settings/profile`                      | -                                     |

> 这些 URL 走浏览器登录态，与本扩展的 PAT 无关；如果在浏览器未登录云效则会被 SSO 重定向。

### 3.2 我的云效（`my-yunxiao`）

按 ⌘ 打开 Raycast → 输入 `我的云效` 进入。List 中 2 条静态 URL 直跳项，无需 API 调用、无 PAT 依赖：

| 条目           | 主快捷键 | 跳转 URL                                          |
| -------------- | -------- | ------------------------------------------------- |
| 负责的工作项   | ⌘⇧A     | `https://devops.aliyun.com/projex/workitem`       |
| 参与的项目     | ⌘⇧P     | `https://devops.aliyun.com/projex/project`        |

### 3.3 项目列表操作（`list-projects`）

进入 `项目列表` 后，选中任意项目行 → ActionPanel 展开 12 项操作，所有项目直达 URL 绑定快捷键：

| 操作                | 快捷键 | 跳转 URL                                                                       |
| ------------------- | ------ | ------------------------------------------------------------------------------ |
| 所有工作项          | ⌘⇧A    | `/projex/project/{project_id}/workitem#viewIdentifier=b3d95a58f1270afe4d4c7ae746` |
| 访问迭代 Backlog    | ⌘⇧S    | `/projex/project/{project_id}/sprint/backlog`                                  |
| 访问测试计划        | ⌘⇧P    | `/projex/project/{project_id}/testplan`                                        |
| 概览                | ⌘⇧V    | `/projex/project/{project_id}`                                                 |
| 查看需求            | ⌘⇧R    | `/projex/project/{project_id}/req`                                             |
| 查看任务            | ⌘⇧T    | `/projex/project/{project_id}/task`                                            |
| 查看缺陷            | ⌘⇧B    | `/projex/project/{project_id}/bug`                                             |
| 查看主题            | ⌘⇧Z    | `/projex/project/{project_id}/topic`                                           |
| 查看原始诉求        | ⌘⇧O    | `/projex/project/{project_id}/request`                                         |

需要先拉取列表再二次跳转的：

| 操作        | 快捷键 | 行为                                       |
| ----------- | ------ | ------------------------------------------ |
| 查看迭代    | ⌘⇧⌥S  | 拉取该项目迭代列表 → 选迭代 → 浏览器打开   |
| 查看测试计划 | ⌘⇧⌥T  | 拉取该项目测试计划列表 → 选计划 → 浏览器打开 |

> `list-projects` 内部 ⌘⇧P（访问测试计划）和 `yunxiao-entry` 内部 ⌘⇧P（项目协作）按命令域独立，无冲突。

## 4. 接入点选哪个

- **中心版（默认）**：你登录的 devops.aliyun.com 是中心组织（统一多地域），保持默认即可。底层走 `https://openapi-rdc.aliyuncs.com`，鉴权 `x-yunxiao-token: <PAT>`。
- **Region 版**：你的组织部署在某个地域（如 `cn-hangzhou`）或自建实例，需要在偏好里切换"接入点 = Region 版"，并填入对应的 `Region 版 API Base URL`。Region 版的请求 path 不带 `organizations/{organizationId}/` 段。

## 5. 故障排查

如果「项目列表」加载失败：

1. 选中空白项 → 按 **⌘⇧C** 复制"错误详情"
2. 看到的状态码与含义：

   | 状态                         | 含义                                               | 修法                                     |
   | ---------------------------- | -------------------------------------------------- | ---------------------------------------- |
   | `401 Invalid token`          | PAT 无效 / 过期 / 复制时漏字符                     | 重发令牌并更新偏好                       |
   | `404 InvalidAction.NotFound` | 接入点选错：Region 版的 URL 填了中心版地址，或反之 | 在偏好里切换接入点 / 修正 Region URL     |
   | `403 Operate.NoPermission`   | PAT 没勾选「项目协作 / 项目 / 读」                 | 重发令牌并勾上                           |
   | 网络层错误 `fetch failed`    | DNS / TLS / 路由不可达                             | 切换网络、确认 host 可解析、检查代理设置 |

3. 也可以选 **复制请求 URL 模板**，拿到 curl 命令手动验证：

   ```bash
   curl -X POST 'https://openapi-rdc.aliyuncs.com/oapi/v1/projex/organizations/<你的 orgId>/projects:search' \
     -H 'x-yunxiao-token: <你的 PAT>' \
     -H 'Content-Type: application/json' \
     -d '{"page":1,"perPage":50,"orderBy":"gmtCreate","sort":"desc"}'
   ```

## 6. 隐私

- 错误信息里只打印 baseUrl / mode / organizationId / status / response body，**绝不打印 token**。
- 偏好修改不需要重启 Raycast；扩展内部缓存的凭证在每次请求前重新读取。
- 本扩展不会写入任何仓库文件，也不会在云端保存你的查询结果。
