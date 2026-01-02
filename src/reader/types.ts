// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

/**
 * 交互区域类型
 * 定义阅读器屏幕的四个交互区域
 */
export type InteractionZone = "top" | "bottom" | "left" | "right";

/**
 * 章节信息接口
 * 表示书籍中的一个章节
 */
export interface Chapter {
  id: string; // 章节唯一标识
  title: string; // 章节标题
  index: number; // 章节索引（从 0 开始）
}

/**
 * 书籍内容响应接口
 * API 返回的书籍数据结构（目前使用 mock 数据）
 */
export interface BookContentResponse {
  uuid: string; // 书籍唯一标识
  title: string; // 书籍标题
  content: string; // 书籍内容（HTML 格式）
  chapters?: Chapter[]; // 可选的章节列表
}

/**
 * 阅读器状态接口
 * 管理阅读器的核心状态
 */
export interface ReaderState {
  bookId: string; // 当前书籍 ID
  bookTitle: string; // 当前书籍标题
  currentPage: number; // 当前页码（从 0 开始）
  totalPages: number; // 总页数
  content: string; // 完整的书籍内容
  fontSize: number; // 字体大小（单位：mm）
  lineHeight: number; // 行高（单位：em，倍数）
  isToolbarVisible: boolean; // 功能栏是否可见
  bookmarks: number[]; // 书签页码列表
  chapters: Chapter[]; // 章节列表
}

/**
 * 阅读设置接口
 * 用户可配置的阅读显示设置
 */
export interface ReaderSettings {
  fontSize: number; // 字体大小（单位：mm，默认 4mm）
  lineHeight: number; // 行高（单位：em，默认 1.6）
}

/**
 * 阅读进度接口
 * 存储用户的阅读进度
 */
export interface ReadingProgress {
  currentPage: number; // 当前页码
  lastReadTime: string; // 最后阅读时间（ISO 8601 格式）
}

/**
 * 分页信息接口
 * 记录每一页的起始位置
 */
export interface PageInfo {
  startIndex: number; // 页面起始字符索引
  endIndex: number; // 页面结束字符索引
  chapterIndex: number; // 所属章节索引
}
