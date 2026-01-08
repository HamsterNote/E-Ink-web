# 变更日志

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增
- **api**: 增加文件夹管理功能，包括创建文件夹、获取文件夹列表、递归删除文件夹
- **api**: 增加批量删除文件功能
- **api**: 新增 validateOAuthToken() 函数，用于验证 OAuth 回调中的 JWT
- **reader**: 实现阅读器核心功能，支持书籍内容展示和阅读进度管理
- **reader**: 集成书籍内容 API（从 mock 数据切换到真实 API）
- **reader**: 实现阅读器与书架的切换功能
- **shelf**: 书架增强对文件夹的支持，可查看和浏览文件夹结构
- **shelf**: 增加打开书籍功能，支持从书架跳转到阅读器

### 重构
- **reader**: 重构 API 模块，对接后端 `/api/v1/files/{uuid}/parsed-texts` 接口
- **shelf**: 重构书架逻辑，优化文件夹和文件的展示逻辑
- **shelf**: 重构多选功能，增加文件夹支持

### 代码质量
- 统一代码缩进格式，使用 2 空格缩进
- 统一字符串引号风格（双引号）
- 优化代码结构，提升可读性

### 安全
- **auth**: 改进 JWT 处理安全性，通过后端验证并设置 HttpOnly Cookie，不再将 JWT 存储在客户端可访问位置（localStorage 或 Cookie）
- **utils**: 增强 Cookie 安全性，添加 Secure 和 SameSite 属性，URL 编码 cookie 值

### 修复
- **utils**: 修复 getQueryParam 参数解析逻辑，正确处理包含 "=" 的值和空值
- **utils**: 修复 removeQueryParam URL 移除逻辑，使用标准 API 替代手动分割，为不支持 replaceState 的浏览器添加降级方案
