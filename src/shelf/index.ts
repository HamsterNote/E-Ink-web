// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';
import { BookFile, Directory } from '../types';
import { bookPerPage, bookPerRow, refreshScreen } from '../common';
import { createScrollArea, activeScrollArea } from '../components/scrollArea';
import { showMenu } from '../components/menu';
import { showModal } from '../components/modal';
import { getFileList, uploadFile } from '../api';
import { logout, showUserInfo } from '../auth/login';
import { createBook } from './book';
import { createDirectory } from './directory';
import { switchMultiSelect } from './multiSelect';

// 已加载的目录列表
var loadedDirectory: Array<Directory | null | undefined> = []

// 书籍列表
var bookList: BookFile[] = []

// 目录列表
var directoryList: Directory[] = []

// 当前书架目录
var currentShelfDirectory: Directory | undefined = undefined

/**
 * 获取当前目录下的所有项目（书籍和目录）
 * @returns 排序后的书籍和目录数组
 */
function getCurrentList(): Array<BookFile | Directory> {
	var currentDir = currentShelfDirectory
	var result: Array<BookFile | Directory> = []

	// 添加书籍
	for (var i = 0; i < bookList.length; i++) {
		if (bookList[i].parent === currentDir) {
			result.push(bookList[i])
		}
	}

	// 添加目录
	for (var j = 0; j < directoryList.length; j++) {
		if (directoryList[j].parent === currentDir) {
			result.push(directoryList[j])
		}
	}

	// 排序
	result.sort(function(a, b) {
		if (a.order === undefined) {
			return 1;
		}
		if (b.order === undefined) {
			return -1;
		}
		return a.order - b.order
	})

	return result;
}

/**
 * 判断是否为书籍类型
 * @param bookOrDirectory 书籍或目录对象
 * @returns 是否为书籍
 */
function isBook(bookOrDirectory: BookFile | Directory): bookOrDirectory is BookFile {
	return 'originalFilename' in bookOrDirectory;
}

/**
 * 创建书架
 * @returns 书架的 jQuery 对象
 */
export function createShelf(): JQuery<HTMLElement> {
	currentShelfDirectory = undefined
	var $shelf = $('<div id="shelf"></div>')
	$shelf.ready(function() {
		refreshShelf();
	})
	var bottomBar = $('#bottom-bar')
	bottomBar.append(createShelfBottomBar())
	return $shelf
}

/**
 * 加载书籍
 * @param parent 父目录
 * @param page 页码
 * @param pageSize 每页数量
 */
function loadBooks(parent: Directory | undefined, page: number, pageSize: number): void {
	getFileList(parent, page, pageSize).then(function(res) {
		var bookItemList = $('.book');
		var start = page * pageSize;
		var end = (page + 1) * pageSize - 1;
		bookItemList.each(function(i, item) {
			console.log('start ', start, ' end ', end, ' i ', i);
			if (i >= start && i <= end) {
				var resItem = res.items[i - start];
				if (resItem) {
					console.log('loadBook ', resItem);
					createBook(resItem, $(item))
				}
			}
		})
	})
}

/**
 * 刷新书架
 */
export function refreshShelf(): void {
	var $shelf = $('#shelf')
	if (!$shelf.length) {
		return;
	}
	var indexOfLoaded = loadedDirectory.indexOf(currentShelfDirectory)
	console.log(indexOfLoaded);
	var pageSize = bookPerPage + bookPerRow;

	if (indexOfLoaded === -1) {
		getFileList(currentShelfDirectory, 0, pageSize).then(function(res) {
			var total = res.total;
			for (var idx = 0; idx < res.items.length; idx++) {
				bookList.push(res.items[idx])
			}
			// 提前填满
			var rest: BookFile[] = [];
			for (var i = res.items.length; i < total; i++) {
				rest.push({
					uuid: '',
					originalFilename: '加载中...',
					createAt: '',
					color: '',
					tags: '',
					ext: '',
					size: 0,
					order: 0,
					parent: currentShelfDirectory,
					page: Math.floor(i / pageSize),
					pageSize: pageSize
				})
			}
			for (var j = 0; j < rest.length; j++) {
				bookList.push(rest[j])
			}

			loadedDirectory.push(currentShelfDirectory)
			renderShelf($shelf, pageSize)
		})
	} else {
		loadedDirectory.push(currentShelfDirectory)
		renderShelf($shelf, pageSize)
	}
}

/**
 * 渲染书架内容
 * @param $shelf 书架的 jQuery 对象
 * @param pageSize 每页数量
 */
