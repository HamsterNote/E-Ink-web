// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';

/**
 * 创建滚动区域容器
 * @param $content 滚动区域内容的 jQuery 对象
 * @returns 滚动区域的 jQuery 对象
 */
export function createScrollArea($content: JQuery<HTMLElement>): JQuery<HTMLElement> {
	var $scrollArea = $('<div class="scroll-area"></div>')
	$content.appendTo($scrollArea)
	return $scrollArea
}

/**
 * 激活滚动区域，添加滚动条和滚动事件
 * @param $scrollArea 滚动区域的 jQuery 对象
 * @param forceDisplayScrollBar 是否强制显示滚动条
 * @param onScroll 滚动回调函数
 */
export function activeScrollArea(
	$scrollArea: JQuery<HTMLElement>,
	forceDisplayScrollBar?: boolean,
	onScroll?: (scrollTop: number) => void
): void {
	var forceDisplay = forceDisplayScrollBar !== undefined ? forceDisplayScrollBar : false;

	$scrollArea.ready(function() {
		var $scrollBarWrapper = $('<div class="scroll-bar-wrapper"></div>');
		var $content = $scrollArea.find('> :first-child')
		if (!$content.length) {
			return;
		}
		var $scrollBar = $('<div class="scroll-bar"></div>');
		var $scrollDownButton = $('<div class="scroll-button scroll-down-button"></div>');
		var $scrollUpButton = $('<div class="scroll-button scroll-up-button"></div>');
		var totalAreaHeight = $scrollArea.height() || 0;
		var contentHeight = $content.height() || 0;

		if (!forceDisplay && totalAreaHeight >= contentHeight) {
			$scrollArea.addClass('no-scroll')
		}

		console.log(totalAreaHeight / contentHeight, totalAreaHeight, contentHeight)
		var scrollBarHeight = Math.min(totalAreaHeight / contentHeight * 100, 100);
		var $scrollBarItem = $('<div class="scroll-bar-item" style="top: 0; height: ' + scrollBarHeight + '%;"></div>');
		$scrollBar.append($scrollUpButton)
		$scrollBar.append($scrollDownButton)
		$scrollBarWrapper.append($scrollBar);
		$scrollBar.append($scrollBarItem);
		$scrollArea.append($scrollBarWrapper);

		var marginTop = 0;

		$scrollDownButton.click(function() {
			marginTop -= totalAreaHeight - 80;
			marginTop = Math.max(totalAreaHeight - contentHeight, marginTop)
			$content.css('margin-top', marginTop + 'px')
			$scrollBarItem.css('top', (-marginTop / contentHeight * 100) + '%')
			if (onScroll) {
				onScroll(marginTop)
			}
		})

		$scrollUpButton.click(function() {
			marginTop += totalAreaHeight - 80;
			marginTop = Math.min(0, marginTop)
			$content.css('margin-top', marginTop + 'px')
			$scrollBarItem.css('top', (-marginTop / contentHeight * 100) + '%')
			if (onScroll) {
				onScroll(marginTop)
			}
		})
	})
}

