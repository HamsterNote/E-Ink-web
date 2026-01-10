// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { BookFile, Directory } from "../types";
import { bookPerPage, bookPerRow, refreshScreen } from "../common";
import { createScrollArea, activeScrollArea } from "../components/scrollArea";
import { showMenu } from "../components/menu";
import { showModal } from "../components/modal";
import { getFileList, uploadFile, createFolder, getFolderList } from "../api";
import { logout, showUserInfo } from "../auth/login";
import { createBook } from "./book";
import { createDirectory } from "./directory";
import {
  switchMultiSelect,
  setRefreshShelfForMultiSelect,
} from "./multiSelect";

// 已加载的目录列表
var loadedDirectory: Array<Directory | null | undefined> = [];

// 书籍列表
var bookList: BookFile[] = [];

// 目录列表
var directoryList: Directory[] = [];

// 当前书架目录
var currentShelfDirectory: Directory | undefined = undefined;

/**
 * 获取当前目录下的所有项目（书籍和目录）
 * @returns 排序后的书籍和目录数组
 */
function getCurrentList(): Array<BookFile | Directory> {
  var currentDir = currentShelfDirectory;
  var result: Array<BookFile | Directory> = [];

  // 添加书籍
  for (var i = 0; i < bookList.length; i++) {
    if (bookList[i].parent === currentDir) {
      result.push(bookList[i]);
    }
  }

  // 添加目录
  for (var j = 0; j < directoryList.length; j++) {
    if (directoryList[j].parent === currentDir) {
      result.push(directoryList[j]);
    }
  }

  // 排序
  result.sort(function (a, b) {
    if (a.order === undefined) {
      return 1;
    }
    if (b.order === undefined) {
      return -1;
    }
    return a.order - b.order;
  });

  return result;
}

/**
 * 判断是否为书籍类型
 * @param bookOrDirectory 书籍或目录对象
 * @returns 是否为书籍
 */
function isBook(
  bookOrDirectory: BookFile | Directory,
): bookOrDirectory is BookFile {
  return "originalFilename" in bookOrDirectory;
}

/**
 * 创建书架
 * @returns 书架的 jQuery 对象
 */
export function createShelf(): JQuery<HTMLElement> {
  currentShelfDirectory = undefined;
  setRefreshShelfForMultiSelect(function () {
    clearLoadedDirectory();
    refreshShelf();
  });
  var $shelf = $('<div id="shelf"></div>');
  $shelf.ready(function () {
    refreshShelf();
  });
  var bottomBar = $("#bottom-bar");
  bottomBar.append(createShelfBottomBar());
  return $shelf;
}

/**
 * 加载书籍
 * @param parent 父目录
 * @param page 页码
 * @param pageSize 每页数量
 */
function loadBooks(
  parent: Directory | undefined,
  page: number,
  pageSize: number,
): void {
  getFileList(parent, page, pageSize).then(function (res) {
    var bookItemList = $(".book");
    var start = page * pageSize;
    var end = (page + 1) * pageSize - 1;
    bookItemList.each(function (i, item) {
      console.log("start ", start, " end ", end, " i ", i);
      if (i >= start && i <= end) {
        var resItem = res.items[i - start];
        if (resItem) {
          console.log("loadBook ", resItem);
          createBook(resItem, $(item));
        }
      }
    });
  });
}

