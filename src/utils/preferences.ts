/**
 * 偏好工具：把 Raycast PreferenceValues 与 API 客户端解耦。
 */

import { resolveCredentials } from "../api/client";

/**
 * 返回标准化的偏好对象；如果缺少则抛出可被 toast 捕获的异常。
 */
export function requireCredentials() {
  const creds = resolveCredentials();
  if (!creds) {
    const err = new Error("请先在扩展偏好中设置 Personal Access Token 与 Organization Id。");
    (err as Error & { missingPreferences?: boolean }).missingPreferences = true;
    throw err;
  }
  return creds;
}
