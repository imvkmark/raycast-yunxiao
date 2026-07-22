# 功能清单

## 基础能力

**配置**
- PAT
- 组织ID
- 接入点
- 接入点Url

**Icon**
- 云效入口 : assets/icon.svg
- 项目协作 : assets/project.svg
- 测试管理 : assets/testhub.svg
- 代码管理 : assets/codeup.svg
- 制品仓库 : assets/packages.svg
- 我的云效 : assets/my.png
- 企业管理后台 : assets/org-admin.svg

## 我的云效

- [x] 工作项 ⌘⇧A → `https://devops.aliyun.com/projex/workitem`
- [ ] 代码库 (默认我参与的所有代码库) 支持代码库搜索, 点击跳转
- [ ] 合并请求 (所有已开启的请求, 点击进入入口访问)

## 云效入口

- [x] 工作台 (cmd + shift + h) :  https://devops.aliyun.com/workbench
- [x] 项目协作 (cmd + shift + p) : https://devops.aliyun.com/projex/project
- [x] 项目协作(个人工作项) (cmd + shift + a) : https://devops.aliyun.com/projex/workitem#viewIdentifier=441e17ad4f72718076eedcf5
- [x] 测试管理 (cmd + shift + t) : https://devops.aliyun.com/testhub/repo
- [x] 代码管理 (cmd + shift + c) : https://codeup.aliyun.com/
- [x] 制品仓库 (cmd + shift + r) : https://packages.aliyun.com/
- [x] 企业管理后台 (cmd + shift + m) : https://devops.aliyun.com/org-admin/{project_id}/members/member
- [x] 个人设置 (cmd + shift + s) https://account-devops.aliyun.com/settings/profile

## 项目协作

**我**
- [x] 负责的工作项 ⌘⇧A → https://devops.aliyun.com/projex/workitem
- [x] 参与的项目 ⌘⇧P → https://devops.aliyun.com/projex/project

**项目清单**
- [x] 列出项目 / 支持名称搜索(本地过滤)
  - [x] 回车 -> 进入项目工作项清单, 筛选项内容是(全部 / 任务 / 需求...)
    - [x] 选中工作项目(回车) -> https://devops.aliyun.com/projex/project/{project_id}/{type}/{itemid}
- [x] 操作
  - [x] 所有工作项(cmd+shift+a) ->  访问Url : https://devops.aliyun.com/projex/project/{project_id}/workitem#viewIdentifier=b3d95a58f1270afe4d4c7ae746
  - [x] 查看迭代(cmd+shift+alt+s) ->  查询所有迭代列表, 迭代id 是 {sprint_id}
    - [x] 访问{迭代名称}(回车) -> 访问Url : https://devops.aliyun.com/projex/project/{project_id}/sprint/{sprint_id}
  - [x] 访问迭代(cmd+shift+s) ->  访问Url : https://devops.aliyun.com/projex/project/{project_id}/sprint/backlog
  - [x] 查看测试计划(cmd+shift+alt+t) ->  查询所有测试计划, 计划id 是 {plan_id}
      - [x] 访问{测试计划}(回车) -> 访问Url : https://devops.aliyun.com/testhub/plan/{plan_id}/dashboard
  - [x] 访问测试计划(cmd+shift+p) ->  访问Url : https://devops.aliyun.com/projex/project/{project_id}/testplan
  - [x] 概览((cmd+shift+v)) -> 访问Url : https://devops.aliyun.com/projex/project/{project_id}
  - [x] 查看需求((cmd+shift+r)) -> 访问Url : https://devops.aliyun.com/projex/project/{project_id}/req
  - [x] 查看任务((cmd+shift+t)) -> 访问Url : https://devops.aliyun.com/projex/project/{project_id}/task
  - [x] 查看缺陷((cmd+shift+b)) -> 访问Url : https://devops.aliyun.com/projex/project/{project_id}/bug
  - [x] 查看主题((cmd+shift+z)) -> 访问Url : https://devops.aliyun.com/projex/project/{project_id}/topic
  - [x] 查看原始诉求((cmd+shift+o)) -> 访问Url : https://devops.aliyun.com/projex/project/{project_id}/request

## 任务列表(list-tasks)

- [x] 项目下拉 + 类别下拉
- [x] 工作项列表(标识 / 标题 / 类别 / 状态 / 负责人)
- [x] 详情视图(跳转 get-workitem)
- [x] 错误展示(toast + 详情面板)

## 工作项详情(get-workitem)

- [x] 渲染 markdown 详情
- [x] 复制 ID / 复制 JSON / 复制为 Markdown
- [x] 在云效中打开
- [x] 跳转开放文档
