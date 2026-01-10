// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import $ from "jquery";
import { getState, updateState } from "./state";
import { PageInfo } from "./types";

// 缓存分页结果，避免重复计算
var pageCache: PageInfo[] | null = null;
var cachedContent: string | null = null;
var cachedFontSize: number | null = null;
var cachedLineHeight: number | null = null;

/**
 * 渲染指定页码的内容
 * @param pageNumber 页码（从 0 开始）
 */
export function renderPage(pageNumber: number): void {
  var state = getState();
  if (!state) {
    console.warn("状态未初始化，无法渲染页面");
    return;
  }

  // 检查页码是否有效
  if (pageNumber < 0 || pageNumber >= state.totalPages) {
    console.warn("页码超出范围:", pageNumber);
    return;
  }

  // 获取分页信息
  var pages = getPages();
  if (!pages || pages.length === 0) {
    console.warn("无分页信息");
    return;
  }

  var pageInfo = pages[pageNumber];
  if (!pageInfo) {
    console.warn("未找到页码信息:", pageNumber);
    return;
  }

  // 提取该页的内容
  var pageContent = state.content.substring(
    pageInfo.startIndex,
    pageInfo.endIndex,
  );

  // 渲染到页面
  var $contentArea = $("#reader-content-area");
  if ($contentArea.length === 0) {
    console.warn("未找到内容区域 #reader-content-area");
    return;
  }

  // 清空并设置新内容
  $contentArea.html(pageContent);

  // 应用显示设置
  applyDisplaySettings();

  // 更新当前页码
  updateState({ currentPage: pageNumber });
}

/**
 * 计算并返回总页数
 * @param content 书籍内容（HTML 格式）
 * @returns 总页数
 */
export function calculateTotalPages(content: string): number {
  var pages = splitContentIntoPages(content);
  return pages.length;
}

/**
 * 将内容分割成页
 * @param content 书籍内容（HTML 格式）
 * @returns 分页信息数组
 */
export function splitContentIntoPages(content: string): PageInfo[] {
  var state = getState();
  var fontSize = state ? state.fontSize : null;
  var lineHeight = state ? state.lineHeight : null;

  // 如果内容没有变化且已有缓存，且显示设置也没有变化，直接返回缓存
  if (
    cachedContent === content &&
    pageCache &&
    cachedFontSize === fontSize &&
    cachedLineHeight === lineHeight
  ) {
    return pageCache;
  }

  // 创建隐藏的测量容器
  var $measurer = createMeasurementContainer();
  if ($measurer.length === 0) {
    // 如果无法创建测量容器，返回单页
    return [
      {
        startIndex: 0,
        endIndex: content.length,
        chapterIndex: 0,
      },
    ];
  }

  // 将内容设置到测量容器中
  $measurer.html(content);

  // 获取容器高度
  var containerHeight = getContainerHeight();
  if (containerHeight <= 0) {
    // 如果无法获取容器高度，返回单页
    $measurer.remove();
    return [
      {
        startIndex: 0,
        endIndex: content.length,
        chapterIndex: 0,
      },
    ];
  }

  // 开始分页
  var pages: PageInfo[] = [];
  var currentIndex = 0;
  var contentLength = content.length;
  var chapterIndex = 0;

  while (currentIndex < contentLength) {
    var endIndex = findPageEnd($measurer, currentIndex, containerHeight);

    if (endIndex <= currentIndex) {
      endIndex = Math.min(currentIndex + 1000, contentLength);
    }

    var pageContent = content.substring(currentIndex, endIndex);
    var h1Matches = pageContent.match(/<h1/gi);
    if (h1Matches) {
      chapterIndex += h1Matches.length;
    }

    pages.push({
      startIndex: currentIndex,
      endIndex: endIndex,
      chapterIndex: chapterIndex,
    });

    currentIndex = endIndex;
  }

  // 移除测量容器
  $measurer.remove();

  // 缓存结果，包括显示设置
  pageCache = pages;
  cachedContent = content;
  cachedFontSize = fontSize;
  cachedLineHeight = lineHeight;

  return pages;
}

/**
 * 获取分页信息
 * @returns 分页信息数组，如果未计算则返回 null
 */
export function getPages(): PageInfo[] | null {
  return pageCache;
}

/**
 * 清除分页缓存
 */
export function clearPageCache(): void {
  pageCache = null;
  cachedContent = null;
  cachedFontSize = null;
  cachedLineHeight = null;
}

/**
 * 创建隐藏的测量容器
 * @returns jQuery 对象
 */
function createMeasurementContainer(): JQuery<HTMLElement> {
  var $container = $('<div id="reader-measurer"></div>');

  var state = getState();
  if (!state) {
    return $container;
  }

  var $contentArea = $("#reader-content-area");
  var realWidth = $contentArea.length > 0 ? $contentArea.width() : 0;

  var styles = {
    position: "absolute",
    top: "-9999px",
    left: "-9999px",
    width: realWidth ? realWidth + "px" : "100%",
    height: "auto",
    "font-size": state.fontSize + "mm",
    "line-height": state.lineHeight + "",
    padding: "5mm",
    visibility: "hidden",
  };

  $container.css(styles);

  $("body").append($container);

  return $container;
}

/**
 * 获取真实容器的高度
 * @returns 容器高度（px）
 */
function getContainerHeight(): number {
  var $container = $("#reader-content-area");
  if ($container.length === 0) {
    return 0;
  }

  // 获取容器的高度
  return $container.height() || 0;
}

