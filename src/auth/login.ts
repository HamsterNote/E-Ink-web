// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { UserInfo } from '../types';
import { showModal } from '../components/modal';
import { login as apiLogin, getUserInfo } from '../api';
import { removeCookie } from '../utils';
import { showRegisterModal } from './register';
import { showResetPasswordModal } from './resetPassword';

// 刷新书架的回调（由 shelf 模块设置）
var refreshShelfCallback: (() => void) | null = null;

/**
 * 设置刷新书架回调
 * @param callback 回调函数
 */
export function setRefreshShelfCallback(callback: () => void): void {
	refreshShelfCallback = callback;
}

/**
 * 显示用户信息
 * @param userInfo 用户信息对象
 */
export function showUserInfo(userInfo: UserInfo): void {
	var $userInfo = $('#user-info')
	$userInfo.text('用户名：' + (userInfo.username || '神秘用户'))
}

/**
 * 隐藏登录模态框
 */
export function hideLoginModal(): void {
	var $loginModal = $('.login-modal')
	$loginModal.remove()
}

/**
 * 弹出登录窗口
 * @param showClose 是否显示关闭按钮
 */
export function showLoginModal(showClose?: boolean): void {
	var showCloseBtn = showClose !== undefined ? showClose : true;

	var $content = $('<div id="login-modal-content"></div>')
	var $emailInput = $('<input class="ink-input" type="text" placeholder="邮箱">')
	var $passwordInput = $('<input class="ink-input" type="password" placeholder="密码">')
	var $loginBtn = $('<button class="ink-button">登录</button>')
	var $registerBtn = $('<button class="ink-button">没有账号？注册一个！</button>')
	var $resetPasswordBtn = $('<button class="ink-button">忘记密码？</button>')
	var $modalTitle = $('<div class="modal-title">请输入登录信息</div>')

	$content.append($modalTitle)
	$content.append($emailInput)
	$content.append($passwordInput)
	$content.append($loginBtn)
	$content.append($resetPasswordBtn)
	$content.append($registerBtn)

	$resetPasswordBtn.click(showResetPasswordModal)
	$registerBtn.click(showRegisterModal)

	var confirm = function() {
		var email = $emailInput.val()
		var password = $passwordInput.val()
		if (typeof email !== 'string' || !email.length) {
			alert('请输入正确的邮箱')
			return
		}
		if (typeof password !== 'string' || !password.length) {
			alert('请输入正确的密码')
			return
		}
		apiLogin(email, password, function() {
			hideLoginModal()
			if (refreshShelfCallback) {
				refreshShelfCallback()
			}
			getUserInfo(function(userInfo) {
				showUserInfo(userInfo)
			})
		}, function() {})
	}

	$loginBtn.click(function() {
		confirm()
	})

	showModal($content, { showClose: showCloseBtn, className: 'login-modal', onEnter: confirm })
}

/**
 * 退出登录
 */
export function logout(): void {
	localStorage.removeItem('jwt_token')
	removeCookie('jwt_token')
	location.reload()
}

