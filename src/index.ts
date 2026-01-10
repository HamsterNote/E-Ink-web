// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import {
  initAjaxSetup,
  getUserInfo,
  setShowLoginModalCallback,
  validateOAuthToken,
} from "./api";
import { showLoginModal, showUserInfo, setRefreshShelfCallback } from "./auth";
import { setRegisterRefreshShelfCallback } from "./auth/register";
import { createShelf, refreshShelf } from "./shelf";
import "./types";
import { getQueryParam, removeQueryParam } from "./utils";

function clearContent(): void {
  var $app = $("#app");
  $app.html("");
  var $topBar = $("#top-bar");
  $topBar.html("");
  var $bottomBar = $("#bottom-bar");
  $bottomBar.html("");
  var $rightBar = $("#right-bar");
  $rightBar.html("");
  var $leftBar = $("#left-bar");
  $leftBar.html("");
}

// 显示主页（书架）
function showHome(): void {
  clearContent();
  var $app = $("#app");
  $app.append(createShelf());
}

/**
 * 处理 URL 中的 JWT 参数登录
 * 用于 OAuth 回调场景：外部认证服务将 JWT 通过 URL 参数传回
 *
 * 安全说明：
 * - JWT 不会存储到 localStorage 或客户端可访问的 Cookie
 * - JWT 通过安全 POST 请求发送到后端验证，后端会设置 HttpOnly、Secure、SameSite Cookie
 * - URL 中的 jwt 参数会在发送后立即移除（通过 replaceState）
 *
 * replaceState 的限制：
 * - replaceState 只能修改当前地址栏显示的 URL，无法撤销已发生的传输
 * - 初始请求时 URL 中的 jwt 参数可能已被记录到：浏览器历史、服务器访问日志、已发送的 Referer 头
 * - 建议：避免在 URL 中传递敏感令牌，优先使用 POST 回调、短期令牌或服务器端令牌交换
 */
function handleJwtQueryLogin(): void {
  var jwtFromQuery: string | null = null;

  try {
    jwtFromQuery = getQueryParam("jwt");
  } catch (e) {
    console.error("Failed to read query parameter:", e);
    return;
  }

  if (!jwtFromQuery) {
    return;
  }

  removeQueryParam("jwt");

  try {
    validateOAuthToken(
      jwtFromQuery,
      function () {
        window.location.reload();
      },
      function (error) {
        console.error("OAuth token validation failed:", error);
        alert("登录验证失败，请重试");
      },
    );
  } catch (e) {
    console.error("Failed to validate OAuth token:", e);
    alert("登录验证失败，请重试");
  }
}

window.showHome = showHome;

function clearAuthState(): void {
  localStorage.removeItem("jwt_token");
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf("=");
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

function handleGetUserInfoError(error: unknown): void {
  console.error("获取用户信息失败:", error);
  clearAuthState();
  showLoginModal(false);
}

// DOM Ready（使用 jQuery 1.x 风格）
$(function () {
  handleJwtQueryLogin();
  initAjaxSetup();
  setShowLoginModalCallback(showLoginModal);
  setRefreshShelfCallback(refreshShelf);
  setRegisterRefreshShelfCallback(refreshShelf);
  showHome();

  // 获取用户信息
  getUserInfo(function (userInfo) {
    showUserInfo(userInfo);
  }, handleGetUserInfoError);
});
