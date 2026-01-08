// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { showModal } from '../components/modal';
import { getEmailCode, register as apiRegister, getUserInfo } from '../api';
import { hideLoginModal, showUserInfo } from './login';

// 刷新书架的回调（由 shelf 模块设置）
var refreshShelfCallback: (() => void) | null = null;

/**
 * 设置刷新书架回调
 * @param callback 回调函数
 */
export function setRegisterRefreshShelfCallback(callback: () => void): void {
	refreshShelfCallback = callback;
}

// 验证码倒计时
var emailCodeTimeCount = 0
var isWaitingEmailCode = false

/**
 * 验证码倒计时
 * @param dom 按钮的 jQuery 对象
 */
function emailCodeCountingDown(dom: JQuery<HTMLElement>): void {
	emailCodeTimeCount = 60
	var timeout = setInterval(function() {
		dom.text(emailCodeTimeCount-- + 's')
		if (emailCodeTimeCount <= 0) {
			clearInterval(timeout)
			dom.text('获取验证码')
		}
	}, 1000)
}

/**
 * 隐藏注册模态框
 */
export function hideRegisterModal(): void {
	var $registerModal = $('.register-modal')
	$registerModal.remove()
}

/**
 * 弹出注册窗口
 */
export function showRegisterModal(): void {
	var $content = $('<div id="register-modal-content"></div>')
	var $emailInput = $('<input class="ink-input" type="text" placeholder="邮箱">')
	var $usernameInput = $('<input class="ink-input" type="text" placeholder="用户名">')
	var $code = $('<input class="ink-input left" type="text" placeholder="验证码">')
	var $passwordInput = $('<input class="ink-input" type="password" placeholder="密码">')
	var $passwordRepeatInput = $('<input class="ink-input" type="password" placeholder="确认密码">')
	var $registerBtn = $('<button class="ink-button">注册</button>')
	var $emailCodeBtn = $('<button class="ink-button right">获取验证码</button>')
	var $emailCodeRow = $('<div class="ink-form-row"></div>')
	var $modalTitle = $('<div class="modal-title">请输入注册信息</div>')

	$content.append($modalTitle)
	$content.append($emailInput)
	$content.append($emailCodeRow)
	$emailCodeRow.append($code)
	$emailCodeRow.append($emailCodeBtn)
	$content.append($usernameInput)
	$content.append($passwordInput)
	$content.append($passwordRepeatInput)
	$content.append($registerBtn)

	$emailCodeBtn.click(function() {
		if (emailCodeTimeCount === 0 && !isWaitingEmailCode) {
			var email = $emailInput.val()
			if (typeof email === 'string') {
				isWaitingEmailCode = true
				getEmailCode(email, 'register', function() {
					emailCodeCountingDown($emailCodeBtn)
					isWaitingEmailCode = false
				}, function() {
					isWaitingEmailCode = false
				})
			}
		}
	})

	var confirm = function() {
		var email = $emailInput.val()
		var password = $passwordInput.val()
		var passwordRepeat = $passwordRepeatInput.val()
		var username = $usernameInput.val()
		var emailCode = $code.val()

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
		apiRegister(email, password, username, emailCode, function() {
			hideLoginModal()
			hideRegisterModal()
			if (refreshShelfCallback) {
				refreshShelfCallback()
			}
			getUserInfo(function(userInfo) {
				showUserInfo(userInfo)
			})
		})
	}

	$registerBtn.click(function() {
		confirm()
	})

	showModal($content, { showClose: true, className: 'register-modal', onEnter: confirm })
}