export function refreshShelf(): void {
  var $shelf = $("#shelf");
  if (!$shelf.length) {
    return;
  }
  var indexOfLoaded = loadedDirectory.indexOf(currentShelfDirectory);
  var pageSize = bookPerPage + bookPerRow;
  var parentUuid = currentShelfDirectory
    ? currentShelfDirectory.uuid
    : undefined;

  if (indexOfLoaded === -1) {
    var filePromise = getFileList(currentShelfDirectory, 0, pageSize);
    var folderPromise = getFolderList(parentUuid);

    Promise.all([filePromise, folderPromise]).then(function (results) {
      var fileRes = results[0];
      var folders = results[1];

      for (var f = 0; f < folders.length; f++) {
        folders[f].parent = currentShelfDirectory;
        directoryList.push(folders[f]);
      }

      var total = fileRes.total;
      for (var idx = 0; idx < fileRes.items.length; idx++) {
        bookList.push(fileRes.items[idx]);
      }

      var rest: BookFile[] = [];
      for (var i = fileRes.items.length; i < total; i++) {
        rest.push({
          uuid: "",
          originalFilename: "加载中...",
          createAt: "",
          color: "",
          tags: "",
          ext: "",
          size: 0,
          order: 0,
          parent: currentShelfDirectory,
          page: Math.floor(i / pageSize),
          pageSize: pageSize,
        });
      }
      for (var j = 0; j < rest.length; j++) {
        bookList.push(rest[j]);
      }

      loadedDirectory.push(currentShelfDirectory);
      renderShelf($shelf, pageSize);
    });
  } else {
    // 仅在目录不在已加载列表中时才添加，避免重复
    if (indexOfLoaded === -1) {
      loadedDirectory.push(currentShelfDirectory);
    }
    renderShelf($shelf, pageSize);
  }
}

/**
 * 渲染书架内容
 * @param $shelf 书架的 jQuery 对象
 * @param pageSize 每页数量
 */
function renderShelf($shelf: JQuery<HTMLElement>, pageSize: number): void {
  $shelf.html("");
  var $shelfContent = $('<div class="shelf-content">');
  var bookItemList: JQuery<HTMLElement>[] = [];
  var currentList = getCurrentList();

  for (var i = 0; i < currentList.length; i++) {
    var bookOrDirectory = currentList[i];
    if (isBook(bookOrDirectory)) {
      var bookItem = createBook(bookOrDirectory);
      $shelfContent.append(bookItem);
      bookItemList.push(bookItem);
    } else {
      var directoryItem = createDirectory(bookOrDirectory);
      $shelfContent.append(directoryItem);
    }
  }

  $shelfContent.append('<div class="clear-both"></div>');
  var $scrollArea = createScrollArea($shelfContent);
  $shelf.append($scrollArea);

  activeScrollArea($scrollArea, true, function () {
    // 目前来看所有的书都是顺序摆放的
    var pages: number[] = [];
    for (var idx = 0; idx < bookItemList.length; idx++) {
      var book = bookItemList[idx];
      if (book.attr("uuid")) {
        continue;
      }
      var boundingRect =
        book[0] && typeof book[0].getBoundingClientRect === "function"
          ? book[0].getBoundingClientRect()
          : null;
      if (
        boundingRect &&
        boundingRect.top + boundingRect.height > 0 &&
        boundingRect.top < window.innerHeight
      ) {
        // 出现在视口中
        var page = book.attr("page");
        if (page) {
          pages.push(parseInt(page, 10));
        }
      }
    }
    if (pages.length) {
      var minPage = Math.min.apply(null, pages);
      var maxPage = Math.max.apply(null, pages);
      console.log(minPage, maxPage, pages);
      loadBooks(
        currentShelfDirectory,
        minPage,
        (maxPage - minPage + 1) * pageSize,
      );
    }
  });
}

/**
 * 创建书架底部栏
 * @returns 底部栏的 jQuery 对象
 */
function createShelfBottomBar(): JQuery<HTMLElement> {
  var settingsButton = createManageButton();
  var userInfoButton = $(
    '<div id="user-info" class="bottom-bar-btn wide left"></div>',
  );
  var blankButton = $('<div class="bottom-bar-btn"></div>');
  var refreshScreenButton = $(
    '<div id="shelf-refresh-screen" class="bottom-bar-btn">刷屏</div>',
  );
  var shelfBottomBar = $('<div class="shelf-bottom-bar"></div>');
  shelfBottomBar.append(userInfoButton);
  shelfBottomBar.append(blankButton);
  shelfBottomBar.append(settingsButton);
  shelfBottomBar.append(refreshScreenButton);
  refreshScreenButton.click(refreshScreen);
  userInfoButton.click(showUserInfoMenu);
  return shelfBottomBar;
}

