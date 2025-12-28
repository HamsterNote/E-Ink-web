# AGENTS.md - E-Ink Web Reader Project Guide

## 项目概述

这是一个专为 Kindle 等电子墨水屏设备和低性能设备设计的 Web 阅读器应用。核心目标是提供流畅的阅读体验，同时严格限制在旧版 Web 标准范围内。

## 核心技术约束（必须严格遵守）

### 1. HTML 标准
- **仅使用 HTML 4.01 Transitional**
- **禁止使用任何 HTML5 标签和属性**，包括但不限于：
  - `<header>`, `<footer>`, `<nav>`, `<article>`, `<section>` 等语义化标签
  - `type="module"` 等现代 script 属性
  - `<video>`, `<audio>`, `<canvas>` 等多媒体标签
  - 自定义 data 属性（data-*）应尽量避免

### 2. CSS 标准
- **仅使用 CSS 2.1 规范**
- **禁止使用任何 CSS3 特性**，包括：
  - `border-radius`, `box-shadow`, `text-shadow` 等视觉特效
  - CSS3 动画（`@keyframes`, `transition`, `transform`）
  - 媒体查询（`@media`）
  - Flexbox 和 Grid 布局
  - 伪元素选择器（`::before`, `::after`）可用，但有限制
- 使用浮动（float）和定位（position）进行布局
- 单位使用：px, mm, cm, %（避免使用 rem, em, vw, vh）

### 3. JavaScript 标准
- **仅使用 ES5 语法**
- **禁止使用任何 ES6+ 特性**，包括：
  - `let`, `const`（必须使用 `var`）
  - 箭头函数（`=>`）
  - `class` 语法（使用构造函数和原型）
  - 模板字符串（使用字符串拼接）
  - 解构赋值
  - `for...of`, `for...in`（使用传统 `for` 循环或 `Array.forEach`）
  - Promise（使用回调函数，除非必需 Promise）
  - async/await（使用回调函数链）
- jQuery 版本：1.12.4（使用 1.x 风格 API）

### 4. TypeScript 配置
- 源码使用 TypeScript 进行类型检查
- 编译目标：ES5
- 避免使用 `any` 类型，应明确定义类型
- 类型定义文件：[src/types.ts](src/types.ts)

## 项目结构

```
public/
  index.html          # HTML4.01 Transitional 入口文件
  styles.css          # CSS 2.1 样式文件
src/
  index.ts            # 主要业务逻辑（ES5 语法 + TypeScript 类型）
  types.ts            # TypeScript 类型定义
dist/                 # 构建输出目录
  bundle.js           # 编译后的 ES5 代码
  index.html
  styles.css
```

## 构建工具链

- **Webpack 5**: 模块打包
- **Babel**: 将 ES6+ 降级到 ES5（虽然源码已经使用 ES5）
- **TypeScript**: 类型检查
- **jQuery 1.12.4**: DOM 操作和事件处理

## 关键设计原则

### 1. 性能优先
- 电子墨水屏刷新率低，需要减少 DOM 操作
- 实现操作计数器（`operationCnt`），定期刷屏以避免残影
- 虚拟滚动：按需加载内容，避免一次性渲染大量元素

### 2. 兼容性优先
- 支持旧版 WebKit 内核
- 所有样式必须兼容 IE6+ 级别的浏览器
- 避免使用现代浏览器特有 API

### 3. 可访问性
- 高对比度设计（黑白为主）
- 大字体、大按钮（电子墨水屏触控不敏感）
- 明确的视觉反馈（避免依赖动画）

## 当前实现的功能模块

### 1. 书架（Shelf）
- 文件网格展示（每行 3 个）
- 目录导航
- 文件上传（支持拖拽）
- 多选模式（批量操作）

### 2. 用户认证
- 登录/注册
- 找回密码
- 邮箱验证码
- JWT 认证（存储在 localStorage 和 Cookie）

### 3. 自定义组件
- 模态框（Modal）
- 菜单（Menu）
- 滚动区域（Scroll Area，自定义滚动条）
- 表单输入（Ink Input, Ink Button）

