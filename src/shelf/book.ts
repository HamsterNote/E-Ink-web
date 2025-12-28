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
				// 多选模式：切换选中状态
				$bookItem.toggleClass('active')
			} else {
				// 普通模式：点击书籍封面打开阅读器
				openReader(book.uuid);
			}
		})
	}
	return $bookItem
}

/**
 * 打开阅读器
 * @param bookUuid 书籍唯一标识
 */
function openReader(bookUuid: string): void {
	// 动态导入阅读器模块，避免循环依赖
	import('../reader/index').then(function(module) {
		var showReader = module.showReader;
		if (typeof showReader === 'function') {
			showReader(bookUuid);
		}
	}).catch(function(error) {
		console.error('加载阅读器模块失败:', error);
		alert('打开阅读器失败');
	});
}
