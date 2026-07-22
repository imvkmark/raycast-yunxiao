/**
 * 云效入口（yunxiao-entry）。
 *
 * 一键直达 8 个常用云效门户：
 *   工作台 / 项目协作 / 项目协作(个人工作项) / 测试管理 / 代码管理 /
 *   制品仓库 / 企业管理后台 / 个人设置
 *
 * 绝大多数是静态深链，直接 Action.OpenInBrowser；
 * 「企业管理后台」URL 含 {organization_id}，从偏好读取：
 *   - 已配置 Organization Id 时直接生成完整 URL；
 *   - 未配置时该项主动作改为 toast 提示设置 Organization Id。
 *
 * 设计上尽量不依赖网络：除「企业管理后台」之外，其他条目无网络请求，
 * PAT 凭证缺失也不会阻塞（这些链接走浏览器登录态）。
 */

import { Action, ActionPanel, getPreferenceValues, Icon, Keyboard, List, Toast, showToast } from "@raycast/api";
import { organizationAdminUrl } from "./utils/urls";

const BASE = "https://devops.aliyun.com";

/** 跳到 devops 测试/制品等其它子域的根 */
const CODEUP_ROOT = "https://codeup.aliyun.com/";
const PACKAGES_ROOT = "https://packages.aliyun.com/";
const ACCOUNT_ROOT = "https://account-devops.aliyun.com";

/** 「个人工作项」视图的 viewIdentifier（云效固定值，从官方页面 URL 复制） */
const PERSONAL_WORKITEM_VIEW_ID = "441e17ad4f72718076eedcf5";

interface OrgAdminPreferences {
    organizationId?: string;
}

interface PortalItem {
    id: string;
    title: string;
    subtitle: string;
    /** assets/ 下的图标文件名 */
    iconSource: string;
    /** 静态 URL；不可用时为 null */
    url: string | null;
    /** 列表项主快捷键 */
    shortcut: { modifiers: Keyboard.KeyModifier[]; key: Keyboard.KeyEquivalent };
    /** URL 不可用时 toast 文案；缺省表示 URL 永远可用 */
    unavailableMessage?: string;
}

/** 「企业管理后台」依赖偏好里的 Organization Id */
const ORGANIZATION_ID = (getPreferenceValues<OrgAdminPreferences>().organizationId ?? "").trim();

const ORG_ADMIN_UNAVAILABLE = "缺少 Organization Id，请在扩展偏好中设置后再试。";
const ORG_ADMIN_SUBTITLE_READY = "成员 / 权限管理";
const ORG_ADMIN_SUBTITLE_MISSING = "请先在扩展偏好中设置 Organization Id";

const PORTAL_ITEMS: PortalItem[] = [
    {
        id: "workbench",
        title: "工作台",
        subtitle: "通知、待办、最近访问",
        iconSource: "assets/icon.png",
        url: `${BASE}/workbench`,
        shortcut: { modifiers: ["cmd", "shift"], key: "h" },
    },
    {
        id: "projex",
        title: "项目协作",
        subtitle: "项目协作总览页",
        iconSource: "assets/project.png",
        url: `${BASE}/projex/project`,
        shortcut: { modifiers: ["cmd", "shift"], key: "p" },
    },
    {
        id: "projex-mine",
        title: "项目协作（个人工作项）",
        subtitle: "我负责的全部工作项视图",
        iconSource: "assets/project.png",
        url: `${BASE}/projex/workitem#viewIdentifier=${PERSONAL_WORKITEM_VIEW_ID}`,
        shortcut: { modifiers: ["cmd", "shift"], key: "a" },
    },
    {
        id: "testhub",
        title: "测试管理",
        subtitle: "Testhub 仓库 / 用例库",
        iconSource: "assets/testhub.png",
        url: `${BASE}/testhub/repo`,
        shortcut: { modifiers: ["cmd", "shift"], key: "t" },
    },
    {
        id: "codeup",
        title: "代码管理",
        subtitle: "Codeup 代码仓库主页",
        iconSource: "assets/codeup.png",
        url: CODEUP_ROOT,
        shortcut: { modifiers: ["cmd", "shift"], key: "c" },
    },
    {
        id: "packages",
        title: "制品仓库",
        subtitle: "Packages 私有制品库",
        iconSource: "assets/packages.png",
        url: PACKAGES_ROOT,
        shortcut: { modifiers: ["cmd", "shift"], key: "r" },
    },
    {
        id: "org-admin",
        title: "企业管理后台",
        subtitle: ORGANIZATION_ID ? ORG_ADMIN_SUBTITLE_READY : ORG_ADMIN_SUBTITLE_MISSING,
        iconSource: "assets/org-admin.png",
        url: ORGANIZATION_ID ? organizationAdminUrl(ORGANIZATION_ID) : null,
        unavailableMessage: ORG_ADMIN_UNAVAILABLE,
        shortcut: { modifiers: ["cmd", "shift"], key: "m" },
    },
    {
        id: "personal-settings",
        title: "个人设置",
        subtitle: "PAT / 个人偏好 / 头像",
        iconSource: "assets/icon.png",
        url: `${ACCOUNT_ROOT}/settings/profile`,
        shortcut: { modifiers: ["cmd", "shift"], key: "s" },
    },
];

/* ---------- 主命令 ---------- */

export default function YunxiaoEntry() {
    function showUnavailable(item: PortalItem) {
        void showToast({
            style: Toast.Style.Failure,
            title: "无法跳转",
            message: item.unavailableMessage ?? "没有可用的链接。",
        });
    }

    return (
        <List searchBarPlaceholder="搜索云效入口…">
            {PORTAL_ITEMS.map((item) => {
                const resolvedUrl = item.url;
                return (
                    <List.Item
                        key={item.id}
                        icon={{ source: item.iconSource }}
                        title={item.title}
                        subtitle={item.subtitle}
                        actions={
                            <ActionPanel>
                                {resolvedUrl ? (
                                    <Action.OpenInBrowser
                                        title={item.title}
                                        url={resolvedUrl}
                                        shortcut={item.shortcut}
                                    />
                                ) : (
                                    <Action
                                        title={item.title}
                                        icon={Icon.Link}
                                        shortcut={item.shortcut}
                                        onAction={() => showUnavailable(item)}
                                    />
                                )}
                                <Action.CopyToClipboard
                                    title="复制链接"
                                    content={resolvedUrl ?? `${BASE}/org-admin/{organization_id}/members/member`}
                                />
                            </ActionPanel>
                        }
                    />
                );
            })}
        </List>
    );
}
