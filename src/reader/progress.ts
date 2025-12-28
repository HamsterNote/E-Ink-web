// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import $ from 'jquery';
import { getState } from './state';
import { renderPage } from './renderer';

/**
 * 渲染进度条组件
 * @returns jQuery 对象
 */
export function renderProgressBar(): JQuery<HTMLElement> {
	// 创建进度条容器
	var $bar = $('<div id="reader-progress-bar"></div>');

	// 创建进度填充
	var $fill = $('<div id="reader-progress-fill"></div>');
	$bar.append($fill);

	// 创建进度滑块
	var $thumb = $('<div id="reader-progress-thumb"></div>');
	$bar.append($thumb);

	// 绑定点击事件
	$bar.click(function(event) {
		handleProgressBarClick(event);
	});

	return $bar;
}

/**
 * 更新进度显示
 * @param currentPage 当前页码
 * @param totalPages 总页数
 */
export function updateProgress(currentPage: number, totalPages: number): void {
	if (totalPages <= 0) {
		return;
	}

	// 计算进度百分比
	var percentage = (currentPage / (totalPages - 1)) * 100;

	// 更新进度填充宽度
	var $fill = $('#reader-progress-fill');
	if ($fill.length > 0) {
		$fill.css('width', percentage + '%');
	}

	// 更新滑块位置
	var $thumb = $('#reader-progress-thumb');
	if ($thumb.length > 0) {
		$thumb.css('left', 'calc(' + percentage + '% - 1mm)');
	}
}

/**
 * 处理进度条点击事件
 * @param event jQuery 事件对象
 */
function handleProgressBarClick(event: JQuery.Event): void {
	var state = getState();
	if (!state) {
		return;
	}

	var $bar = $('#reader-progress-bar');
	if ($bar.length === 0) {
		return;
	}

	// 获取点击位置相对于进度条的比例
	var offset = $bar.offset() || { left: 0 };
	var clickX = (event as any).pageX - offset.left;
	var barWidth = $bar.width() || 1;

	var ratio = clickX / barWidth;

	// 限制在 [0, 1] 范围内
	ratio = Math.max(0, Math.min(1, ratio));

	// 计算目标页码
	var targetPage = Math.floor(ratio * state.totalPages);

	// 渲染目标页
	renderPage(targetPage);
}
