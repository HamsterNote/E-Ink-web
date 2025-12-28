// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { BookFile } from '../types';
import { isMultiSelect } from './multiSelect';

/**
 * 创建书籍元素
 * @param book 书籍数据
 * @param bookItem 可选的已存在的书籍元素
 * @returns 书籍的 jQuery 对象
 */
export function createBook(book: BookFile, bookItem?: JQuery<HTMLElement>): JQuery<HTMLElement> {
	var $bookItem = bookItem || $('<div></div>')
	$bookItem.attr('class', 'book')
	$bookItem.html('')
	var $cover = $('<div class="book-cover"><img class="book-cover-image" src=""/></div>');
	var $name = $('<span class="book-name">' + book.originalFilename + '</span>')
	$bookItem.append($cover);
	$bookItem.append($name);
	$bookItem.attr('page', String(book.page))
	$bookItem.attr('pageSize', String(book.pageSize))
	$bookItem.attr('uuid', book.uuid)

	if (!bookItem) {
		// 第一次创建才添加事件避免重复绑定
		$bookItem.click(function() {
			if (isMultiSelect()) {
				$bookItem.toggleClass('active')
			}
		})
	}
	return $bookItem
}
