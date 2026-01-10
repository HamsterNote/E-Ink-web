// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import $ from "jquery";
import {
  initState,
  getState,
  clearState,
  subscribe,
  unsubscribe,
  saveProgress,
  updateState,
} from "./state";
import { getBookContent } from "./api";
import {
  renderPage,
  calculateTotalPages,
  splitContentIntoPages,
  clearPageCache,
} from "./renderer";
import { renderProgressBar, updateProgress } from "./progress";
import { renderToolbar, updateBookmarkButton } from "./toolbar";
import { initInteraction } from "./interaction";
import { ReaderState } from "./types";

/**
 * 显示阅读器
 * @param bookUuid 书籍唯一标识
 */
// 用于保存进度订阅者的引用，以便在退出时取消订阅，避免内存泄漏
var progressObserver: ((state: ReaderState) => void) | null = null;

export function showReader(bookUuid: string): void {
  // 清空当前页面内容
  clearContent();

  // 创建阅读器容器
  var $reader = $('<div id="reader"></div>');
  $("#app").append($reader);

  // 显示加载提示
  showLoading();

  // 获取书籍内容
  getBookContent(
    bookUuid,
    function (response) {
      // 隐藏加载提示
      hideLoading();

      // 确保阅读器 UI 已创建（包含 #reader-content-area）
      if ($("#reader-content-area").length === 0) {
        createReaderUI();
      }

      // 初始化状态
      initState(bookUuid, response.title, response.content, response.chapters);

      // 创建标题元素（使用 .text() 避免 XSS）
      var $readerContent = $("#reader-content-area");
      var $title = $('<div class="reader-title"></div>');
      $title.text(response.title || "");
      $readerContent.append($title);

      // 计算总页数
      var totalPages = calculateTotalPages(response.content);
      var state = getState();
      if (state) {
        // 使用 updateState 更新总页数，触发观察者通知
        updateState({ totalPages: totalPages });
        state = getState();

        if (state) {
          // 验证并 clamp currentPage，确保不超出范围
          var restoredPage = state.currentPage;
          if (restoredPage < 0 || restoredPage >= totalPages) {
            state.currentPage = Math.max(
              0,
              Math.min(restoredPage, totalPages - 1),
            );
          }

          // 渲染当前页
          renderPage(state.currentPage);

          // 更新进度条
          updateProgress(state.currentPage, state.totalPages);

          // 更新书签按钮状态
          var hasBookmarkInCurrentPage =
            state.bookmarks.indexOf(state.currentPage) !== -1;
          updateBookmarkButton(hasBookmarkInCurrentPage);
        }
      }

      // 订阅状态变化（保存引用以便退出时取消订阅，避免内存泄漏）
      progressObserver = function (state) {
        // 状态变化时自动保存进度
        saveProgress();
      };
      subscribe(progressObserver);

      // 绑定退出事件
      $(document).one("reader-exit", function () {
        exitReader();
      });
    },
    function (error) {
      // 隐藏加载提示
      hideLoading();

      // 显示错误提示
      console.error("加载书籍失败:", error);
      alert("加载书籍失败，请重试");

      // 退出阅读器
      exitReader();
    },
  );
}

// 挂载到全局，便于脚本加载后调用
if (typeof window !== "undefined") {
  window.showReader = showReader;
  if (!window.reader) {
    window.reader = {};
  }
  window.reader.showReader = showReader;
}

/**
 * 创建阅读器 UI
 */
function createReaderUI(): void {
  var $reader = $("#reader");
  if ($reader.length === 0) {
    return;
  }

  // 创建内容区域
  var $contentArea = $('<div id="reader-content-area"></div>');
  $reader.append($contentArea);

  // 创建进度条
  var $progressBar = renderProgressBar();
  $reader.append($progressBar);

  // 创建功能栏
  var $toolbar = renderToolbar();
  $reader.append($toolbar);

  // 初始化交互
  initInteraction();
}

/**
 * 清空页面内容
 */
function clearContent(): void {
  $("#app").empty();
}

/**
 * 显示加载提示
 */
function showLoading(): void {
  var $loading = $('<div class="loading">正在加载书籍...</div>');
  $("#app").append($loading);
}

/**
 * 隐藏加载提示
 */
function hideLoading(): void {
  $(".loading").remove();
}

/**
 * 退出阅读器，返回书架
 */
export function exitReader(): void {
  // 取消订阅，避免内存泄漏
  if (progressObserver) {
    unsubscribe(progressObserver);
    progressObserver = null;
  }

  // 清理状态
  clearState();

  // 清除分页缓存
  clearPageCache();

  // 移除阅读器容器
  $("#reader").remove();

  // 触发返回书架事件
  $(document).trigger("reader-back-to-shelf");
}

/**
 * 初始化阅读器模块
 * 这个函数在应用启动时调用
 */
export function initReaderModule(): void {
  // 监听返回书架事件
  $(document).on("reader-back-to-shelf", function () {
    var showHome = window.showHome;
    if (typeof showHome === "function") {
      showHome();
    } else {
      console.error("showHome 函数未注册，无法返回书架");
    }
  });
}

// 自动初始化模块
$(document).ready(function () {
  initReaderModule();
});
