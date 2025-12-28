// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { BookFile, Directory, GetFileListResponse, UserInfo } from './types';

// 通用 start
// 使用 Base64 的 SVG 作为目录图标（线框文件夹）
const directoryIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgN2g1bDIgM2gxMXY5YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yeiIvPjxwYXRoIGQ9Ik0zIDdWNWEyIDIgMCAwIDEgMi0yaDRsMiAzaDZhMiAyIDAgMCAxIDIgMnYyIi8+PC9zdmc+'
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

// 每行文档数量
const bookPerRow = 3

// 文档的大概比例
const bookRatio = 1.5

// 每页最多多少个文档：innerHeight / (innerWidth / bookPerRow * bookRatio) * bookPerRow
const bookPerPage = Math.ceil(window.innerHeight / (window.innerWidth / bookPerRow * bookRatio) * bookPerRow)
// 通用 end

// Home start

// Book start
function createBook(book: BookFile, bookItem: JQuery<HTMLElement>) {
	const $bookItem = bookItem || $(`<div></div>`)
	$bookItem.attr('class', 'book')
	$bookItem.html('')
	const $cover = $(`<div class="book-cover"><img class="book-cover-image" src=""/></div>`);
	const $name = $(`<span class="book-name">${book.originalFilename}</span>`)
	$bookItem.append($cover);
	$bookItem.append($name);
	$bookItem.attr('page', book.page)
	$bookItem.attr('pageSize', book.pageSize)
	$bookItem.attr('uuid', book.uuid)
	if (!bookItem) {
		// 第一次创建才添加事件避免重复绑定
		$bookItem.click(() => {
			if (isMultiSelect) {
				$bookItem.toggleClass('active')
			}
		})
	}
	return $bookItem
}
// Book end

// Directory start
function createDirectory(directory: Directory) {
	let result = $(`<div class="book"><div class="book-cover"><img class="book-cover-image directory-icon" src="${directoryIcon}"/></div><span class="book-name">${directory.name}</span></div>`)
	result.contextmenu(() => {
		alert('a')
	})
	return result
}
// Directory end

// Shelf start
const loadedDirectory: Array<Directory | null | undefined> = []
const bookList: BookFile[] = []

const directoryList: Directory[] = []

let currentShelfDirectory: Directory | undefined = undefined

function getCurrentList() {
	const result: Array<BookFile | Directory> = [
		...bookList.filter((book) => book.parent === currentShelfDirectory),
		...directoryList.filter((directory) => directory.parent === currentShelfDirectory),
	].sort((a, b) => {
		if (a.order === undefined) {
			return 1;
		}
		if (b.order === undefined) {
			return -1;
		}
		return a.order - b.order
	})
	return result;
}

function isBook(bookOrDirectory: BookFile | Directory): bookOrDirectory is BookFile {
	return 'originalFilename' in bookOrDirectory;
}

function createShelf() {
	currentShelfDirectory = undefined
	let $shelf = $('<div id="shelf"></div>')
	$shelf.ready(() => {
		refreshShelf();
	})
	const bottomBar = $('#bottom-bar')
	bottomBar.append(createShelfBottomBar())
	return $shelf
}

async function loadBooks(parent: Directory | undefined, page: number, pageSize: number) {
	const res = await getFileList(parent, page, pageSize);
	const bookItemList = $('.book');
	const start = page * pageSize;
	const end = (page + 1) * pageSize - 1;
	bookItemList.each((i, item) => {
		console.log('start ', start, ' end ', end, ' i ', i);
		if (i >= start && i <= end) {
			const resItem = res.items[i - start];
			if (resItem) {
				console.log('loadBook ', resItem);
				createBook(resItem, $(item))
			}
		}
	})
}

