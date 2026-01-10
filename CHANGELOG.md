# 更新日志

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [UnReleased]

### 修复
- **Major**: 修复目录交互问题，添加键盘导航支持（tabindex 和 Enter/Space 键事件）
- **Major**: 添加 `.toc-item:focus` 规则为触控/键盘用户提供视觉反馈（符合 CSS2.1 规范）
- **Major**: 修复章节索引递增时机错误，将 chapterIndex 递增移到页面推入数组之前
- **Major**: 移除 `pages.length > 1` 条件，确保第一页的 h1 标签被正确计数
- **Critical**: 修复 `progress.ts` 中 `totalPages=1` 时除零错误
- **Major**: 移除 CSS3 `transform`，使用 CSS2.1 替代方案（进度条滑块）
- **Major**: 修复 `api.ts` 中 `removeBookmark` 函数实际不删除书签的问题
- **Major**: 修复 `api.ts` 中 `saveReadingProgress` 未使用参数的问题
- **Major**: 修复 `index.ts` 中使用 `updateState` 替代直接状态修改，确保触发观察者通知
- **Major**: 修复 `progress.ts` 中进度条点击可能产生越界页码的问题
- **Major**: 修复 `renderer.ts` 中章节索引检测逻辑错误
- **Major**: 修复 `renderer.ts` 中测量容器宽度应匹配真实内容区域
- **Major**: 修复 `state.ts` 中初始化时加载已保存的书签
- **Major**: 修复 `toolbar.ts` 中章节导航使用硬编码页码估算的问题
- **Major**: 修复 `toolbar.ts` 中字体/行高变化时保持阅读位置
- **Major**: 修复 `reader/index.ts` 中内存泄漏（保存进度订阅者并在退出时取消订阅）
- **Major**: 修复 `reader/renderer.ts` 中 HTML 标签切割问题（添加 findNearestTagBoundary）
- **Major**: 修复 `reader/renderer.ts` 中 findBestBreakPoint 使用错误的测量范围（添加 startIndex 参数）
- **Major**: 修复 `reader/renderer.ts` 中页面缓存失效问题（缓存包含 fontSize 和 lineHeight）
- **Major**: 修复 `reader/state.ts` 中 currentPage 可能超出 totalPages 的问题
- **Major**: 修复 `reader/state.ts` 中设置 falsy 值检查（使用 typeof 替代 ||）
- **Major**: 修复 `reader/state.ts` 中书签数组直接变更问题（使用不可变方式更新）
- **Minor**: 为 `.toc-item` 添加 `:active` 状态（电子墨水屏不支持 hover）
- **Nitpick**: 扩展 Window 接口以获得类型安全
- **Nitpick**: 在 `showHome` 不可用时添加错误日志
- **Nitpick**: 验证加载的阅读设置结构，提供默认值
- **Nitpick**: 为 `getBookContent` 添加超时保护（10秒）

## [0.2.0] - 2025-12-28

### 新增
- **阅读器功能** - 完整的 Kindle 风格电子书阅读器
  - 新增 `src/reader/` 模块，包含完整的阅读器功能实现
  - 支持章节渲染、分页显示、翻页动画
  - 实现 1mm 高度进度条，带 2mm 高度滑块
  - 区域交互：上/下区域显示/隐藏功能栏，左/右区域翻页
  - 功能栏包含：返回书架、目录导航、字体大小调整、行距调整、书签管理
  - 使用 localStorage 持久化存储阅读设置和书签
  - Mock 数据支持，便于开发和测试

### 改进
- 优化 `src/shelf/book.ts`，点击书籍封面可直接打开阅读器
- 增强 `src/index.ts`，暴露 `showHome` 函数供阅读器模块调用
- 扩展 `public/styles.css`，新增完整的阅读器样式系统

### 技术特点
- 严格遵循 ES5 语法规范
- TypeScript 类型安全，避免使用 `any` 类型
- 模块化设计，按功能划分文件
- 详细的中文注释，提升代码可维护性

## [0.1.0] - 2025-12-XX

### 新增
- 初始化项目
- 实现书架功能
- 用户认证流程
- 书籍多选功能
- 文件上传功能
