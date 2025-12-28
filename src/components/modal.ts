// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';

// 模态框 ID 计数器
var modalId = 0

// 模态框配置接口
export interface ModalOptions {
	showClose?: boolean;
	onConfirm?: () => void;
	onEnter?: () => void;
	className?: string;
}

/**
 * 显示模态框
 * @param content 模态框内容的 jQuery 对象
 * @param options 模态框配置选项
 */
export function showModal(content: JQuery<HTMLElement>, options?: ModalOptions): void {
	var opts = options || {};
	var showClose = opts.showClose !== undefined ? opts.showClose : false;
	var onConfirm = opts.onConfirm;
	var onEnter = opts.onEnter;
	var className = opts.className || '';

	var currentId = modalId++
	var $app = $('#app');
	var $modal = $('<div id="modal-' + currentId + '" class="modal ' + className + '"></div>');
	var $modalInnerMask = $('<div id="modal-' + currentId + '-inner-mask" class="modal-inner-mask"></div>');
	var $modalWrapper = $('<div id="modal-' + currentId + '-wrapper" class="modal-wrapper"></div>');
	var $modalMask = $('<div id="modal-mask-' + currentId + '" class="modal-mask ' + className + '"></div>')
	$app.append($modalMask)
	$modal.append($modalWrapper)
	$modal.append($modalInnerMask)
	$modalWrapper.append(content)

	if (showClose) {
		var $closeBtn = $('<div class="close-btn">✕</div>');
		$closeBtn.click(function() {
			$modal.remove();
			$modalMask.remove();
		})
		$modalWrapper.append($closeBtn);
	}

	if (onConfirm !== undefined) {
		var $confirmBtn = $('<div class="confirm-btn">确认</div>');
		$modalWrapper.append($confirmBtn);
		$confirmBtn.click(function() {
			if (onConfirm) {
				onConfirm();
			}
			$modal.remove();
			$modalMask.remove();
		})
	}

	$app.append($modal);

	if (showClose) {
		$modalMask.click(function() {
			$modal.remove();
			$modalMask.remove();
		})
		$modalInnerMask.click(function() {
			$modal.remove();
			$modalMask.remove();
		})
	}

	$modal.keydown(function(evt) {
		if (evt.key === 'Enter') {
			if (onEnter) {
				onEnter()
			}
		}
	})
}
