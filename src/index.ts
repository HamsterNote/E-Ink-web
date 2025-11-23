// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { Book } from './types';

const windowHeight = $(window).height() || 1000;

// 通用 start
// 操作计数，到一定的次数就要刷一次屏
let operationCnt = 0
const refreshScreenTime = 10
// 操作计数+1，到一定的次数就要刷一次屏
function operationCntPlus() {
	operationCnt++
	if (operationCnt >= refreshScreenTime) {
		operationCnt = 0
		refreshScreen()
	}
}
// 通用 end

// Home start

// Book start
function createBook(book: Book) {
	let result = $(`<div class="book"><img class="book-cover" src="${book.cover}"/><span class="book-name">${book.name}</span></div>`)
	result.contextmenu(() => {
		alert('a')
	})
	return result
}
// Book end

// Shelf start
const mockBookList: Book[] = [{
	id: 1,
	name: '哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈',
	cover: '',
}, {
	id: 2,
	name: '哈哈是怎样炼成的',
	cover: '',
}, {
	id: 3,
	name: '姬霓太美',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}, {
	id: 4,
	name: '安卓手机',
	cover: '',
}]

function createShelf() {
	let shelf = $('<div id="shelf"></div>')
	mockBookList.forEach(book => {
		let bookItem = createBook(book)
		shelf.append(bookItem)
	})
	shelf.append('<div class="clear-both"></div>')
	const bottomBar = $('#bottom-bar')
	bottomBar.append(createShelfBottomBar())
	const rightBar = $('#right-bar')
	shelf.ready(() => {
		rightBar.append(createScrollBar(windowHeight - 100, shelf.height() || 0, 0, 100))
	})
	return shelf
}

let shelfScrollTop = 0

function scrollDownShelf() {
	let shelf = $('#shelf')
	const shelfHeight = shelf.height() || 0
	shelfScrollTop = Math.max(windowHeight - shelfHeight - 100, shelfScrollTop - windowHeight * 3 / 4)
	shelf.css('marginTop', `${shelfScrollTop}px`)
	updateScrollBarPercent(shelfScrollTop, windowHeight - 100, shelf.height() || 0, 0, 100)
	operationCntPlus()
}

function scrollUpShelf() {
	let shelf = $('#shelf')
	shelfScrollTop = Math.min(0, shelfScrollTop + windowHeight * 3 / 4)
	shelf.css('marginTop', `${shelfScrollTop}px`)
	updateScrollBarPercent(shelfScrollTop, windowHeight - 100, shelf.height() || 0, 0, 100)
	operationCntPlus()
}

function createShelfBottomBar() {
	const blankButton2 = $(`<div class="bottom-bar-btn"></div>`)
	const loginButton = $(`<div id="login-btn" class="bottom-bar-btn">登录</div>`)
	const refreshScreenButton = $(`<div id="shelf-refresh-screen" class="bottom-bar-btn">刷屏</div>`)
	const scrollDownButton = $(`<div id="shelf-scroll-down-bar" class="bottom-bar-btn">下翻</div>`)
	const scrollUpButton = $(`<div id="shelf-scroll-up-bar" class="bottom-bar-btn">上翻</div>`)
	let shelfBottomBar = $(`<div class="shelf-bottom-bar"></div>`)
	shelfBottomBar.append(loginButton)
	shelfBottomBar.append(blankButton2)
	shelfBottomBar.append(refreshScreenButton)
	shelfBottomBar.append(scrollUpButton)
	shelfBottomBar.append(scrollDownButton)
	scrollDownButton.click(scrollDownShelf)
	scrollUpButton.click(scrollUpShelf)
	refreshScreenButton.click(refreshScreen)
	loginButton.click(showLoginModal)
	return shelfBottomBar;
}

