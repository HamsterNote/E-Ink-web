// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

// 使用 Base64 的 SVG 作为目录图标（线框文件夹）
export var directoryIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgN2g1bDIgM2gxMXY5YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yeiIvPjxwYXRoIGQ9Ik0zIDdWNWEyIDIgMCAwIDEgMi0yaDRsMiAzaDZhMiAyIDAgMCAxIDIgMnYyIi8+PC9zdmc+'

// 操作计数，到一定的次数就要刷一次屏
var operationCnt = 0
var refreshScreenTime = 10

// 刷屏
export function refreshScreen(): void {
	var $refreshScreen = $('#refresh-screen');
	$refreshScreen.show();
	setTimeout(function() {
		$refreshScreen.hide();
	}, 200)
}

// 操作计数+1，到一定的次数就要刷一次屏
export function operationCntPlus(): void {
	operationCnt++
	if (operationCnt >= refreshScreenTime) {
		operationCnt = 0
		refreshScreen()
	}
}

// 每行文档数量
export var bookPerRow = 3

// 文档的大概比例
export var bookRatio = 1.5

// 每页最多多少个文档：innerHeight / (innerWidth / bookPerRow * bookRatio) * bookPerRow
export var bookPerPage = Math.ceil(window.innerHeight / (window.innerWidth / bookPerRow * bookRatio) * bookPerRow)