async function refreshShelf() {
	const $shelf = $('#shelf')
	if (!$shelf.length) {
		return;
	}
	const indexOfLoaded = loadedDirectory.indexOf(currentShelfDirectory)
	console.log(indexOfLoaded);
	const pageSize = bookPerPage + bookPerRow;
	if (indexOfLoaded === -1) {
		const res = await getFileList(currentShelfDirectory, 0, pageSize);
		const total = res.total;
		bookList.push(...res.items)
		// 提前填满
		const rest: BookFile[] = [];
		for (let i = res.items.length; i < total; i++) {
			rest.push({
				uuid: '',
				originalFilename: '加载中...',
				createAt: '',
				color: '',
				tags: '',
				ext: '',
				size: 0,
				order: 0,
				parent: currentShelfDirectory,
				page: Math.floor(i / pageSize),
				pageSize
			})
		}
		bookList.push(...rest)
	}
	loadedDirectory.push(currentShelfDirectory)
	$shelf.html('')
	const $shelfContent = $(`<div class="shelf-content">`)
	const bookItemList: JQuery<HTMLElement>[] = []
	getCurrentList().forEach(bookOrDirectory => {
		if (isBook(bookOrDirectory)) {
			let bookItem = createBook(bookOrDirectory)
			$shelfContent.append(bookItem)
			bookItemList.push(bookItem)
		} else {
			let directoryItem = createDirectory(bookOrDirectory)
			$shelfContent.append(directoryItem)
			directoryItem.click(() => {
				currentShelfDirectory = bookOrDirectory;
				console.log(currentShelfDirectory)
				refreshShelf()
			})
		}
	})
	$shelfContent.append('<div class="clear-both"></div>')
	const $scrollArea = createScrollArea($shelfContent)
	$shelf.append($scrollArea)
	activeScrollArea($scrollArea, true, (scrollTop) => {
		// 目前来看所有的书都是顺序摆放的
		const pages: number[] = [];
		for (const book of bookItemList) {
			if (book.attr('uuid')) {
				continue;
			}
			const boundingRect = book[0]?.getBoundingClientRect()
			if (boundingRect && boundingRect.top + boundingRect.height > 0 && boundingRect.top < window.innerHeight) {
				// 出现在视口中
				const page = book.attr('page')
				if (page) {
					pages.push(parseInt(page))
				}
			}
		}
		if (pages.length) {
			const minPage = Math.min(...pages)
			const maxPage = Math.max(...pages)
			console.log(minPage, maxPage, pages);
			loadBooks(currentShelfDirectory, minPage, (maxPage - minPage + 1) * pageSize)
		}
	})
}

function createShelfBottomBar() {
	const settingsButton = createManageButton()
	const userInfoButton = $(`<div id="user-info" class="bottom-bar-btn wide left"></div>`)
	const blankButton = $(`<div class="bottom-bar-btn"></div>`)
	const refreshScreenButton = $(`<div id="shelf-refresh-screen" class="bottom-bar-btn">刷屏</div>`)
	let shelfBottomBar = $(`<div class="shelf-bottom-bar"></div>`)
	shelfBottomBar.append(userInfoButton)
	shelfBottomBar.append(blankButton)
	shelfBottomBar.append(settingsButton)
	shelfBottomBar.append(refreshScreenButton)
	refreshScreenButton.click(refreshScreen)
	userInfoButton.click(showUserInfoMenu)
	return shelfBottomBar;
}

function createManageButton() {
	const $settingsButton = $(`<div class="bottom-bar-btn">管理</div>`)
	$settingsButton.click(() => {
		const $upload = $(`<div class="menu-item">上传文档</div>`)
		const $newDir = $(`<div class="menu-item">新建文件夹</div>`)
		const $multiSelect = $(`<div class="menu-item">选择</div>`)
		const $refreshShelf = $(`<div class="menu-item">刷新书架</div>`)
		const $menuContent = [$upload, $newDir, $multiSelect, $refreshShelf]
		$multiSelect.click(() => {
			switchMultiSelect();
		})
		$upload.click(() => {
			showUploadModal();
		})
		showMenu($menuContent, 'settings-menu', 'bottom: 1cm; width: 20%; left: 60%;');
	})
	return $settingsButton
}

function showUploadModal() {
	const $content = $(`<div id="upload-modal-content"><div class="modal-title">上传文档</div></div>`)
	const $uploadButton = $(`<div class="upload-button"></div>`)
	const $uploadInput = $(`<input class="upload-input" type="file" />`)
	$uploadButton.append($uploadInput)
	$uploadInput.on('change', () => {
		const file: File | undefined = ($uploadInput[0] as HTMLInputElement).files?.[0]
		file && uploadFile(file, (percent) => {
			console.log(percent)
		}, () => {
			console.log('complete')
		}, () => {
			console.log('error');
		})
		console.log('文件选择', $uploadButton.val())
	})
	$content.append($uploadButton)
	const $fileName = $(`<input class="ink-input" placeholder="文件名（选填）" />`)
	$content.append($fileName)
	const $submitButton = $(`<button class="ink-button">上传</button>`)
	$content.append($submitButton)
	showModal($content, { showClose: true })
}

