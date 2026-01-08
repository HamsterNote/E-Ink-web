// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { initAjaxSetup, getUserInfo, setShowLoginModalCallback } from "./api";
import { showLoginModal, showUserInfo, setRefreshShelfCallback } from "./auth";
import { setRegisterRefreshShelfCallback } from "./auth/register";
import { createShelf, refreshShelf } from "./shelf";
import { setOpenBookCallback } from "./shelf/book";
import { createReader, setShowHomeCallback } from "./reader";
import { getQueryParam, removeQueryParam, setCookie } from "./utils";

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

export function showHome(): void {
  clearContent();
  var $app = $("#app");
  $app.append(createShelf());
}

export function showReader(bookUuid: string): void {
  clearContent();
  var $app = $("#app");
  $app.append(createReader(bookUuid));
}

/**
 * 处理 URL 中的 JWT 参数登录
 * 用于 OAuth 回调场景：外部认证服务将 JWT 通过 URL 参数传回
 * 安全说明：
 * - JWT 会立即存储到 localStorage 和 Cookie
 * - URL 中的 jwt 参数会被立即移除（通过 replaceState）
 * - 这样可以防止 JWT 泄露到浏览器历史、Referer 头和服务器日志
 */
function handleJwtQueryLogin(): void {
  var jwtFromQuery = getQueryParam("jwt");
  if (jwtFromQuery) {
    localStorage.setItem("jwt_token", jwtFromQuery);
    setCookie("jwt_token", jwtFromQuery, 30);
    removeQueryParam("jwt");
  }
}

$(function () {
  handleJwtQueryLogin();
  initAjaxSetup();
  setShowLoginModalCallback(showLoginModal);
  setRefreshShelfCallback(refreshShelf);
  setRegisterRefreshShelfCallback(refreshShelf);
  setShowHomeCallback(showHome);
  setOpenBookCallback(showReader);
  showHome();
  getUserInfo(function (userInfo) {
    showUserInfo(userInfo);
  });
});