/**
 * 创建管理按钮
 * @returns 管理按钮的 jQuery 对象
 */
function createManageButton(): JQuery<HTMLElement> {
  var $settingsButton = $('<div class="bottom-bar-btn">管理</div>');
  $settingsButton.click(function () {
    var $upload = $('<div class="menu-item">上传文档</div>');
    var $newDir = $('<div class="menu-item">新建文件夹</div>');
    var $multiSelect = $('<div class="menu-item">选择</div>');
    var $refreshShelf = $('<div class="menu-item">刷新书架</div>');
    var $menuContent = [$upload, $newDir, $multiSelect, $refreshShelf];
    $multiSelect.click(function () {
      switchMultiSelect();
    });
    $upload.click(function () {
      showUploadModal();
    });
    $newDir.click(function () {
      showNewFolderModal();
    });
    $refreshShelf.click(function () {
      clearLoadedDirectory();
      refreshShelf();
    });
    showMenu(
      $menuContent,
      "settings-menu",
      "bottom: 1cm; width: 20%; left: 60%;",
    );
  });
  return $settingsButton;
}

/**
 * 显示上传模态框
 */
function showUploadModal(): void {
  var $content = $(
    '<div id="upload-modal-content"><div class="modal-title">上传文档</div></div>',
  );
  var $uploadButton = $('<div class="upload-button"></div>');
  var $uploadInput = $('<input class="upload-input" type="file" />');
  $uploadButton.append($uploadInput);
  $uploadInput.on("change", function () {
    var inputElement = $uploadInput[0] as HTMLInputElement;
    var file: File | undefined = inputElement.files
      ? inputElement.files[0]
      : undefined;
    if (file) {
      uploadFile(
        file,
        function (percent) {
          console.log(percent);
        },
        function () {
          console.log("complete");
        },
        function () {
          console.log("error");
        },
      );
    }
    console.log("文件选择", $uploadButton.val());
  });
  $content.append($uploadButton);
  var $fileName = $('<input class="ink-input" placeholder="文件名（选填）" />');
  $content.append($fileName);
  var $submitButton = $('<button class="ink-button">上传</button>');
  $content.append($submitButton);
  showModal($content, { showClose: true });
}

function showNewFolderModal(): void {
  var $content = $(
    '<div id="new-folder-modal-content"><div class="modal-title">新建文件夹</div></div>',
  );
  var $folderNameInput = $(
    '<input class="ink-input" placeholder="文件夹名称" />',
  );
  $content.append($folderNameInput);

  var parentUuid = currentShelfDirectory
    ? currentShelfDirectory.uuid
    : undefined;

  showModal($content, {
    showClose: true,
    onConfirm: function () {
      var folderName = ($folderNameInput.val() as string) || "";
      if (!folderName.trim()) {
        alert("请输入文件夹名称");
        return;
      }
      createFolder(folderName.trim(), parentUuid)
        .then(function () {
          clearLoadedDirectory();
          refreshShelf();
        })
        .catch(function (err) {
          console.error("创建文件夹失败:", err);
          alert("创建文件夹失败");
        });
    },
  });
}

function clearLoadedDirectory(): void {
  loadedDirectory = [];
  bookList = [];
  directoryList = [];
}

function showUserInfoMenu(): void {
  var $logoutBtn = $('<div class="menu-item">退出登录</div>');
  showMenu([$logoutBtn], "user-info-menu", "bottom: 1cm;left: 0;width: 20%;");
  $logoutBtn.click(function () {
    logout();
  });
}

// 导出需要的函数和变量
export { refreshShelf as refreshShelfFn };