/**
 * 查找最近的标签边界（'>' 或 '<'）
 * @param content 完整内容
 * @param position 当前位置
 * @returns 调整后的位置，避免在标签中间切割
 */
function findNearestTagBoundary(content: string, position: number): number {
  // 向右查找最近的 '>'
  var nextTagEnd = content.indexOf(">", position);
  if (nextTagEnd !== -1) {
    nextTagEnd += 1; // 包含 '>'
  }

  // 向左查找最近的 '<'
  var prevTagStart = content.lastIndexOf("<", position - 1);

  // 选择更近的边界
  if (nextTagEnd !== -1 && prevTagStart !== -1) {
    // 如果位置在标签中间，选择最近的边界
    if (position > prevTagStart && position < nextTagEnd) {
      // 比较距离
      var distToNext = nextTagEnd - position;
      var distToPrev = position - prevTagStart;
      if (distToNext <= distToPrev) {
        return nextTagEnd;
      } else {
        return prevTagStart;
      }
    }
  } else if (nextTagEnd !== -1) {
    return nextTagEnd;
  } else if (prevTagStart !== -1) {
    return prevTagStart;
  }

  return position;
}

/**
 * 查找一页的结束位置
 * @param $measurer 测量容器
 * @param startIndex 起始位置
 * @param maxHeight 最大高度
 * @returns 结束位置
 */
function findPageEnd(
  $measurer: JQuery<HTMLElement>,
  startIndex: number,
  maxHeight: number,
): number {
  var content = $measurer.html() || "";
  var contentLength = content.length;

  // 二分查找最佳分页点
  var left = startIndex;
  var right = contentLength;
  var result = startIndex;

  while (left <= right) {
    var mid = Math.floor((left + right) / 2);

    // 确保不在 HTML 标签中间切割
    mid = findNearestTagBoundary(content, mid);

    var testContent = content.substring(startIndex, mid);

    $measurer.html(testContent);
    var height = $measurer.height() || 0;

    if (height <= maxHeight) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // 在最佳位置附近寻找合适的断点（段落结束、句子结束等）
  return findBestBreakPoint(content, startIndex, result, maxHeight, $measurer);
}

/**
 * 在最佳位置附近寻找合适的断点
 * @param content 完整内容
 * @param startIndex 起始位置（用于测量正确的范围）
 * @param position 最佳位置
 * @param maxHeight 最大高度
 * @param $measurer 测量容器
 * @returns 断点位置
 */
function findBestBreakPoint(
  content: string,
  startIndex: number,
  position: number,
  maxHeight: number,
  $measurer: JQuery<HTMLElement>,
): number {
  // 定义优先级：段落 > 句子 > 单词
  var breakPatterns = [
    { pattern: /<\/p>/i, priority: 1 }, // 段落结束
    { pattern: /。<|！|？|；/g, priority: 2 }, // 中文句子结束
    { pattern: /\.\s|!\s|\?\s/g, priority: 2 }, // 英文句子结束
    { pattern: /，/g, priority: 3 }, // 中文逗号
    { pattern: /,\s/g, priority: 3 }, // 英文逗号
    { pattern: / /g, priority: 4 }, // 空格
  ];

  // 向前查找合适的断点（最多回退 500 个字符）
  var searchStart = Math.max(0, position - 500);
  var bestPosition = position;

  for (var i = 0; i < breakPatterns.length; i++) {
    var patternInfo = breakPatterns[i];
    var pattern = patternInfo.pattern;
    pattern.lastIndex = 0; // 重置正则表达式的 lastIndex

    var match;
    var lastMatch = -1;

    // 在范围内查找所有匹配
    while ((match = pattern.exec(content)) !== null) {
      if (match.index >= searchStart && match.index < position) {
        lastMatch = match.index + match[0].length;
      }
    }

    // 如果找到匹配，验证高度是否合适
    if (lastMatch !== -1 && lastMatch > searchStart) {
      // 使用 startIndex 而不是 searchStart 来测量实际渲染的范围
      var testContent = content.substring(startIndex, lastMatch);
      $measurer.html(testContent);
      var height = $measurer.height() || 0;

      if (height <= maxHeight) {
        bestPosition = lastMatch;
        break; // 找到最高优先级的匹配，停止搜索
      }
    }
  }

  // 确保至少前进一些内容
  if (bestPosition <= searchStart) {
    bestPosition = Math.min(position, searchStart + 1000);
  }

  return bestPosition;
}

/**
 * 应用显示设置（字体大小、行高等）
 */
export function applyDisplaySettings(): void {
  var state = getState();
  if (!state) {
    return;
  }

  var $contentArea = $("#reader-content-area");
  if ($contentArea.length === 0) {
    return;
  }

  // 应用字体大小
  $contentArea.css("font-size", state.fontSize + "mm");

  // 应用行高
  $contentArea.css("line-height", state.lineHeight + "");
}

/**
 * 获取当前页面的章节标题
 * @param pageNumber 页码
 * @returns 章节标题
 */
export function getChapterTitle(pageNumber: number): string {
  var state = getState();
  if (!state || !state.chapters || state.chapters.length === 0) {
    return "";
  }

  var pages = getPages();
  if (!pages || pageNumber >= pages.length) {
    return "";
  }

  var pageInfo = pages[pageNumber];
  var chapterIndex = pageInfo.chapterIndex;

  if (chapterIndex >= 0 && chapterIndex < state.chapters.length) {
    return state.chapters[chapterIndex].title;
  }

  return "";
}
