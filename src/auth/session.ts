// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import { logoutSession } from "../api";

// 需要明确清理的认证相关 Cookie 名称列表
var AUTH_COOKIE_NAMES: string[] = ["jwt_token"];

// 如果后端设置了指定域名的 Cookie，可在此配置域名（留空表示不设置 domain）
var AUTH_COOKIE_DOMAIN = "";

// 仅在非 HttpOnly Cookie 场景下才允许前端主动过期（默认关闭）
var ALLOW_CLIENT_EXPIRE = false;

function expireAuthCookie(name: string): void {
  var cookie =
    name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  if (AUTH_COOKIE_DOMAIN) {
    cookie += "; domain=" + AUTH_COOKIE_DOMAIN;
  }
  document.cookie = cookie;
}

export function clearAuthState(): Promise<void> {
  if (ALLOW_CLIENT_EXPIRE) {
    for (var i = 0; i < AUTH_COOKIE_NAMES.length; i++) {
      expireAuthCookie(AUTH_COOKIE_NAMES[i]);
    }
  }
  return logoutSession().catch(function (error) {
    console.warn("通知后端退出失败:", error);
  });
}
