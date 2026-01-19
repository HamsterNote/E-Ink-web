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
  // 进入首页/返回书架时，强制清空缓存，确保书架自动刷新为最新数据
  clearLoadedDirectory();
  setRefreshShelfForMultiSelect(function () {
    clearLoadedDirectory();
    refreshShelf();
  });
  var $shelf = $('<div id="shelf"></div>');
  // 注意：jQuery 的 .ready 只绑定 document ready，可能在 #shelf 插入 DOM 前就触发
  // 因此这里用 setTimeout 让刷新在插入 DOM 后执行（避免 $("#shelf") 取不到元素）
  setTimeout(function () {
    refreshShelf();
  }, 0);
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
    if (!res.items || !res.items.length) {
      return;
    }
    for (var j = 0; j < res.items.length; j++) {
      var itemIndex = start + j;
      if (itemIndex >= bookItemList.length) {
        break;
      }
      var $bookItem = $(bookItemList[itemIndex]);
      if ($bookItem.length) {
        createBook(res.items[j], $bookItem);
      }
    }
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
    return;
  }

  renderShelf($shelf, pageSize);
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
  var $fileName = $('<input class="ink-input" placeholder="文件名（选填）" />');
  var fileSelected: File | null = null;
  $uploadInput.on("change", function () {
    var inputElement = $uploadInput[0] as HTMLInputElement;
    var file: File | undefined = inputElement.files
      ? inputElement.files[0]
      : undefined;
    if (file) {
      fileSelected = file;
      if (!($fileName.val() as string)) {
        $fileName.val(file.name);
      }
    } else {
      fileSelected = null;
    }
  });
  $content.append($uploadButton);
  $content.append($fileName);
  var $progress = $('<div class="upload-progress"></div>');
  var $message = $('<div class="upload-message"></div>');
  $content.append($progress);
  $content.append($message);
  var $submitButton = $('<button class="ink-button">上传</button>');

  function setSubmitDisabled(disabled: boolean): void {
    $submitButton.prop("disabled", disabled);
    if (disabled) {
      $submitButton.addClass("disabled");
    } else {
      $submitButton.removeClass("disabled");
    }
  }

  function updateProgress(percent: number): void {
    $progress.text("上传进度：" + percent + "%");
  }

  function showMessage(text: string, isError: boolean): void {
    $message.text(text || "");
    if (isError) {
      $message.addClass("error");
    } else {
      $message.removeClass("error");
    }
  }

  function formatUploadError(error: unknown): string {
    if (!error) {
      return "未知错误";
    }
    if (typeof error === "string") {
      return error;
    }
    if (typeof error === "object") {
      var errObj = error as {
        message?: string;
        status?: number;
        body?: string;
      };
      var parts: string[] = [];
      if (errObj.message) {
        parts.push(errObj.message);
      }
      if (errObj.status) {
        parts.push("状态码 " + errObj.status);
      }
      if (errObj.body) {
        parts.push(String(errObj.body));
      }
      if (parts.length) {
        return parts.join("，");
      }
    }
    return "未知错误";
  }

  function closeUploadModal(): void {
    var $modal = $content.closest(".modal");
    if (!$modal.length) {
      return;
    }
    var modalId = $modal.attr("id");
    $modal.remove();
    if (modalId) {
      var maskId = "modal-mask-" + modalId.replace("modal-", "");
      $("#" + maskId).remove();
    }
  }

  $submitButton.click(function () {
    var selectedFile = fileSelected;
    if (!selectedFile) {
      alert("请选择要上传的文件");
      return;
    }
    if ($submitButton.prop("disabled")) {
      return;
    }
    setSubmitDisabled(true);
    showMessage("", false);
    updateProgress(0);
    uploadFile(
      selectedFile,
      function (percent) {
        updateProgress(percent);
      },
      function () {
        setSubmitDisabled(false);
        updateProgress(100);
        showMessage("上传成功", false);
        // 上传成功后刷新书架，确保新书立即可见
        clearLoadedDirectory();
        refreshShelf();
        setTimeout(function () {
          closeUploadModal();
        }, 300);
      },
      function (error) {
        setSubmitDisabled(false);
        var errorText = formatUploadError(error);
        showMessage("上传失败：" + errorText, true);
      },
    );
  });
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
