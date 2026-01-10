// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import { BookContentResponse, Chapter, ReadingProgress } from "./types";
import {
  loadProgress,
  saveProgress,
  loadBookmarks,
  saveBookmarks,
  addBookmark as stateAddBookmark,
  removeBookmark as stateRemoveBookmark,
} from "./state";

/**
 * 获取书籍内容（Mock 数据）
 * @param bookUuid 书籍唯一标识
 * @returns Promise<BookContentResponse> 书籍内容响应
 *
 * 注意：这是 mock 实现，返回模拟的书籍内容
 * 后续可以替换为真实的 API 调用
 */
export function getBookContent(bookUuid: string): Promise<BookContentResponse> {
  return new Promise(function (resolve, reject) {
    // 模拟网络延迟
    setTimeout(function () {
      try {
        // Mock 书籍内容：一段示例文本
        var mockContent = generateMockBookContent();

        // Mock 章节数据
        var mockChapters: Chapter[] = [
          { id: "chapter-1", title: "第一章 春天的早晨", index: 0 },
          { id: "chapter-2", title: "第二章 夏日的午后", index: 1 },
          { id: "chapter-3", title: "第三章 秋天的黄昏", index: 2 },
          { id: "chapter-4", title: "第四章 冬日的夜晚", index: 3 },
          { id: "chapter-5", title: "第五章 新的开始", index: 4 },
        ];

        var response: BookContentResponse = {
          uuid: bookUuid,
          title: "示例书籍",
          content: mockContent,
          chapters: mockChapters,
        };

        resolve(response);
      } catch (e) {
        reject(e);
      }
    }, 100);
  });
}

/**
 * 生成模拟的书籍内容
 * @returns HTML 格式的书籍内容
 */
function generateMockBookContent(): string {
  return (
    "<html><body>" +
    "<h1>第一章 春天的早晨</h1>" +
    "<p>春天的阳光透过窗户洒进房间，温暖而柔和。小鸟在枝头欢快地歌唱，仿佛在迎接新的一天。空气中弥漫着花草的芬芳，让人心情愉悦。</p>" +
    "<p>这是一个万物复苏的季节。树木抽出新芽，花儿竞相开放，整个世界都充满了生机与活力。走在公园里，可以看到孩子们在草地上奔跑嬉戏，老人们在树下悠闲地聊天。</p>" +
    "<p>春天也是读书的好时节。在这样一个美好的早晨，捧一本好书，坐在窗前，品一杯香茶，实在是一件惬意的事情。</p>" +
    "<p>时间慢慢流逝，太阳逐渐升高。早晨的宁静被城市的喧嚣打破，人们开始了忙碌的一天。但那份春天的美好，依然留在心底。</p>" +
    "<p>让我们珍惜每一个春天的早晨，珍惜生活中的美好时光。因为正是这些平凡而美好的瞬间，构成了我们生命中最珍贵的回忆。</p>" +
    "<h1>第二章 夏日的午后</h1>" +
    "<p>夏天的午后总是格外炎热。知了在树上不停地叫着，仿佛在诉说着这个季节的热情。阳光透过树叶的缝隙洒下斑驳的光影，地面上的温度足以煎熟一个鸡蛋。</p>" +
    "<p>这样的天气里，人们大多选择待在室内，享受空调带来的清凉。商场、图书馆、咖啡厅都成了避暑的好去处。孩子们则期待着傍晚时分，去游泳池里畅快地游上几圈。</p>" +
    "<p>夏日的午后也有它独特的魅力。那是阳光最热烈的时候，生命力最旺盛的时候。田野里的庄稼正在快速生长，果园里的果实渐渐成熟。这一切都在告诉我们：夏天是成长的季节。</p>" +
    "<p>当我们安静地坐在窗前，看着窗外的世界，会发现夏天也有它的宁静。那是内心深处的宁静，是对生活的思考，对未来的憧憬。</p>" +
    "<p>夏日的午后，适合思考，适合阅读，适合做一切让自己成长的事情。让我们在这样热烈的季节里，努力成为更好的自己。</p>" +
    "<h1>第三章 秋天的黄昏</h1>" +
    "<p>秋天的黄昏是一天中最美的时刻。夕阳西下，天空被染成了金黄色。云彩在阳光的照射下呈现出绚丽的色彩，让人不禁感叹大自然的神奇。</p>" +
    "<p>这是一个收获的季节。田野里，稻谷金黄，农民们忙着收割；果园里，果实累累，孩子们在树下欢快地采摘。秋天总是给人带来丰收的喜悦和满足。</p>" +
    "<p>黄昏时分，走在落叶铺就的小路上，脚下发出沙沙的声响。微风吹过，更多的叶子飘落下来，像蝴蝶一样翩翩起舞。这样的场景，总能让人感到平静和安详。</p>" +
    "<p>秋天也是一个思念的季节。在这样的黄昏里，人们往往会想起远方的亲人、朋友。那些曾经的美好记忆，像电影一样在脑海中回放。</p>" +
    "<p>让我们学会珍惜，学会感恩。珍惜身边的人，感恩生活中的点点滴滴。因为在这个金色的季节里，我们收获的不只是粮食和果实，还有对生活的理解和感悟。</p>" +
    "<h1>第四章 冬日的夜晚</h1>" +
    "<p>冬天的夜晚来得特别早。天刚擦黑，街上就亮起了灯火。寒风呼啸，人们裹紧大衣，匆匆赶路。这样的天气里，家的温暖显得格外珍贵。</p>" +
    "<p>外面的世界虽然寒冷，但屋内却很温暖。一家人围坐在一起，吃着热腾腾的饭菜，聊着一天的经历，这是最简单的幸福。孩子们在客厅里玩耍，大人们看着电视，享受着天伦之乐。</p>" +
    "<p>冬日的夜晚适合阅读。在温暖的房间里，点一盏台灯，捧一本好书，让心灵在文字的世界里旅行。外面的寒冷仿佛与我无关，整个世界都安静了下来。</p>" +
    "<p>冬天是沉淀的季节。在这个季节里，我们回顾过去，总结经验；我们展望未来，制定计划。就像大地在冬天里积蓄力量，等待春天的到来。</p>" +
    "<p>让我们在这样安静的夜晚里，找到内心的平静。思考自己的人生，调整自己的方向。为来年的春天做好准备，为更好的自己而努力。</p>" +
    "<h1>第五章 新的开始</h1>" +
    "<p>每一个结束都是新的开始。就像四季的轮回，冬天过去，春天就会到来。生活也是如此，一个阶段的结束，意味着另一个阶段的开始。</p>" +
    "<p>站在新的起点上，我们可能会感到迷茫和不安。但正是这种不确定，让生活充满了无限可能。我们不知道未来会怎样，但我们可以选择以怎样的态度去面对。</p>" +
    "<p>新的开始需要勇气。勇气不是没有恐惧，而是面对恐惧依然选择前行。我们可能会遇到困难和挫折，但这些都是成长的必经之路。</p>" +
    "<p>新的开始也需要准备。我们需要总结过去的经验教训，制定清晰的计划和目标。同时，我们也要保持开放的心态，接受新的事物和挑战。</p>" +
    "<p>让我们带着希望和信心，迎接每一个新的开始。相信自己，相信未来。只要我们努力，就一定能够创造属于自己的精彩人生。</p>" +
    "<p>这个故事的结束，也是另一个故事的开始。愿我们都能在自己的人生旅途中，找到属于自己的幸福和意义。让我们一起，走向更美好的明天。</p>" +
    "</body></html>"
  );
}