let isMultiSelect = false

// 多选
function switchMultiSelect() {
	isMultiSelect = !isMultiSelect
	switchMultiSelectMode()
}

function switchMultiSelectMode() {
	if (isMultiSelect) {
		$('#app').addClass('multi-select-mode');
		createMultiSelectBottomBar();
	} else {
		$('.multi-select-mode .book').removeClass('active');
		$('#app').removeClass('multi-select-mode');
		$('.multi-select-bottom-bar').remove();
	}
}

function getSelected() {
	return {
		books: $('.multi-select-mode .book.active')
	};
}

function createMultiSelectBottomBar() {
	const $bottomBar = $('#bottom-bar')
	const $multiSelectBottomBar = $(`<div class="shelf-bottom-bar multi-select-bottom-bar"></div>`)
	const $quitBtn = $('<div class="bottom-bar-btn quit-btn">退出多选</div>')
	const $cutBtn = $('<div class="bottom-bar-btn cut-btn">剪切</div>')
	const $pasteBtn = $('<div class="bottom-bar-btn paste-btn">粘贴</div>')
	const $deleteBtn = $('<div class="bottom-bar-btn paste-btn">删除</div>')
	$quitBtn.click(switchMultiSelect)
	$multiSelectBottomBar.append($quitBtn)
	$multiSelectBottomBar.append($deleteBtn)
	$deleteBtn.click(() => {
		deleteBookOrDirectory(getSelected());
	})
	$bottomBar.append($multiSelectBottomBar)
}

function deleteBookOrDirectory({ books }: { books: JQuery<HTMLElement> }) {
	const confirmDelete = confirm('真的要删除吗？')
	if (confirmDelete) {

	}
}

// 点击用户名的菜单
function showUserInfoMenu() {
	const $logoutBtn = $(`<div class="menu-item">退出登录</div>`)
	showMenu([$logoutBtn], 'user-info-menu', 'bottom: 1cm;left: 0;width: 20%;')
	$logoutBtn.click(() => {
		logout()
	})
}

// 弹出登录窗口
function showLoginModal(showClose = true) {
	const $content = $(`<div id="login-modal-content"></div>`)
	const $emailInput = $(`<input class="ink-input" type="text" placeholder="邮箱">`)
	const $passwordInput = $(`<input class="ink-input" type="password" placeholder="密码">`)
	const $loginBtn = $(`<button class="ink-button">登录</button>`)
	const $registerBtn = $(`<button class="ink-button">没有账号？注册一个！</button>`)
	const $resetPasswordBtn = $(`<button class="ink-button">忘记密码？</button>`)
	const $modalTitle = $(`<div class="modal-title">请输入登录信息</div>`)
	$content.append($modalTitle)
	$content.append($emailInput)
	$content.append($passwordInput)
	$content.append($loginBtn)
	$content.append($resetPasswordBtn)
	$content.append($registerBtn)
	$resetPasswordBtn.click(showResetPasswordModal)
	$registerBtn.click(showRegisterModal)
	const confirm = () => {
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
	}
	$loginBtn.click(() => {
		confirm()
	})
	showModal($content, { showClose, className: 'login-modal', onEnter: confirm })
}

function hideLoginModal() {
	const $loginModal = $('.login-modal')
	$loginModal.remove()
}

function showUserInfo(userInfo: UserInfo) {
	const $userInfo = $(`#user-info`)
	$userInfo.text(`用户名：${userInfo.username || '神秘用户'}`)
}

let emailCodeTimeCount = 0
let isWaitingEmailCode = false

