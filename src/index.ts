// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { initAjaxSetup, getUserInfo, setShowLoginModalCallback } from "./api";
import { showLoginModal, showUserInfo, setRefreshShelfCallback } from "./auth";
import { setRegisterRefreshShelfCallback } from "./auth/register";
import { createShelf, refreshShelf } from "./shelf";
import { getQueryParam, removeQueryParam, setCookie } from "./utils";

// 清除所有内容
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

// 显示主页
function showHome(): void {
  clearContent();
  var $app = $("#app");
  $app.append(createShelf());
}

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
  showHome();
  getUserInfo(function (userInfo) {
    showUserInfo(userInfo);
  });
});
