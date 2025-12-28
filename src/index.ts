// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { initAjaxSetup, getUserInfo, setShowLoginModalCallback } from './api';
import { showLoginModal, showUserInfo, setRefreshShelfCallback } from './auth';
import { setRegisterRefreshShelfCallback } from './auth/register';
import { createShelf, refreshShelf } from './shelf';

// 清除所有内容
function clearContent(): void {
	var $app = $('#app');
	$app.html('');
	var $topBar = $('#top-bar');
	$topBar.html('');
	var $bottomBar = $('#bottom-bar');
	$bottomBar.html('');
	var $rightBar = $('#right-bar');
	$rightBar.html('');
	var $leftBar = $('#left-bar');
	$leftBar.html('');
}

// 显示主页
function showHome(): void {
	clearContent()
	var $app = $('#app');
	$app.append(createShelf());
}

// DOM Ready（使用 jQuery 1.x 风格）
$(function() {
	// 初始化 AJAX 设置
	initAjaxSetup();

	// 设置登录模态框回调
	setShowLoginModalCallback(showLoginModal);

	// 设置刷新书架回调（用于登录和注册后刷新）
	setRefreshShelfCallback(refreshShelf);
	setRegisterRefreshShelfCallback(refreshShelf);

	// 显示主页
	showHome();

	// 获取用户信息
	getUserInfo(function(userInfo) {
		showUserInfo(userInfo)
	})
});