### 4. 屏幕适配
- 自动检测屏幕 DPC（Dots Per Centimeter）
- 响应式布局（通过 CSS，非媒体查询）
- 手动刷屏功能

## API 接口规范

所有 AJAX 请求：
- 自动携带 JWT Token（通过 `$.ajaxSetup` 全局配置）
- 401 状态码自动弹出登录框
- 基础路径：`/api/v1/`

主要接口：
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register-email` - 邮箱注册
- `POST /api/v1/auth/reset-password` - 重置密码
- `POST /api/v1/auth/send-email-code` - 发送邮箱验证码
- `GET /api/v1/users/me` - 获取当前用户信息
- `GET /api/v1/files` - 获取文件列表
- `POST /api/v1/files/init` - 初始化文件上传
- `PUT /api/v1/files/{uuid}` - 上传文件内容

## 开发指南

### 修改现有代码时
1. **保持 ES5 语法**：即使你看到有些代码使用了 `let` 或 `const`，新代码也应使用 `var`
2. **避免现代 JavaScript 特性**：使用 jQuery 1.x 风格的 API
3. **保持 CSS 2.1**：不使用任何 CSS3 新特性
4. **类型安全**：利用 TypeScript 类型定义，避免 `any`

### 添加新功能时
1. **优先级**：性能 > 兼容性 > 代码美观
2. **测试目标**：在旧版 WebKit 和电子墨水屏设备上测试
3. **样式选择**：优先使用 float 和 position 布局
4. **事件处理**：使用 jQuery 的事件绑定（`.on()`, `.click()` 等）

### 常见陷阱
- ❌ 使用箭头函数：`setTimeout(() => {}, 1000)`
- ✅ 应使用：`setTimeout(function() {}, 1000)`

- ❌ 使用模板字符串：`` `Hello ${name}` ``
- ✅ 应使用：`'Hello ' + name`

- ❌ 使用 Promise：`fetch().then().then()`
- ✅ 应使用：`$.ajax().done()`

- ❌ 使用 Flexbox：`display: flex`
- ✅ 应使用：`float: left` + clearfix

## 特殊考虑

### 电子墨水屏特性
- **刷新慢**：避免频繁 DOM 更新
- **残影问题**：需要定期全屏刷新（黑色闪烁）
- **对比度低**：使用纯黑白，避免灰度细节
- **触控不敏感**：按钮和可点击区域要足够大

### 低性能设备
- **减少重排/重绘**：批量 DOM 操作
- **避免大文件**：图片和脚本需要压缩
- **内存限制**：及时清理不用的 DOM 引用

## 代码风格

- 缩进：Tab
- 分号：必须使用
- 命名：驼峰式（camelCase）
- 注释：使用 `//` 单行注释，避免 `/* */` 块注释（兼容性）

## 调试建议

1. **使用旧版浏览器测试**：IE6-11, Firefox 3.6+, Safari 5+
2. **关闭 JavaScript**：确保基本功能可降级
3. **模拟低性能设备**：Chrome DevTools CPU throttling
4. **验证输出**：检查 `dist/bundle.js` 确保是 ES5

## 相关文件

- [README.md](README.md) - 项目基本说明
- [package.json](package.json) - 依赖和脚本
- [webpack.config.js](webpack.config.js) - Webpack 配置
- [babel.config.json](babel.config.json) - Babel 配置
- [tsconfig.json](tsconfig.json) - TypeScript 配置

## 贡献指南

在提交 PR 前，请确保：
1. ✅ 所有代码符合 ES5 标准
2. ✅ 所有样式符合 CSS 2.1 标准
3. ✅ 通过 TypeScript 类型检查（`npm run type-check`）
4. ✅ 构建成功（`npm run build`）
5. ✅ 在旧版浏览器中测试通过
6. ✅ 没有使用 `any` 类型（除非绝对必要）

---

**重要提示**：这个项目的核心价值在于兼容性。任何破坏兼容性的"优化"都是不可接受的。当您不确定某个特性是否可用时，请查阅 MDN Web Docs 并查看浏览器兼容性表格，确保至少支持 IE6+。
