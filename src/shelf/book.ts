// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { BookFile } from "../types";
import { isMultiSelect } from "./multiSelect";

var readerScriptLoading = false;
var readerScriptCallbacks: Array<
  (showReaderFn: (bookUuid: string) => void) => void
> = [];
var readerScriptUrl = "reader.js";

function getShowReaderFromWindow(): ((bookUuid: string) => void) | null {
  if (window.showReader && typeof window.showReader === "function") {
    return window.showReader;
  }
  if (
    window.reader &&
    typeof window.reader.showReader === "function"
  ) {
    return window.reader.showReader;
  }
  return null;
}

function flushReaderCallbacks(
  showReaderFn: (bookUuid: string) => void,
): void {
  for (var i = 0; i < readerScriptCallbacks.length; i++) {
    readerScriptCallbacks[i](showReaderFn);
  }
  readerScriptCallbacks = [];
}

function handleReaderScriptError(error: unknown): void {
  console.error("加载阅读器脚本失败:", error);
  alert("打开阅读器失败");
  readerScriptCallbacks = [];
}

export function createBook(
  book: BookFile,
  bookItem?: JQuery<HTMLElement>,
): JQuery<HTMLElement> {
  var $bookItem = bookItem || $("<div></div>");
  $bookItem.attr("class", "book");
  $bookItem.html("");
  var $cover = $(
    '<div class="book-cover"><img class="book-cover-image" src=""/></div>',
  );
  var $name = $('<span class="book-name"></span>');
  $name.text(book.originalFilename || "");
  $bookItem.append($cover);
  $bookItem.append($name);
  $bookItem.attr("page", String(book.page));
  $bookItem.attr("pageSize", String(book.pageSize));
  $bookItem.attr("uuid", book.uuid);
  $bookItem.attr("data-type", "file");

  if (!bookItem) {
    // 第一次创建才添加事件避免重复绑定
    $bookItem.click(function () {
      var $currentItem = $(this);
      if (isMultiSelect()) {
        // 多选模式：切换选中状态
        $currentItem.toggleClass("active");
      } else {
        // 普通模式：点击书籍封面打开阅读器
        var currentUuid = $currentItem.attr("uuid");
        if (currentUuid) {
          openReader(currentUuid);
        }
      }
    });
  }
  return $bookItem;
}

/**
 * 打开阅读器
 * @param bookUuid 书籍唯一标识
 */
function openReader(bookUuid: string): void {
  var showReader = getShowReaderFromWindow();
  if (showReader) {
    showReader(bookUuid);
    return;
  }

  readerScriptCallbacks.push(function (showReaderFn) {
    showReaderFn(bookUuid);
  });

  if (readerScriptLoading) {
    return;
  }

  readerScriptLoading = true;

  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = readerScriptUrl;
  script.onload = function () {
    readerScriptLoading = false;
    var loadedShowReader = getShowReaderFromWindow();
    if (loadedShowReader) {
      flushReaderCallbacks(loadedShowReader);
    } else {
      handleReaderScriptError("reader entry not found");
    }
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  };
  script.onerror = function (error) {
    readerScriptLoading = false;
    handleReaderScriptError(error);
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  };

  var container =
    document.body || document.getElementsByTagName("head")[0];
  if (container) {
    container.appendChild(script);
  } else {
    readerScriptLoading = false;
    handleReaderScriptError("script container missing");
  }
}
