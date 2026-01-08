// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { batchDeleteFiles, deleteFolderRecursive } from "../api";

// 多选状态
var multiSelectState = false;

/**
 * 获取当前多选状态
 * @returns 是否处于多选模式
 */
export function isMultiSelect(): boolean {
  return multiSelectState;
}

/**
 * 切换多选模式
 */
export function switchMultiSelect(): void {
  multiSelectState = !multiSelectState;
  switchMultiSelectMode();
}

/**
 * 切换多选模式的 UI 状态
 */
function switchMultiSelectMode(): void {
  if (multiSelectState) {
    $("#app").addClass("multi-select-mode");
    createMultiSelectBottomBar();
  } else {
    $(".multi-select-mode .book").removeClass("active");
    $("#app").removeClass("multi-select-mode");
    $(".multi-select-bottom-bar").remove();
  }
}

/**
 * 获取已选中的书籍
 * @returns 包含选中书籍的对象
 */
export function getSelected(): { books: JQuery<HTMLElement> } {
  return {
    books: $(".multi-select-mode .book.active"),
  };
}

/**
 * 创建多选模式的底部栏
 */
function createMultiSelectBottomBar(): void {
  var $bottomBar = $("#bottom-bar");
  var $multiSelectBottomBar = $(
    '<div class="shelf-bottom-bar multi-select-bottom-bar"></div>',
  );
  var $quitBtn = $('<div class="bottom-bar-btn quit-btn">退出多选</div>');
  var $cutBtn = $('<div class="bottom-bar-btn cut-btn">剪切</div>');
  var $pasteBtn = $('<div class="bottom-bar-btn paste-btn">粘贴</div>');
  var $deleteBtn = $('<div class="bottom-bar-btn paste-btn">删除</div>');

  $quitBtn.click(switchMultiSelect);
  $multiSelectBottomBar.append($quitBtn);
  $multiSelectBottomBar.append($deleteBtn);
  $deleteBtn.click(function () {
    deleteBookOrDirectory(getSelected());
  });
  $bottomBar.append($multiSelectBottomBar);
}

var refreshShelfCallback: (() => void) | null = null;

export function setRefreshShelfForMultiSelect(callback: () => void): void {
  refreshShelfCallback = callback;
}

function deleteBookOrDirectory(selected: { books: JQuery<HTMLElement> }): void {
  var confirmDelete = confirm("真的要删除吗？");
  if (!confirmDelete) {
    return;
  }

  var fileUuids: string[] = [];
  var folderUuids: string[] = [];

  selected.books.each(function () {
    var $item = $(this);
    var uuid = $item.attr("uuid");
    var dataType = $item.attr("data-type");

    if (uuid) {
      if (dataType === "folder") {
        folderUuids.push(uuid);
      } else {
        fileUuids.push(uuid);
      }
    }
  });

  if (fileUuids.length === 0 && folderUuids.length === 0) {
    alert("没有选中任何项目");
    return;
  }

  var folderDeletePromises: Promise<void>[] = [];
  for (var i = 0; i < folderUuids.length; i++) {
    folderDeletePromises.push(deleteFolderRecursive(folderUuids[i]));
  }

  Promise.all(folderDeletePromises)
    .then(function () {
      if (fileUuids.length > 0) {
        return batchDeleteFiles(fileUuids);
      }
      return Promise.resolve(null);
    })
    .then(function () {
      switchMultiSelect();
      if (refreshShelfCallback) {
        refreshShelfCallback();
      }
    })
    .catch(function (err) {
      console.error("删除失败:", err);
      alert("删除失败，请重试");
    });
}
