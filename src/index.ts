// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { Book, UserInfo } from './types';

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
		rightBar.append(createScrollBar(windowHeight - globalDpcY, shelf.height() || 0, 0, globalDpcY))
	})
	return shelf
}

function refreshShelf() {
}

let shelfScrollTop = 0

function scrollDownShelf() {
	let shelf = $('#shelf')
	const shelfHeight = shelf.height() || 0
	shelfScrollTop = Math.max(windowHeight - shelfHeight - globalDpcY, shelfScrollTop - windowHeight * 3 / 4)
	shelf.css('marginTop', `${shelfScrollTop}px`)
	updateScrollBarPercent(shelfScrollTop, windowHeight - globalDpcY, shelf.height() || 0, 0, globalDpcY)
	operationCntPlus()
}

function scrollUpShelf() {
	let shelf = $('#shelf')
	shelfScrollTop = Math.min(0, shelfScrollTop + windowHeight * 3 / 4)
	shelf.css('marginTop', `${shelfScrollTop}px`)
	updateScrollBarPercent(shelfScrollTop, windowHeight - globalDpcY, shelf.height() || 0, 0, globalDpcY)
	operationCntPlus()
}

function createShelfBottomBar() {
	const blankButton2 = $(`<div class="bottom-bar-btn"></div>`)
	const userInfoButton = $(`<div id="user-info" class="bottom-bar-btn"></div>`)
	const refreshScreenButton = $(`<div id="shelf-refresh-screen" class="bottom-bar-btn">刷屏</div>`)
	const scrollDownButton = $(`<div id="shelf-scroll-down-bar" class="bottom-bar-btn">下翻</div>`)
	const scrollUpButton = $(`<div id="shelf-scroll-up-bar" class="bottom-bar-btn">上翻</div>`)
	let shelfBottomBar = $(`<div class="shelf-bottom-bar"></div>`)
	shelfBottomBar.append(userInfoButton)
	shelfBottomBar.append(blankButton2)
	shelfBottomBar.append(refreshScreenButton)
	shelfBottomBar.append(scrollUpButton)
	shelfBottomBar.append(scrollDownButton)
	scrollDownButton.click(scrollDownShelf)
	scrollUpButton.click(scrollUpShelf)
	refreshScreenButton.click(refreshScreen)
	userInfoButton.click(showUserInfoMenu)
	return shelfBottomBar;
}

// 点击用户名的菜单
function showUserInfoMenu() {
	const $bottomBar = $(`#bottom-bar`)
	const $menu = $(`<div class="menu user-info-menu"></div>`)
	const $logoutBtn = $(`<div class="menu-item">退出登录</div>`)
	$menu.append($logoutBtn)
	$logoutBtn.click(() => {
		localStorage.removeItem('jwt_token')
		location.reload()
	})
	$bottomBar.append($menu)
}

// 弹出登录窗口
function showLoginModal(showClose = true) {
	const $content = $(`<div id="login-modal-content"></div>`)
	const $emailInput = $(`<input class="ink-input" type="text" placeholder="邮箱">`)
	const $passwordInput = $(`<input class="ink-input" type="password" placeholder="密码">`)
	const $loginBtn = $(`<button class="ink-button">登录</button>`)
	const $registerBtn = $(`<button class="ink-button">没有账号？注册一个！</button>`)
	const $modalTitle = $(`<div class="modal-title">请输入登录信息</div>`)
	$content.append($modalTitle)
	$content.append($emailInput)
	$content.append($passwordInput)
	$content.append($loginBtn)
	$content.append($registerBtn)
	$registerBtn.click(showRegisterModal)
	$loginBtn.click(() => {
		const email = $emailInput.val()
		const password = $passwordInput.val()
		if (typeof email !== 'string' || !email.length) {
			alert('请输入正确的邮箱')
			return
		}
		if (typeof password !== 'string' || !password.length) {
			alert('请输入正确的密码')
			return
		}
		login(email, password, () => {
			getUserInfo((userInfo) => {
				showUserInfo(userInfo)
			})
		}, () => {})
	})
	showModal($content, { showClose, className: 'login-modal' })
}

function hideLoginModal() {
	const $loginModal = $('.login-modal')
	$loginModal.remove()
}

function showUserInfo(userInfo: UserInfo) {
	const $userInfo = $(`#user-info`)
	$userInfo.text(userInfo.username || '神秘用户')
}

let emailCodeTimeCount = 0
let isWaitingEmailCode = false