// 弹出注册窗口
function showRegisterModal() {
	const $content = $(`<div id="register-modal-content"></div>`)
	const $emailInput = $(`<input class="ink-input" type="text" placeholder="邮箱">`)
	const $usernameInput = $(`<input class="ink-input" type="text" placeholder="用户名">`)
	const $code = $(`<input class="ink-input left" type="text" placeholder="验证码">`)
	const $passwordInput = $(`<input class="ink-input" type="password" placeholder="密码">`)
	const $passwordRepeatInput = $(`<input class="ink-input" type="password" placeholder="确认密码">`)
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
	$content.append($passwordRepeatInput)
	$content.append($registerBtn)
	$emailCodeBtn.click(() => {
		if (emailCodeTimeCount === 0 && !isWaitingEmailCode) {
			const email = $emailInput.val()
			if (typeof email === 'string') {
				isWaitingEmailCode = true
				getEmailCode(email, 'register', () => {
					emailCodeCountingDown($emailCodeBtn)
					isWaitingEmailCode = false
				}, () => {
					isWaitingEmailCode = false
				})
			}
		}
	})
	const confirm = () => {
		const email = $emailInput.val()
		const password = $passwordInput.val()
		const passwordRepeat = $passwordRepeatInput.val()
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
		if (typeof passwordRepeat !== 'string' || !passwordRepeat.length) {
			alert('请输入正确的确认密码')
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
		if (passwordRepeat !== password) {
			alert('两次密码不一致')
			return
		}
		register(email, password, username, emailCode)
	}
	$registerBtn.click(() => {
		confirm()
	})
	showModal($content, { showClose: true, className: 'register-modal', onEnter: confirm })
}

function hideRegisterModal() {
	const $registerModal = $('.register-modal')
	$registerModal.remove()
}

let isWaitingResetPasswordEmailCode = false

// 弹出重设密码窗口
function showResetPasswordModal() {
	const $content = $(`<div id="reset-password-modal-content"></div>`)
	const $emailInput = $(`<input class="ink-input" type="text" placeholder="邮箱">`)
	const $code = $(`<input class="ink-input left" type="text" placeholder="验证码">`)
	const $passwordInput = $(`<input class="ink-input" type="password" placeholder="新密码">`)
	const $passwordRepeatInput = $(`<input class="ink-input" type="password" placeholder="确认密码">`)
	const $resetPasswordBtn = $(`<button class="ink-button">确认</button>`)
	const $emailCodeBtn = $(`<button class="ink-button right">获取验证码</button>`)
	const $emailCodeRow = $(`<div class="ink-form-row"></div>`)
	const $modalTitle = $(`<div class="modal-title">找回密码</div>`)
	$content.append($modalTitle)
	$content.append($emailInput)
	$content.append($emailCodeRow)
	$emailCodeRow.append($code)
	$emailCodeRow.append($emailCodeBtn)
	$content.append($passwordInput)
	$content.append($passwordRepeatInput)
	$content.append($resetPasswordBtn)
	$emailCodeBtn.click(() => {
		if (emailCodeTimeCount === 0 && !isWaitingResetPasswordEmailCode) {
			const email = $emailInput.val()
			if (typeof email === 'string') {
				isWaitingResetPasswordEmailCode = true
				getEmailCode(email, 'reset', () => {
					emailCodeCountingDown($emailCodeBtn)
					isWaitingResetPasswordEmailCode = false
				}, () => {
					isWaitingResetPasswordEmailCode = false
				})
			}
		}
	})
	const confirm = () => {
		const email = $emailInput.val()
		const password = $passwordInput.val()
		const passwordRepeat = $passwordRepeatInput.val()
		const emailCode = $code.val()
		if (typeof email !== 'string' || !email.length) {
			alert('请输入正确的邮箱')
			return
		}
		if (typeof password !== 'string' || !password.length) {
			alert('请输入正确的密码')
			return
		}
		if (typeof passwordRepeat !== 'string' || !passwordRepeat.length) {
			alert('请输入正确的确认密码')
			return
		}
		if (typeof emailCode !== 'string' || !emailCode.length) {
			alert('请输入正确的验证码')
			return
		}
		if (passwordRepeat !== password) {
			alert('两次密码不一致')
			return
		}
		resetPassword(email, password, emailCode)
	}
	$resetPasswordBtn.click(() => {
		confirm()
	})
	showModal($content, { showClose: true, className: 'reset-password-modal', onEnter: confirm })
}

function hideResetPasswordModal() {
	const $registerModal = $('.reset-password-modal')
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
				document.cookie = 'jwt_token=' + token;
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

function resetPassword(email: string, newPassword: string, code: string, callback?: () => void, onError?: () => void) {
	$.ajax({
		url: '/api/v1/auth/reset-password',
		type: 'POST',
		data: {
			email,
			newPassword,
			code,
		},
		success: function(response, status, xhr) {
			if (xhr.status === 201 && response.ok) {
				alert('密码重置成功！请登录');
				hideResetPasswordModal()
			}
		},
		error: function(xhr, status, error) {
			switch (xhr.status) {
				default: alert('密码重置失败！请检查验证码');
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
				document.cookie = 'jwt_token=' + token;
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

function logout() {
	localStorage.removeItem('jwt_token')
	removeCookie('jwt_token')
	location.reload()
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
	onEnter,
	className = ''
}: {
	showClose?: boolean;
	onConfirm?: () => void;
	onEnter?: () => void;
	className?: string;
} = {
	showClose: false,
	onConfirm: undefined,
	onEnter: undefined,
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
	$modal.keydown((evt) => {
		if (evt.key === 'Enter') {
			onEnter?.()
		}
	})
}

function activeScrollArea($scrollArea: JQuery<HTMLElement>, forceDisplayScrollBar = false, onScroll?: (scrollTop: number) => void) {
	$scrollArea.ready(() => {
		const $scrollBarWrapper = $(`<div class="scroll-bar-wrapper"></div>`);
		const $content = $scrollArea.find('> :first-child')
		if (!$content.length) {
			return;
		}
		const $scrollBar = $(`<div class="scroll-bar"></div>`);
		const $scrollDownButton = $(`<div class="scroll-button scroll-down-button"></div>`);
		const $scrollUpButton = $(`<div class="scroll-button scroll-up-button"></div>`);
		let totalAreaHeight = $scrollArea.height() || 0;
		let contentHeight = $content.height() || 0;
		if (!forceDisplayScrollBar && totalAreaHeight >= contentHeight) {
			$scrollArea.addClass('no-scroll')
		}
		console.log(totalAreaHeight / contentHeight, totalAreaHeight, contentHeight)
		const $scrollBarItem = $(`<div class="scroll-bar-item" style="top: 0; height: ${Math.min(totalAreaHeight / contentHeight * 100, 100)}%;"></div>`);
		$scrollBar.append($scrollUpButton)
		$scrollBar.append($scrollDownButton)
		$scrollBarWrapper.append($scrollBar);
		$scrollBar.append($scrollBarItem);
		$scrollArea.append($scrollBarWrapper);
		let marginTop = 0;
		$scrollDownButton.click(() => {
			marginTop -= totalAreaHeight - 80;
			marginTop = Math.max(totalAreaHeight - contentHeight, marginTop)
			$content.css('margin-top', `${marginTop}px`)
			$scrollBarItem.css('top', `${-marginTop / contentHeight * 100}%`)
			onScroll?.(marginTop)
		})
		$scrollUpButton.click(() => {
			marginTop += totalAreaHeight - 80;
			marginTop = Math.min(0, marginTop)
			$content.css('margin-top', `${marginTop}px`)
			$scrollBarItem.css('top', `${-marginTop / contentHeight * 100}%`)
			onScroll?.(marginTop)
		})
	})
}

function createScrollArea($content: JQuery<HTMLElement>) {
	const $scrollArea = $(`<div class="scroll-area"></div>`)
	$content.appendTo($scrollArea)
	return $scrollArea
}

function showMenu($content: JQuery<HTMLElement>[], className: string = '', style: string = '') {
	const $app = $(`#app`)
	const $menu = $(`<div class="menu ${className}" style="${style}"></div>`)
	const $menuMask = $(`<div class="menu-mask ${className}"></div>`)
	$app.append($menuMask)
	$menu.append($content)
	$menu.click(() => {
		$menu.remove()
		$menuMask.remove()
	})
	$menuMask.click(() => {
		$menu.remove()
		$menuMask.remove()
	})
	$app.append($menu)
}

function getCookie(name: string): string | null {
	const cookies = document.cookie.split(';');
	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();
		if (cookie.indexOf(name + '=') === 0) {
			return cookie.substring(name.length + 1);
		}
	}
	return null;
}

function removeCookie(name: string): void {
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// 公共函数 end

// 接口函数 start
// 配置所有AJAX请求自动携带JWT
$.ajaxSetup({
	beforeSend: function(xhr) {
		// 从 localStorage 中取出令牌
		let token = localStorage.getItem('jwt_token') || (getCookie('jwt_token') || '');
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

function getEmailCode(email: string, purpose: string, callback: (res: any) => void, onError?: (error: any) => void) {
	$.ajax({
		type: 'POST', // 请求方法
		url: '/api/v1/auth/send-email-code', // 请求地址
		data: JSON.stringify({ email, purpose }), // 发送数据，JSON.stringify 将对象转为JSON字符串
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

function uploadFile(file: File, onProgress: (progress: number) => void, onComplete: (res: any) => void, onError?: (error: any) => void) {
	// 1) 初始化上传，获取 uuid
	$.ajax({
		type: 'POST',
		url: '/api/v1/files/init',
		data: JSON.stringify({
			originalFilename: file.name,
			size: file.size
		}),
		contentType: 'application/json',
		dataType: 'json',
		success: function(initRes: any) {
			try {
				var uuid = initRes && (initRes.uuid || initRes.id || initRes.data || initRes.result && initRes.result.uuid);
				if (!uuid) {
					onError && onError({ message: 'init upload missing uuid', initRes: initRes });
					return;
				}
				// 2) 通过 PUT 将文件二进制流直传到服务端，同时监听进度
				var xhr = new XMLHttpRequest();
				xhr.open('PUT', '/api/v1/files/' + encodeURIComponent(uuid), true);
				// 携带认证头（与全局 jQuery 设置保持一致，这里是原生 XHR 需手动设置）
				try {
					var token = localStorage.getItem('jwt_token') || (getCookie('jwt_token') || '');
					if (token) {
						xhr.setRequestHeader('Authorization', 'Bearer ' + token);
					}
				} catch (e) {
					// ignore
				}
				// 设定内容类型（若无类型则使用通用二进制）
				var contentType = (file as any).type || 'application/octet-stream';
				xhr.setRequestHeader('Content-Type', contentType);
				// 进度回调
				if (xhr.upload && typeof onProgress === 'function') {
					xhr.upload.onprogress = function(evt: ProgressEvent) {
						if (evt && evt.lengthComputable) {
							var percent = Math.floor((evt.loaded / evt.total) * 100);
							onProgress(percent);
						}
					};
				}
				xhr.onerror = function() {
					onError && onError({ message: 'upload network error' });
				};
				xhr.onabort = function() {
					onError && onError({ message: 'upload aborted' });
				};
				xhr.onload = function() {
					// 完成时尝试解析响应
					var status = xhr.status;
					if (status >= 200 && status < 300) {
						var text = xhr.responseText;
						var res: any = null;
						try {
							res = text ? JSON.parse(text) : null;
						} catch (e) {
							// 非 JSON 响应
							res = { ok: true, uuid: uuid };
						}
						if (!res) {
							// 若无响应体，尝试查询一次状态
							$.ajax({
								type: 'GET',
								url: '/api/v1/files/' + encodeURIComponent(uuid) + '/status',
								dataType: 'json',
								success: function(statusRes: any) {
									onComplete(statusRes || { ok: true, uuid: uuid });
								},
								error: function() {
									onComplete({ ok: true, uuid: uuid });
								}
							});
						} else {
							onComplete(res || { ok: true, uuid: uuid });
						}
					} else {
						onError && onError({ message: 'upload failed', status: status, body: xhr.responseText });
					}
				};
				// 发送文件本体
				xhr.send(file);
			} catch (err) {
				onError && onError(err);
			}
		},
		error: function(xhr, status, error) {
			onError && onError(error || { message: 'init upload error', status: status });
		}
	});
}

async function getFileList(parent: Directory | undefined, page: number, pageSize: number) {
	return new Promise<GetFileListResponse>((resolve, reject) => {
		$.ajax({
			type: 'GET',
			url: `/api/v1/files?${parent ? `parentUuid=${parent.uuid}&` : ''}page=${page + 1}&pageSize=${pageSize}`,
			dataType: 'json',
			success: function(response) {
				resolve({
					...response,
					items: response.items.map((item: Omit<BookFile, 'pageSize' | 'page'>) => ({
						...item,
						page,
						pageSize,
						parent,
					}))
				});
			},
			error: function(xhr, status, error) {
				reject(error);
			}
		})
	})
}

function getDirectoryList() {}

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
