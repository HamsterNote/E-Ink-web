// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { getBookContent } from "./api";
import { initState, getState, updateState, saveProgress } from "./state";
import { refreshScreen } from "../common";

var showHomeCallback: (() => void) | null = null;

export function setShowHomeCallback(callback: () => void): void {
  showHomeCallback = callback;
}

export function createReader(bookUuid: string): JQuery<HTMLElement> {
  var $reader = $('<div id="reader"></div>');
  var $readerContent = $('<div class="reader-content"></div>');
  var $loading = $('<div class="reader-loading">加载中...</div>');

  $reader.append($loading);

  getBookContent(bookUuid)
    .then(function (response) {
      $loading.remove();
      initState(bookUuid, response.title, response.content, response.chapters);

      var $title = $('<div class="reader-title">' + response.title + "</div>");
      $readerContent.append($title);

      var $contentArea = $('<div class="reader-text"></div>');
      $contentArea.html(response.content);
      $readerContent.append($contentArea);

      $reader.append($readerContent);
      $reader.append(createReaderBottomBar());

      setupTouchNavigation($reader, $contentArea);
    })
    .catch(function (err) {
      $loading.text("加载失败: " + (err.message || err));
      console.error("加载书籍内容失败:", err);
    });

  return $reader;
}

function createReaderBottomBar(): JQuery<HTMLElement> {
  var $bottomBar = $('<div class="reader-bottom-bar"></div>');
  var $backBtn = $('<div class="bottom-bar-btn">返回</div>');
  var $refreshBtn = $('<div class="bottom-bar-btn">刷屏</div>');
  var $settingsBtn = $('<div class="bottom-bar-btn">设置</div>');

  $backBtn.click(function () {
    saveProgress();
    if (showHomeCallback) {
      showHomeCallback();
    }
  });

  $refreshBtn.click(function () {
    refreshScreen();
  });

  $settingsBtn.click(function () {
    showReaderSettings();
  });

  $bottomBar.append($backBtn);
  $bottomBar.append($refreshBtn);
  $bottomBar.append($settingsBtn);

  return $bottomBar;
}

function setupTouchNavigation(
  $reader: JQuery<HTMLElement>,
  $contentArea: JQuery<HTMLElement>,
): void {
  var contentEl = $contentArea[0];
  if (!contentEl) return;

  var startY = 0;
  var scrollTop = 0;

  $contentArea.on("touchstart", function (e) {
    var touch = (e.originalEvent as TouchEvent).touches[0];
    startY = touch.clientY;
    scrollTop = contentEl.scrollTop;
  });

  $contentArea.on("touchmove", function (e) {
    var touch = (e.originalEvent as TouchEvent).touches[0];
    var deltaY = startY - touch.clientY;
    contentEl.scrollTop = scrollTop + deltaY;
  });
}

function showReaderSettings(): void {
  var state = getState();
  if (!state) return;

  var $overlay = $('<div class="reader-settings-overlay"></div>');
  var $panel = $('<div class="reader-settings-panel"></div>');

  var $fontSizeRow = $('<div class="settings-row"></div>');
  $fontSizeRow.append('<span class="settings-label">字体大小</span>');

  var $fontSmaller = $('<button class="settings-btn">A-</button>');
  var $fontLarger = $('<button class="settings-btn">A+</button>');
  var $fontSizeValue = $(
    '<span class="settings-value">' + state.fontSize + "mm</span>",
  );

  $fontSmaller.click(function () {
    var current = getState();
    if (current && current.fontSize > 2) {
      updateState({ fontSize: current.fontSize - 0.5 });
      $fontSizeValue.text(current.fontSize - 0.5 + "mm");
      applyFontSize(current.fontSize - 0.5);
    }
  });

  $fontLarger.click(function () {
    var current = getState();
    if (current && current.fontSize < 10) {
      updateState({ fontSize: current.fontSize + 0.5 });
      $fontSizeValue.text(current.fontSize + 0.5 + "mm");
      applyFontSize(current.fontSize + 0.5);
    }
  });

  $fontSizeRow.append($fontSmaller);
  $fontSizeRow.append($fontSizeValue);
  $fontSizeRow.append($fontLarger);

  var $closeBtn = $('<button class="settings-close-btn">关闭</button>');
  $closeBtn.click(function () {
    $overlay.remove();
  });

  $panel.append($fontSizeRow);
  $panel.append($closeBtn);
  $overlay.append($panel);

  $overlay.click(function (e) {
    if (e.target === $overlay[0]) {
      $overlay.remove();
    }
  });

  $("#app").append($overlay);
}

function applyFontSize(size: number): void {
  $(".reader-text").css("font-size", size + "mm");
}