// 弹出注册窗口
function showRegisterModal() {
	const $content = $(`<div id="login-modal-content"></div>`)
	const $emailInput = $(`<input class="ink-input" type="text" placeholder="邮箱">`)
	const $usernameInput = $(`<input class="ink-input" type="text" placeholder="用户名">`)
	const $code = $(`<input class="ink-input left" type="text" placeholder="验证码">`)
	const $passwordInput = $(`<input class="ink-input" type="password" placeholder="密码">`)
	const $registerBtn = $(`<button class="ink-button">注册</button>`)
	const $emailCodeBtn = $(`<button class="ink-button right">获取验证码</button>`)
	const $emailCodeRow = $(`<div class="ink-form-row"></div>`)
	const $modalTitle = $(`<div class="modal-title">请输入注册信息</div>`)
	$content.append($modalTitle)
	$content.append($emailInput)
	$content.append($emailCodeRow)
	$emailCodeRow.append($code)
	$emailCodeRow.append($emailCodeBtn)
	$content.append($usernameInput)
	$content.append($passwordInput)
	$content.append($registerBtn)
	$emailCodeBtn.click(() => {
		if (emailCodeTimeCount === 0 && !isWaitingEmailCode) {
			const email = $emailInput.val()
			if (typeof email === 'string') {
				isWaitingEmailCode = true
				getEmailCode(email, () => {
					emailCodeCountingDown($emailCodeBtn)
					isWaitingEmailCode = false
				}, () => {
					isWaitingEmailCode = false
				})
			}
		}
	})
	$registerBtn.click(() => {
		const email = $emailInput.val()
		const password = $passwordInput.val()
		const username = $usernameInput.val()
		const emailCode = $code.val()
		if (typeof email !== 'string' || !email.length) {
			alert('请输入正确的邮箱')
			return
		}
		if (typeof password !== 'string' || !password.length) {
			alert('请输入正确的密码')
			return
		}
		if (typeof username !== 'string' || !username.length) {
			alert('请输入正确的用户名')
			return
		}
		if (typeof emailCode !== 'string' || !emailCode.length) {
			alert('请输入正确的验证码')
			return
		}
		register(email, password, username, emailCode)
	})
	showModal($content, { showClose: true, className: 'register-modal' })
}

function hideRegisterModal() {
	const $registerModal = $('.register-modal')
	$registerModal.remove()
}

function emailCodeCountingDown(dom: JQuery<HTMLElement>) {
	emailCodeTimeCount = 60
	const timeout = setInterval(() => {
		dom.text(`${emailCodeTimeCount--}s`)
		if (emailCodeTimeCount <= 0) {
			clearInterval(timeout)
			dom.text('获取验证码')
		}
	}, 1000)
}

function register(email: string, password: string, username: string, emailCode: string, callback?: () => void, onError?: () => void) {
	$.ajax({
		url: '/api/v1/auth/register-email',
		type: 'POST',
		data: {
			email,
			password,
			username,
			emailCode,
		},
		success: function(response, status, xhr) {
			// 从响应头获取令牌（取决于后端设置）
			let token = response.access_token as string;
			// 或者从响应体获取：let token = response.token;

			if (token) {
				// 将令牌保存到 localStorage
				localStorage.setItem('jwt_token', token);
				hideLoginModal()
				hideRegisterModal()
				refreshShelf()
				getUserInfo((userInfo) => {
					showUserInfo(userInfo)
				})
				callback?.();
			}
		},
		error: function(xhr, status, error) {
			switch (xhr.status) {
				case 409: alert('邮箱已被注册'); break;
				default: alert('注册失败！请检查验证码');
			}
			onError?.();
		}
	})
}