// 弹出登录窗口
function showLoginModal() {
	const $content = $(`<div id="login-modal-content"></div>`)
	const $usernameInput = $(`<input class="ink-input" type="text" placeholder="用户名">`)
	const $passwordInput = $(`<input class="ink-input" type="password" placeholder="密码">`)
	const $loginBtn = $(`<button class="ink-button">登录</button>`)
	const $modalTitle = $(`<div class="modal-title">请输入用户名和密码</div>`)
	$content.append($modalTitle)
	$content.append($usernameInput)
	$content.append($passwordInput)
	$content.append($loginBtn)
	showModal($content, { showClose: true })
}

// Shelf end

function showHome() {
	clearContent()
	const $app = $('#app');
	$app.append(createShelf());
}
// Home end

// 公共函数 start
// 清除所有内容
function clearContent() {
	const $app = $('#app');
	$app.html('');
	const $topBar = $('#top-bar');
	$topBar.html('');
	const $bottomBar = $('#bottom-bar');
	$bottomBar.html('');
	const $rightBar = $('#right-bar');
	$rightBar.html('');
	const $leftBar = $('#left-bar');
	$leftBar.html('');
}

// 创建滚动条
function createScrollBar(viewLength: number, total: number, paddingTop: number, paddingBottom: number) {
	const scrollBar = $(`<div id="scroll-bar" style="padding-top: ${paddingTop}px; padding-bottom: ${paddingBottom}px;"></div>`);
	const scrollBarWrapper = $(`<div id="scroll-bar-wrapper"></div>`);
	scrollBar.append(scrollBarWrapper)
	// 滚动条区域总长
	const barTotalHeight = windowHeight - paddingTop - paddingBottom;
	// 滚动条长度
	const barHeight = barTotalHeight * viewLength / total;
	console.log(barTotalHeight, viewLength, total, barHeight)
	const scrollBarContent = $(`<div id="scroll-bar-content" style="height: ${barHeight}px; top: 0;"></div>`);
	const scrollBarBackground = $(`<div id="scroll-bar-background"></div>`);
	scrollBarWrapper.append(scrollBarContent);
	scrollBarWrapper.append(scrollBarBackground);
	return scrollBar;
}

// 滚动条滚动到多少百分比
function updateScrollBarPercent(scrollTop: number, viewLength: number, total: number, paddingTop: number, paddingBottom: number) {
	// 滚动条区域总长
	const barTotalHeight = windowHeight - paddingTop - paddingBottom;
	const top = scrollTop * barTotalHeight / total;
	const scrollBarContent = $('#scroll-bar-content')
	console.log(scrollTop)
	scrollBarContent.css('top', `${-top}px`);
}

// 刷屏
function refreshScreen() {
	const $refreshScreen = $('#refresh-screen');
	$refreshScreen.show();
	setTimeout(() => {
		$refreshScreen.hide();
	}, 200)
}

let modalId = 0

function showModal(content: JQuery<HTMLElement>, {
	showClose = false,
	onConfirm = undefined
}: {
	showClose?: boolean;
	onConfirm?: () => void
} = {
	showClose: false,
	onConfirm: undefined
}): void {
	const currentId = modalId++
	const $app = $('#app');
	const $modal = $(`<div id="modal-${currentId}" class="modal"></div>`);
	const $modalMask = $(`<div id="modal-mask-${currentId}" class="modal-mask"></div>`)
	$app.append($modalMask)
	$modal.append(content)
	if (showClose) {
		const $closeBtn = $(`<div class="close-btn">✕</div>`);
		$closeBtn.click(() => {
			$modal.remove();
			$modalMask.remove();
		})
		$modal.append($closeBtn);
	}
	if (onConfirm !== undefined) {
		const $confirmBtn = $(`<div class="confirm-btn">确认</div>`);
		$modal.append($confirmBtn);
		$confirmBtn.click(() => {
			onConfirm();
			$modal.remove();
			$modalMask.remove();
		})
	}
	$app.append($modal);
	$modalMask.click(() => {
		$modal.remove();
		$modalMask.remove();
	})
}

// 公共函数 end

// DOM Ready（使用 jQuery 1.x 风格）
$(function () {
	showHome();
});
