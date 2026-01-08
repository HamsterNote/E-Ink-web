// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { Directory } from "../types";
import { directoryIcon } from "../common";
import { isMultiSelect } from "./multiSelect";

export function createDirectory(directory: Directory): JQuery<HTMLElement> {
  var $result = $('<div class="book"></div>');
  var $cover = $(
    '<div class="book-cover"><img class="book-cover-image directory-icon" src="' +
      directoryIcon +
      '"/></div>',
  );
  var $name = $('<span class="book-name">' + directory.name + "</span>");
  $result.append($cover);
  $result.append($name);
  $result.attr("uuid", directory.uuid);
  $result.attr("data-type", "folder");
  return $result;
}
