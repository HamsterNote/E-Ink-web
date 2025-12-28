// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { Directory } from '../types';
import { directoryIcon } from '../common';

/**
 * 创建目录元素
 * @param directory 目录数据
 * @returns 目录的 jQuery 对象
 */
export function createDirectory(directory: Directory): JQuery<HTMLElement> {
	var result = $('<div class="book"><div class="book-cover"><img class="book-cover-image directory-icon" src="' + directoryIcon + '"/></div><span class="book-name">' + directory.name + '</span></div>')
	result.contextmenu(function() {
		alert('a')
	})
	return result
}
