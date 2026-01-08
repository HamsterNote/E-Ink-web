// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

// 导出所有组件
export { showModal } from './modal';
export type { ModalOptions } from './modal';
export { showMenu } from './menu';
export { createScrollArea, activeScrollArea } from './scrollArea';

