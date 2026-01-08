// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { BookFile } from "../types";
import { isMultiSelect } from "./multiSelect";

var openBookCallback: ((bookUuid: string) => void) | null = null;

export function setOpenBookCallback(
  callback: (bookUuid: string) => void,
): void {
  openBookCallback = callback;
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
  var $name = $('<span class="book-name">' + book.originalFilename + "</span>");
  $bookItem.append($cover);
  $bookItem.append($name);
  $bookItem.attr("page", String(book.page));
  $bookItem.attr("pageSize", String(book.pageSize));
  $bookItem.attr("uuid", book.uuid);
  $bookItem.attr("data-type", "file");

  if (!bookItem) {
    $bookItem.click(function () {
      if (isMultiSelect()) {
        $bookItem.toggleClass("active");
      } else {
        var uuid = $bookItem.attr("uuid");
        if (uuid && openBookCallback) {
          openBookCallback(uuid);
        }
      }
    });
  }
  return $bookItem;
}
