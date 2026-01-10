// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import $ from "jquery";
import {
  getState,
  updateState,
  addBookmark,
  removeBookmark,
  hasBookmark,
  saveSettings,
} from "./state";
import {
  renderPage,
  applyDisplaySettings,
  getPages,
  clearPageCache,
} from "./renderer";

/**
 * 渲染功能栏组件
 * @returns jQuery 对象
 */
export function renderToolbar(): JQuery<HTMLElement> {
  // 创建功能栏容器
  var $toolbar = $('<div id="reader-toolbar"></div>');

  // 创建按钮容器
  var $buttonContainer = $('<div class="toolbar-button-container"></div>');

  // 返回书架按钮
  var $backButton = $('<button class="toolbar-button">返回书架</button>');
  $backButton.click(function () {
    handleBackToShelf();
  });

  // 目录按钮
  var $tocButton = $('<button class="toolbar-button">目录</button>');
  $tocButton.click(function () {
    handleShowTOC();
  });

  // 字体增大按钮
  var $fontIncreaseButton = $('<button class="toolbar-button">字体+</button>');
  $fontIncreaseButton.click(function () {
    handleFontSizeChange(0.5);
  });

  // 字体减小按钮
  var $fontDecreaseButton = $('<button class="toolbar-button">字体-</button>');
  $fontDecreaseButton.click(function () {
    handleFontSizeChange(-0.5);
  });

  // 行距增大按钮
  var $lineHeightIncreaseButton = $(
    '<button class="toolbar-button">行距+</button>',
  );
  $lineHeightIncreaseButton.click(function () {
    handleLineHeightChange(0.1);
  });

  // 行距减小按钮
  var $lineHeightDecreaseButton = $(
    '<button class="toolbar-button">行距-</button>',
  );
  $lineHeightDecreaseButton.click(function () {
    handleLineHeightChange(-0.1);
  });

  // 书签按钮
  var $bookmarkButton = $(
    '<button class="toolbar-button" id="toolbar-bookmark-button">书签</button>',
  );
  $bookmarkButton.click(function () {
    handleBookmark();
  });

  // 添加所有按钮到容器
  $buttonContainer.append($backButton);
  $buttonContainer.append($tocButton);
  $buttonContainer.append($fontIncreaseButton);
  $buttonContainer.append($fontDecreaseButton);
  $buttonContainer.append($lineHeightIncreaseButton);
  $buttonContainer.append($lineHeightDecreaseButton);
  $buttonContainer.append($bookmarkButton);

  // 添加到功能栏
  $toolbar.append($buttonContainer);

  return $toolbar;
}

/**
 * 显示功能栏
 */
export function showToolbar(): void {
  var $toolbar = $("#reader-toolbar");
  if ($toolbar.length > 0) {
    $toolbar.addClass("visible");
    updateState({ isToolbarVisible: true });
  }
}

/**
 * 隐藏功能栏
 */
export function hideToolbar(): void {
  var $toolbar = $("#reader-toolbar");
  if ($toolbar.length > 0) {
    $toolbar.removeClass("visible");
    updateState({ isToolbarVisible: false });
  }
}

/**
 * 切换功能栏显示状态
 */
export function toggleToolbar(): void {
  var state = getState();
  if (state && state.isToolbarVisible) {
    hideToolbar();
  } else {
    showToolbar();
  }
}

/**
 * 更新书签按钮状态
 * @param hasBookmarkInCurrentPage 当前页是否有书签
 */
export function updateBookmarkButton(hasBookmarkInCurrentPage: boolean): void {
  var $button = $("#toolbar-bookmark-button");
  if ($button.length > 0) {
    if (hasBookmarkInCurrentPage) {
      $button.text("删除书签");
    } else {
      $button.text("添加书签");
    }
  }
}

/**
 * 处理返回书架
 */
function handleBackToShelf(): void {
  // 触发返回事件，由主入口模块处理
  $(document).trigger("reader-exit");
}

/**
 * 处理显示目录
 */
