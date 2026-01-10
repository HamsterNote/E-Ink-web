// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import $ from "jquery";
import { BookContentResponse, Chapter, ReadingProgress } from "./types";
import {
  loadProgress,
  saveProgress,
  loadBookmarks,
  saveBookmarks,
  addBookmark as stateAddBookmark,
  removeBookmark as stateRemoveBookmark,
} from "./state";
import { clearAuthState } from "../auth/session";
import { showLoginModal } from "../auth";

interface ParsedTextItem {
  id: string;
  content: string;
  pageId: string;
  pageNumber: number;
}

interface ParseDocumentResponse {
  docId: string;
  title: string;
  items: ParsedTextItem[];
}

export function getBookContent(bookUuid: string): Promise<BookContentResponse> {
  return new Promise(function (resolve, reject) {
    $.ajax({
      type: "GET",
      url: "/api/v1/files/" + encodeURIComponent(bookUuid) + "/parsed-texts",
      dataType: "json",
      xhrFields: {
        withCredentials: true,
      },
      statusCode: {
        401: function () {
          clearAuthState().then(function () {
            showLoginModal(false);
          });
        },
      },
      success: function (response: ParseDocumentResponse) {
        var htmlContent = buildHtmlContent(response.items);

        var result: BookContentResponse = {
          uuid: bookUuid,
          title: response.title || "未知标题",
          content: htmlContent,
          chapters: [],
        };

        resolve(result);
      },
      error: function (xhr, status, error) {
        reject(error || { message: "get book content error", status: status });
      },
    });
  });
}

function buildHtmlContent(items: ParsedTextItem[]): string {
  var html = '<div class="book-content">';
  var currentPage = -1;
  var sortedItems = items.slice().sort(function (a, b) {
    var pageDiff = a.pageNumber - b.pageNumber;
    if (pageDiff !== 0) {
      return pageDiff;
    }
    return getItemSortId(a) - getItemSortId(b);
  });

  for (var i = 0; i < sortedItems.length; i++) {
    var item = sortedItems[i];
    if (item.pageNumber !== currentPage) {
      if (currentPage !== -1) {
        html += "</div>";
      }
      currentPage = item.pageNumber;
      html += '<div class="book-page" data-page="' + currentPage + '">';
    }
    html += "<p>" + escapeHtml(item.content) + "</p>";
  }

  if (currentPage !== -1) {
    html += "</div>";
  }

  html += "</div>";
  return html;
}

function getItemSortId(item: ParsedTextItem): number {
  var rawId = item.id || item.pageId || "0";
  var parsedId = parseInt(String(rawId), 10);
  if (isNaN(parsedId)) {
    return 0;
  }
  return parsedId;
}

function escapeHtml(text: string): string {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 保存阅读进度（通过状态管理器）
 * 注意：此函数使用当前状态保存进度，参数仅为 API 兼容性保留
 */
export function saveReadingProgress(
  _bookUuid: string,
  _page: number,
): Promise<void> {
  return new Promise(function (resolve, reject) {
    try {
      saveProgress();
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 获取阅读进度（通过状态管理器）
 * @param bookUuid 书籍唯一标识
 * @returns Promise<ReadingProgress | null> 阅读进度，如果不存在则返回 null
 */
export function getReadingProgress(
  bookUuid: string,
): Promise<ReadingProgress | null> {
  return new Promise(function (resolve, reject) {
    try {
      var progress = loadProgress(bookUuid);
      resolve(progress);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 保存书签（通过状态管理器）
 * @param bookUuid 书籍唯一标识
 * @param page 页码
 * @returns Promise<void>
 */
export function saveBookmark(_bookUuid: string, page: number): Promise<void> {
  return new Promise(function (resolve, reject) {
    try {
      stateAddBookmark(page);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 删除书签（通过状态管理器）
 * @param bookUuid 书籍唯一标识
 * @param page 页码
 * @returns Promise<void>
 */
export function removeBookmark(_bookUuid: string, page: number): Promise<void> {
  return new Promise(function (resolve, reject) {
    try {
      stateRemoveBookmark(page);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 获取书签列表（通过状态管理器）
 * @param bookUuid 书籍唯一标识
 * @returns Promise<number[]> 书签页码列表
 */
export function getBookmarks(bookUuid: string): Promise<number[]> {
  return new Promise(function (resolve, reject) {
    try {
      var bookmarks = loadBookmarks(bookUuid);
      resolve(bookmarks);
    } catch (e) {
      reject(e);
    }
  });
}
