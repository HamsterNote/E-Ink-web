# E-Ink Web （HTML4 + CSS2.1 + ES5）

本项目采用 Webpack + TypeScript + jQuery，遵循以下约束：
- HTML4.01 Transitional（避免 HTML5 标签/属性，包括 `type="module"` 等）
- CSS2.1（避免 CSS3 特性）
- ES5 及以下（源码仅使用 ES5 语法，最终产物通过 Babel/webpack 保证）

并针对较低版本的 WebKit 做了兼容配置（见 `babel.config.json` 的 targets）。

## 目录结构

```
public/
  index.html   # HTML4.01 Transitional
  styles.css   # CSS 2.1
src/
  index.ts     # TypeScript 源码（仅 ES5 语法）
webpack.config.js
babel.config.json
tsconfig.json
package.json
```

## 使用

1) 安装依赖
```
npm install
```

2) 本地开发（提供静态服务，入口为 public/index.html；devServer 关闭 HMR）
```
npm run dev
```
开发时访问：
```
http://localhost:5973/
```

3) 生产构建
```
npm run build
```
构建结果位于 `dist/`，包含 `index.html`、`styles.css` 与 `bundle.js`（ES5）。

## 兼容性说明

- jQuery 使用 1.12.4，以便兼容较老的 WebKit。
- TypeScript 编译目标 ES5（`tsconfig.json`），Babel 进一步降级至指定目标。
- Webpack 输出 `target: ['web','es5']`，并在 `output.environment` 禁用箭头函数等 ES6 特性。
- HTML 入口不使用任何 HTML5 标签/属性；脚本以常规 `<script type="text/javascript" src="bundle.js"></script>` 引入。

## 代码风格约束

- 源码避免 `let/const`、箭头函数、class、for..of、模板字符串等 ES6+ 语法。
- 仅使用 jQuery 1.x 事件与 DOM API。
- 样式仅使用 CSS2.1 选择器与属性，避免媒体查询、动画、shadow、border-radius 等 CSS3 特性。

## 常见问题

1. 为什么不用 `<script type="module">`？
   - 为了遵循 HTML4 规范并兼容较旧浏览器。

2. 如何确认打包产物是 ES5？
   - 生产构建后检查 `dist/bundle.js`，不应包含 `=>`、`class`、`const` 等标识；Webpack 配置与 Babel 会确保降级。
