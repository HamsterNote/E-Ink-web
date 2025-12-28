// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

// 导出所有认证相关功能
export { showLoginModal, hideLoginModal, showUserInfo, logout, setRefreshShelfCallback } from './login';
export { showRegisterModal, hideRegisterModal, setRegisterRefreshShelfCallback } from './register';
export { showResetPasswordModal, hideResetPasswordModal } from './resetPassword';