function login(email: string, password: string, callback: () => void, onError: () => void) {
	$.ajax({
		url: '/api/v1/auth/login',
		type: 'POST',
		data: {
			email,
			password,
		},
		success: function(response, status, xhr) {
			// 从响应头获取令牌（取决于后端设置）
			let token = response.access_token as string;
			// 或者从响应体获取：let token = response.token;

			if (token) {
				// 将令牌保存到 localStorage
				localStorage.setItem('jwt_token', token);
				hideLoginModal()
				refreshShelf()
				callback();
			}
		},
		error: function(xhr, status, error) {
			alert('登录失败！请检查邮箱和密码');
			onError();
		}
	})
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
	onConfirm = undefined,
	className = ''
}: {
	showClose?: boolean;
	onConfirm?: () => void;
	className?: string;
} = {
	showClose: false,
	onConfirm: undefined,
	className: '',
}): void {
	const currentId = modalId++
	const $app = $('#app');
	const $modal = $(`<div id="modal-${currentId}" class="modal ${className}"></div>`);
	const $modalInnerMask = $(`<div id="modal-${currentId}-inner-mask" class="modal-inner-mask"></div>`);
	const $modalWrapper = $(`<div id="modal-${currentId}-wrapper" class="modal-wrapper"></div>`);
	const $modalMask = $(`<div id="modal-mask-${currentId}" class="modal-mask ${className}"></div>`)
	$app.append($modalMask)
	$modal.append($modalWrapper)
	$modal.append($modalInnerMask)
	$modalWrapper.append(content)
	if (showClose) {
		const $closeBtn = $(`<div class="close-btn">✕</div>`);
		$closeBtn.click(() => {
			$modal.remove();
			$modalMask.remove();
		})
		$modalWrapper.append($closeBtn);
	}
	if (onConfirm !== undefined) {
		const $confirmBtn = $(`<div class="confirm-btn">确认</div>`);
		$modalWrapper.append($confirmBtn);
		$confirmBtn.click(() => {
			onConfirm();
			$modal.remove();
			$modalMask.remove();
		})
	}
	$app.append($modal);
	if (showClose) {
		$modalMask.click(() => {
			$modal.remove();
			$modalMask.remove();
		})
		$modalInnerMask.click(() => {
			$modal.remove();
			$modalMask.remove();
		})
	}
}

// 公共函数 end

// 接口函数 start
// 配置所有AJAX请求自动携带JWT
$.ajaxSetup({
	beforeSend: function(xhr) {
		// 从 localStorage 中取出令牌
		let token = localStorage.getItem('jwt_token');
		if (token) {
			// 在请求头中携带令牌，通常格式为 "Bearer <token>"
			xhr.setRequestHeader('Authorization', 'Bearer ' + token);
		}
	},
	statusCode: {
		401: function() {
			showLoginModal(false);
		}
	}
});

function getUserInfo(callback: (userInfo: UserInfo) => void, onError?: () => void) {
	$.ajax({
		url: '/api/v1/users/me',
		type: 'GET',
		data: {},
		success: function(response: UserInfo, status, xhr) {
			if (xhr.status === 200) {
				callback(response);
			} else {
				onError?.();
			}
		},
		error: function(xhr, status, error) {
			onError?.();
			console.error('登录失败:', error);
		}
	})
}

function getEmailCode(email: string, callback: (res: any) => void, onError?: (error: any) => void) {
	$.ajax({
		type: 'POST', // 请求方法
		url: '/api/v1/auth/send-email-code', // 请求地址
		data: JSON.stringify({ email, purpose: 'register' }), // 发送数据，JSON.stringify 将对象转为JSON字符串
		contentType: 'application/json', // 发送数据的类型
		dataType: 'json', // 期望收到的服务器响应数据的类型（这里是JSON）
		timeout: 5000, // 设置超时时间（毫秒）
		success: function(response) {
			// 请求成功处理，因为设置了dataType为"json"，jQuery会自动将返回的JSON字符串解析成对象
			// $('#responseArea').html('服务器返回的消息: ' + response.message);
			callback(response);
		},
		error: function(xhr, status, error) {
			onError?.(error)
			// 请求失败处理
			if (status === 'timeout') {
				alert('请求超时！');
			} else {
				alert('错误：' + error);
			}
		}
	});
}
// 接口函数 end

// 屏幕相关 start
/**
 * 获取屏幕的大致DPC（每厘米像素数）
 * @returns {Array} [xDPC, yDPC] 分别表示X轴和Y轴方向的CmPI
 */
function getScreenDPC() {
	let dpc = [];
	// 创建一个临时div元素
	let div = document.createElement('div');
	// 设置其宽度为1英寸，并确保在视口外不可见
	div.style.cssText = 'width:1cm;height:1cm;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden;pointer-events:none;';
	// 将元素添加到DOM中
	document.body.appendChild(div);
	// 测量元素的实际像素宽度和高度，这大致就是DPI值
	dpc[0] = Math.round(div.offsetWidth);
	dpc[1] = Math.round(div.offsetHeight);
	// 测量完成后，从DOM中移除该元素
	div.parentNode?.removeChild(div);

	return dpc;
}

var globalDpc = getScreenDPC()
var globalDpcX = globalDpc[0];
var globalDpcY = globalDpc[1];
// 屏幕相关 end

// DOM Ready（使用 jQuery 1.x 风格）
$(function () {
	showHome();
	getUserInfo((userInfo) => {
		showUserInfo(userInfo)
	})
});