/**
 * 保存阅读进度（通过状态管理器）
 * 注意：此函数使用当前状态保存进度，参数仅为 API 兼容性保留
 */
export function saveReadingProgress(
  _bookUuid: string,
  _page: number,
): Promise<void> {
  return new Promise(function (resolve, reject) {
    try {
      saveProgress();
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 获取阅读进度（通过状态管理器）
 * @param bookUuid 书籍唯一标识
 * @returns Promise<ReadingProgress | null> 阅读进度，如果不存在则返回 null
 */
export function getReadingProgress(
  bookUuid: string,
): Promise<ReadingProgress | null> {
  return new Promise(function (resolve, reject) {
    try {
      var progress = loadProgress(bookUuid);
      resolve(progress);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 保存书签（通过状态管理器）
 * @param bookUuid 书籍唯一标识
 * @param page 页码
 * @returns Promise<void>
 */
export function saveBookmark(_bookUuid: string, page: number): Promise<void> {
  return new Promise(function (resolve, reject) {
    try {
      stateAddBookmark(page);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 删除书签（通过状态管理器）
 * @param bookUuid 书籍唯一标识
 * @param page 页码
 * @returns Promise<void>
 */
export function removeBookmark(_bookUuid: string, page: number): Promise<void> {
  return new Promise(function (resolve, reject) {
    try {
      stateRemoveBookmark(page);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 获取书签列表（通过状态管理器）
 * @param bookUuid 书籍唯一标识
 * @returns Promise<number[]> 书签页码列表
 */
export function getBookmarks(bookUuid: string): Promise<number[]> {
  return new Promise(function (resolve, reject) {
    try {
      var bookmarks = loadBookmarks(bookUuid);
      resolve(bookmarks);
    } catch (e) {
      reject(e);
    }
  });
}
