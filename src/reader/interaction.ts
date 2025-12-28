// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import $ from 'jquery';
import { getState } from './state';
import { renderPage } from './renderer';
import { updateProgress } from './progress';
import { toggleToolbar, updateBookmarkButton } from './toolbar';

// 防抖控制：最小点击间隔（毫秒）
var MIN_CLICK_INTERVAL = 300;
var lastClickTime = 0;

/**
 * 初始化交互区域
 * 绑定屏幕点击事件
 */
export function initInteraction(): void {
	// 绑定到 reader 容器
	$(document).on('click', '#reader', function(event) {
		handleReaderClick(event);
	});
}

/**
 * 处理阅读器点击事件
 * @param event jQuery 事件对象
 */
function handleReaderClick(event: JQuery.Event): void {
	// 防抖：检查点击间隔
	var now = Date.now();
	if (now - lastClickTime < MIN_CLICK_INTERVAL) {
		return;
	}
	lastClickTime = now;

	var $target = $(event.target);

	// 如果点击的是功能栏或其内部元素，不处理
	if ($target.closest('#reader-toolbar').length > 0 ||
	    $target.closest('#reader-toc-modal').length > 0 ||
	    $target.closest('#reader-progress-bar').length > 0) {
		return;
	}

	// 获取点击位置
	var pageX = (event as any).pageX;
	var pageY = (event as any).pageY;

	// 获取容器尺寸
	var $reader = $('#reader');
	if ($reader.length === 0) {
		return;
	}

	var offset = $reader.offset() || { top: 0, left: 0 };
	var width = $reader.width() || 1;
	var height = $reader.height() || 1;

	// 计算相对位置
	var relativeX = pageX - offset.left;
	var relativeY = pageY - offset.top;

	// 计算百分比
	var percentX = (relativeX / width) * 100;
	var percentY = (relativeY / height) * 100;

	// 判断点击区域并处理
	handleZoneClick(percentX, percentY);
}

/**
 * 根据点击位置处理相应的操作
 * @param percentX 横向百分比位置
 * @param percentY 纵向百分比位置
 */
function handleZoneClick(percentX: number, percentY: number): void {
	var state = getState();
	if (!state) {
		return;
	}

	// 区域划分
	// 顶部 15%
	// 底部 15%
	// 中部 70%，分为左右两部分

	var TOP_THRESHOLD = 15;
	var BOTTOM_THRESHOLD = 85;
	var LEFT_THRESHOLD = 50;

	var zone: string;

	if (percentY < TOP_THRESHOLD) {
		zone = 'top';
	} else if (percentY > BOTTOM_THRESHOLD) {
		zone = 'bottom';
	} else if (percentX < LEFT_THRESHOLD) {
		zone = 'left';
	} else {
		zone = 'right';
	}

	// 根据区域执行相应操作
	switch (zone) {
		case 'top':
		case 'bottom':
			// 显示/隐藏功能栏
			toggleToolbar();
			break;
		case 'left':
			// 上一页
			previousPage();
			break;
		case 'right':
			// 下一页
			nextPage();
			break;
	}
}

/**
 * 上一页
 */
export function previousPage(): void {
	var state = getState();
	if (!state) {
		return;
	}

	if (state.currentPage > 0) {
		var newPage = state.currentPage - 1;
		renderPage(newPage);
		updateProgress(newPage, state.totalPages);
		updateBookmarkButtonState();
	}
}

/**
 * 下一页
 */
export function nextPage(): void {
	var state = getState();
	if (!state) {
		return;
	}

	if (state.currentPage < state.totalPages - 1) {
		var newPage = state.currentPage + 1;
		renderPage(newPage);
		updateProgress(newPage, state.totalPages);
		updateBookmarkButtonState();
	}
}

/**
 * 跳转到指定页
 * @param pageNumber 目标页码
 */
export function goToPage(pageNumber: number): void {
	var state = getState();
	if (!state) {
		return;
	}

	if (pageNumber >= 0 && pageNumber < state.totalPages) {
		renderPage(pageNumber);
		updateProgress(pageNumber, state.totalPages);
		updateBookmarkButtonState();
	}
}

/**
 * 更新书签按钮状态
 */
function updateBookmarkButtonState(): void {
	var state = getState();
	if (!state) {
		return;
	}

	var currentPage = state.currentPage;
	var hasBookmarkInCurrentPage = state.bookmarks.indexOf(currentPage) !== -1;
	updateBookmarkButton(hasBookmarkInCurrentPage);
}