function handleShowTOC(): void {
  var state = getState();
  if (!state || !state.chapters || state.chapters.length === 0) {
    alert("本书没有目录");
    return;
  }

  // 创建目录模态框
  var $modal = $('<div id="reader-toc-modal"></div>');

  // 创建标题
  var $title = $("<h2>目录</h2>");
  $modal.append($title);

  // 创建章节列表
  var $list = $('<div class="toc-list"></div>');

  for (var i = 0; i < state.chapters.length; i++) {
    var chapter = state.chapters[i];
    var $item = $('<div class="toc-item"></div>');
    $item.text(chapter.title);
    $item.attr("data-chapter-index", String(chapter.index));

    // 绑定点击事件
    $item.click(function () {
      var chapterIndex = parseInt(
        $(this).attr("data-chapter-index") || "0",
        10,
      );
      jumpToChapter(chapterIndex);
      $modal.remove();
    });

    $list.append($item);
  }

  $modal.append($list);

  // 添加关闭按钮
  var $closeButton = $('<button class="toolbar-button">关闭</button>');
  $closeButton.click(function () {
    $modal.remove();
  });
  $modal.append($closeButton);

  // 添加到页面
  $("body").append($modal);
}

/**
 * 跳转到指定章节
 * @param chapterIndex 章节索引
 */
function jumpToChapter(chapterIndex: number): void {
  var state = getState();
  if (!state) {
    return;
  }

  var pages = getPages();
  if (!pages || pages.length === 0) {
    renderPage(0);
    return;
  }

  var targetPage = 0;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].chapterIndex === chapterIndex) {
      targetPage = i;
      break;
    }
  }

  if (targetPage >= state.totalPages) {
    targetPage = state.totalPages - 1;
  }

  renderPage(targetPage);
}

/**
 * 处理字体大小变化
 * @param delta 变化量（mm）
 */
function handleFontSizeChange(delta: number): void {
  var state = getState();
  if (!state) {
    return;
  }

  var newFontSize = state.fontSize + delta;
  newFontSize = Math.max(2, Math.min(10, newFontSize));

  var pages = getPages();
  var currentCharOffset = 0;
  if (pages && pages[state.currentPage]) {
    currentCharOffset = pages[state.currentPage].startIndex;
  }

  updateState({ fontSize: newFontSize });
  saveSettings();

  clearPageCache();
  applyDisplaySettings();

  var newPages = getPages();
  var newPage = 0;
  if (newPages) {
    for (var i = 0; i < newPages.length; i++) {
      if (
        newPages[i].startIndex <= currentCharOffset &&
        newPages[i].endIndex > currentCharOffset
      ) {
        newPage = i;
        break;
      }
    }
  }

  renderPage(newPage);
}

/**
 * 处理行距变化
 * @param delta 变化量（em）
 */
function handleLineHeightChange(delta: number): void {
  var state = getState();
  if (!state) {
    return;
  }

  var newLineHeight = state.lineHeight + delta;
  newLineHeight = Math.max(
    1.0,
    Math.min(3.0, Math.round(newLineHeight * 10) / 10),
  );

  var pages = getPages();
  var currentCharOffset = 0;
  if (pages && pages[state.currentPage]) {
    currentCharOffset = pages[state.currentPage].startIndex;
  }

  updateState({ lineHeight: newLineHeight });
  saveSettings();

  clearPageCache();
  applyDisplaySettings();

  var newPages = getPages();
  var newPage = 0;
  if (newPages) {
    for (var i = 0; i < newPages.length; i++) {
      if (
        newPages[i].startIndex <= currentCharOffset &&
        newPages[i].endIndex > currentCharOffset
      ) {
        newPage = i;
        break;
      }
    }
  }

  renderPage(newPage);
}

/**
 * 处理书签操作
 */
function handleBookmark(): void {
  var state = getState();
  if (!state) {
    return;
  }

  var currentPage = state.currentPage;

  if (hasBookmark(currentPage)) {
    // 删除书签
    removeBookmark(currentPage);
    updateBookmarkButton(false);
  } else {
    // 添加书签
    addBookmark(currentPage);
    updateBookmarkButton(true);
  }
}
