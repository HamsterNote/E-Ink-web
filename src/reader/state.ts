// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import { ReaderState, ReaderSettings, ReadingProgress, Chapter } from "./types";

/**
 * 状态管理器
 * 使用单例模式集中管理阅读器状态
 */
var currentState: ReaderState | null = null;
var stateObservers: ((state: ReaderState) => void)[] = [];

// 默认阅读设置
var defaultSettings: ReaderSettings = {
  fontSize: 4, // 默认字体大小 4mm
  lineHeight: 1.6, // 默认行高 1.6 倍
};

/**
 * 初始化状态管理器
 * @param bookId 书籍 ID
 * @param bookTitle 书籍标题
 * @param content 书籍内容（HTML 格式）
 * @param chapters 章节列表（可选）
 */
export function initState(
  bookId: string,
  bookTitle: string,
  content: string,
  chapters?: Chapter[],
): void {
  // 加载用户设置
  var settings = loadSettings();

  // 创建初始状态
  currentState = {
    bookId: bookId,
    bookTitle: bookTitle,
    currentPage: 0,
    totalPages: 1,
    content: content,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    isToolbarVisible: false,
    bookmarks: loadBookmarks(bookId),
    chapters: chapters || [],
  };

  // 尝试加载阅读进度
  var progress = loadProgress(bookId);
  if (progress) {
    currentState.currentPage = progress.currentPage;
  }
}

/**
 * 获取当前状态
 * @returns 当前阅读器状态，如果未初始化则返回 null
 */
export function getState(): ReaderState | null {
  return currentState;
}

/**
 * 更新状态
 * @param updates 部分状态更新
 */
export function updateState(updates: Partial<ReaderState>): void {
  if (!currentState) {
    console.warn("状态未初始化，无法更新");
    return;
  }

  // 更新状态
  for (var key in updates) {
    if (updates.hasOwnProperty(key)) {
      (currentState as any)[key] = (updates as any)[key];
    }
  }

  // 通知所有观察者
  notifyObservers();
}

/**
 * 添加状态观察者
 * 当状态变化时，观察者会收到通知
 * @param observer 观察者函数
 */
export function subscribe(observer: (state: ReaderState) => void): void {
  stateObservers.push(observer);
}

/**
 * 移除状态观察者
 * @param observer 要移除的观察者函数
 */
export function unsubscribe(observer: (state: ReaderState) => void): void {
  var index = stateObservers.indexOf(observer);
  if (index !== -1) {
    stateObservers.splice(index, 1);
  }
}

/**
 * 通知所有观察者状态已变化
 */
function notifyObservers(): void {
  if (!currentState) {
    return;
  }

  for (var i = 0; i < stateObservers.length; i++) {
    stateObservers[i](currentState);
  }
}

/**
 * 保存阅读进度到 localStorage
 */
export function saveProgress(): void {
  if (!currentState) {
    return;
  }

  var progress: ReadingProgress = {
    currentPage: currentState.currentPage,
    lastReadTime: new Date().toISOString(),
  };

  // 获取现有的阅读进度数据
  var allProgress: Record<string, ReadingProgress> = {};
  try {
    var stored = localStorage.getItem("readingProgress");
    if (stored) {
      allProgress = JSON.parse(stored);
    }
  } catch (e) {
    console.error("读取阅读进度失败:", e);
  }

  // 更新当前书籍的进度
  allProgress[currentState.bookId] = progress;

  // 保存到 localStorage
  try {
    localStorage.setItem("readingProgress", JSON.stringify(allProgress));
  } catch (e) {
    console.error("保存阅读进度失败:", e);
  }
}

/**
 * 从 localStorage 加载阅读进度
 * @param bookId 书籍 ID
 * @returns 阅读进度，如果不存在则返回 null
 */
export function loadProgress(bookId: string): ReadingProgress | null {
  try {
    var stored = localStorage.getItem("readingProgress");
    if (stored) {
      var allProgress: Record<string, ReadingProgress> = JSON.parse(stored);
      return allProgress[bookId] || null;
    }
  } catch (e) {
    console.error("加载阅读进度失败:", e);
  }
  return null;
}

/**
 * 保存阅读设置到 localStorage
 */
export function saveSettings(): void {
  if (!currentState) {
    return;
  }

  var settings: ReaderSettings = {
    fontSize: currentState.fontSize,
    lineHeight: currentState.lineHeight,
  };

  try {
    localStorage.setItem("readerSettings", JSON.stringify(settings));
  } catch (e) {
    console.error("保存阅读设置失败:", e);
  }
}

/**
 * 从 localStorage 加载阅读设置
 * @returns 阅读设置，如果不存在则返回默认设置
 */
export function loadSettings(): ReaderSettings {
  try {
    var stored = localStorage.getItem("readerSettings");
    if (stored) {
      var settings: ReaderSettings = JSON.parse(stored);
      return {
        fontSize: settings.fontSize || defaultSettings.fontSize,
        lineHeight: settings.lineHeight || defaultSettings.lineHeight,
      };
    }
  } catch (e) {
    console.error("加载阅读设置失败:", e);
  }
  return defaultSettings;
}

/**
 * 保存书签到 localStorage
 */
export function saveBookmarks(): void {
  if (!currentState) {
    return;
  }

  // 获取现有的书签数据
  var allBookmarks: Record<string, number[]> = {};
  try {
    var stored = localStorage.getItem("bookmarks");
    if (stored) {
      allBookmarks = JSON.parse(stored);
    }
  } catch (e) {
    console.error("读取书签失败:", e);
  }

  // 更新当前书籍的书签
  allBookmarks[currentState.bookId] = currentState.bookmarks;

  // 保存到 localStorage
  try {
    localStorage.setItem("bookmarks", JSON.stringify(allBookmarks));
  } catch (e) {
    console.error("保存书签失败:", e);
  }
}

/**
 * 从 localStorage 加载书签
 * @param bookId 书籍 ID
 * @returns 书签页码列表
 */
export function loadBookmarks(bookId: string): number[] {
  try {
    var stored = localStorage.getItem("bookmarks");
    if (stored) {
      var allBookmarks: Record<string, number[]> = JSON.parse(stored);
      return allBookmarks[bookId] || [];
    }
  } catch (e) {
    console.error("加载书签失败:", e);
  }
  return [];
}

/**
 * 添加书签
 * @param page 页码
 */
export function addBookmark(page: number): void {
  if (!currentState) {
    return;
  }

  if (currentState.bookmarks.indexOf(page) === -1) {
    currentState.bookmarks.push(page);
    currentState.bookmarks.sort(function (a, b) {
      return a - b;
    });
    saveBookmarks();
    notifyObservers();
  }
}

/**
 * 移除书签
 * @param page 页码
 */
export function removeBookmark(page: number): void {
  if (!currentState) {
    return;
  }

  var index = currentState.bookmarks.indexOf(page);
  if (index !== -1) {
    currentState.bookmarks.splice(index, 1);
    saveBookmarks();
    notifyObservers();
  }
}

/**
 * 检查指定页是否有书签
 * @param page 页码
 * @returns 是否有书签
 */
export function hasBookmark(page: number): boolean {
  if (!currentState) {
    return false;
  }
  return currentState.bookmarks.indexOf(page) !== -1;
}

/**
 * 清空状态
 */
export function clearState(): void {
  currentState = null;
  stateObservers = [];
}