function renderShelf($shelf: JQuery<HTMLElement>, pageSize: number): void {
	$shelf.html('')
	var $shelfContent = $('<div class="shelf-content">')
	var bookItemList: JQuery<HTMLElement>[] = []
	var currentList = getCurrentList()

	for (var i = 0; i < currentList.length; i++) {
		var bookOrDirectory = currentList[i]
		if (isBook(bookOrDirectory)) {
			var bookItem = createBook(bookOrDirectory)
			$shelfContent.append(bookItem)
			bookItemList.push(bookItem)
		} else {
			var directoryItem = createDirectory(bookOrDirectory)
			$shelfContent.append(directoryItem)
			// 使用闭包保存 directory 引用
			;(function(dir) {
				directoryItem.click(function() {
					currentShelfDirectory = dir;
					console.log(currentShelfDirectory)
					refreshShelf()
				})
			})(bookOrDirectory)
		}
	}

	$shelfContent.append('<div class="clear-both"></div>')
	var $scrollArea = createScrollArea($shelfContent)
	$shelf.append($scrollArea)

	activeScrollArea($scrollArea, true, function() {
		// 目前来看所有的书都是顺序摆放的
		var pages: number[] = [];
		for (var idx = 0; idx < bookItemList.length; idx++) {
			var book = bookItemList[idx]
			if (book.attr('uuid')) {
				continue;
			}
			var boundingRect = book[0] && book[0].getBoundingClientRect ? book[0].getBoundingClientRect() : null
			if (boundingRect && boundingRect.top + boundingRect.height > 0 && boundingRect.top < window.innerHeight) {
				// 出现在视口中
				var page = book.attr('page')
				if (page) {
					pages.push(parseInt(page, 10))
				}
			}
		}
		if (pages.length) {
			var minPage = Math.min.apply(null, pages)
			var maxPage = Math.max.apply(null, pages)
			console.log(minPage, maxPage, pages);
			loadBooks(currentShelfDirectory, minPage, (maxPage - minPage + 1) * pageSize)
		}
	})
}

/**
 * 创建书架底部栏
 * @returns 底部栏的 jQuery 对象
 */
function createShelfBottomBar(): JQuery<HTMLElement> {
	var settingsButton = createManageButton()
	var userInfoButton = $('<div id="user-info" class="bottom-bar-btn wide left"></div>')
	var blankButton = $('<div class="bottom-bar-btn"></div>')
	var refreshScreenButton = $('<div id="shelf-refresh-screen" class="bottom-bar-btn">刷屏</div>')
	var shelfBottomBar = $('<div class="shelf-bottom-bar"></div>')
	shelfBottomBar.append(userInfoButton)
	shelfBottomBar.append(blankButton)
	shelfBottomBar.append(settingsButton)
	shelfBottomBar.append(refreshScreenButton)
	refreshScreenButton.click(refreshScreen)
	userInfoButton.click(showUserInfoMenu)
	return shelfBottomBar;
}

/**
 * 创建管理按钮
 * @returns 管理按钮的 jQuery 对象
 */
function createManageButton(): JQuery<HTMLElement> {
	var $settingsButton = $('<div class="bottom-bar-btn">管理</div>')
	$settingsButton.click(function() {
		var $upload = $('<div class="menu-item">上传文档</div>')
		var $newDir = $('<div class="menu-item">新建文件夹</div>')
		var $multiSelect = $('<div class="menu-item">选择</div>')
		var $refreshShelf = $('<div class="menu-item">刷新书架</div>')
		var $menuContent = [$upload, $newDir, $multiSelect, $refreshShelf]
		$multiSelect.click(function() {
			switchMultiSelect();
		})
		$upload.click(function() {
			showUploadModal();
		})
		showMenu($menuContent, 'settings-menu', 'bottom: 1cm; width: 20%; left: 60%;');
	})
	return $settingsButton
}

/**
 * 显示上传模态框
 */
function showUploadModal(): void {
	var $content = $('<div id="upload-modal-content"><div class="modal-title">上传文档</div></div>')
	var $uploadButton = $('<div class="upload-button"></div>')
	var $uploadInput = $('<input class="upload-input" type="file" />')
	$uploadButton.append($uploadInput)
	$uploadInput.on('change', function() {
		var inputElement = $uploadInput[0] as HTMLInputElement
		var file: File | undefined = inputElement.files ? inputElement.files[0] : undefined
		if (file) {
			uploadFile(file, function(percent) {
				console.log(percent)
			}, function() {
				console.log('complete')
			}, function() {
				console.log('error');
			})
		}
		console.log('文件选择', $uploadButton.val())
	})
	$content.append($uploadButton)
	var $fileName = $('<input class="ink-input" placeholder="文件名（选填）" />')
	$content.append($fileName)
	var $submitButton = $('<button class="ink-button">上传</button>')
	$content.append($submitButton)
	showModal($content, { showClose: true })
}

/**
 * 点击用户名的菜单
 */
function showUserInfoMenu(): void {
	var $logoutBtn = $('<div class="menu-item">退出登录</div>')
	showMenu([$logoutBtn], 'user-info-menu', 'bottom: 1cm;left: 0;width: 20%;')
	$logoutBtn.click(function() {
		logout()
	})
}

// 导出需要的函数和变量
export { refreshShelf as refreshShelfFn }
