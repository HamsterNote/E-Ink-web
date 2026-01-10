// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { showModal } from '../components/modal';
import { getEmailCode, resetPassword as apiResetPassword } from '../api';

// 验证码倒计时
var emailCodeTimeCount = 0
var isWaitingResetPasswordEmailCode = false

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
 * 隐藏重置密码模态框
 */
export function hideResetPasswordModal(): void {
	var $registerModal = $('.reset-password-modal')
	$registerModal.remove()
}

/**
 * 弹出重设密码窗口
 */
export function showResetPasswordModal(): void {
	var $content = $('<div id="reset-password-modal-content"></div>')
	var $emailInput = $('<input class="ink-input" type="text" placeholder="邮箱">')
	var $code = $('<input class="ink-input left" type="text" placeholder="验证码">')
	var $passwordInput = $('<input class="ink-input" type="password" placeholder="新密码">')
	var $passwordRepeatInput = $('<input class="ink-input" type="password" placeholder="确认密码">')
	var $resetPasswordBtn = $('<button class="ink-button">确认</button>')
	var $emailCodeBtn = $('<button class="ink-button right">获取验证码</button>')
	var $emailCodeRow = $('<div class="ink-form-row"></div>')
	var $modalTitle = $('<div class="modal-title">找回密码</div>')

	$content.append($modalTitle)
	$content.append($emailInput)
	$content.append($emailCodeRow)
	$emailCodeRow.append($code)
	$emailCodeRow.append($emailCodeBtn)
	$content.append($passwordInput)
	$content.append($passwordRepeatInput)
	$content.append($resetPasswordBtn)

	$emailCodeBtn.click(function() {
		if (emailCodeTimeCount === 0 && !isWaitingResetPasswordEmailCode) {
			var email = $emailInput.val()
			if (typeof email === 'string') {
				isWaitingResetPasswordEmailCode = true
				getEmailCode(email, 'reset', function() {
					emailCodeCountingDown($emailCodeBtn)
					isWaitingResetPasswordEmailCode = false
				}, function() {
					isWaitingResetPasswordEmailCode = false
				})
			}
		}
	})

	var confirm = function() {
		var email = $emailInput.val()
		var password = $passwordInput.val()
		var passwordRepeat = $passwordRepeatInput.val()
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
		if (typeof emailCode !== 'string' || !emailCode.length) {
			alert('请输入正确的验证码')
			return
		}
		if (passwordRepeat !== password) {
			alert('两次密码不一致')
			return
		}
		apiResetPassword(email, password, emailCode, function() {
			hideResetPasswordModal()
		})
	}

	$resetPasswordBtn.click(function() {
		confirm()
	})

	showModal($content, { showClose: true, className: 'reset-password-modal', onEnter: confirm })
}

