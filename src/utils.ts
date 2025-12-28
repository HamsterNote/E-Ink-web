// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

// Cookie 操作

/**
 * 获取指定名称的 Cookie 值
 * @param name Cookie 名称
 * @returns Cookie 值，不存在则返回 null
 */
export function getCookie(name: string): string | null {
	var cookies = document.cookie.split(';');
	for (var i = 0; i < cookies.length; i++) {
		var cookie = cookies[i].trim();
		if (cookie.indexOf(name + '=') === 0) {
			return cookie.substring(name.length + 1);
		}
	}
	return null;
}

/**
 * 删除指定名称的 Cookie
 * @param name Cookie 名称
 */
export function removeCookie(name: string): void {
	document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// 屏幕相关

/**
 * 获取屏幕的大致DPC（每厘米像素数）
 * @returns [xDPC, yDPC] 分别表示X轴和Y轴方向的 DPC
 */
export function getScreenDPC(): number[] {
	var dpc: number[] = [];
	// 创建一个临时div元素
	var div = document.createElement('div');
	// 设置其宽度为1厘米，并确保在视口外不可见
	div.style.cssText = 'width:1cm;height:1cm;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden;pointer-events:none;';
	// 将元素添加到DOM中
	document.body.appendChild(div);
	// 测量元素的实际像素宽度和高度，这大致就是 DPC 值
	dpc[0] = Math.round(div.offsetWidth);
	dpc[1] = Math.round(div.offsetHeight);
	// 测量完成后，从DOM中移除该元素
	if (div.parentNode) {
		div.parentNode.removeChild(div);
	}

	return dpc;
}

// 全局 DPC 值
export var globalDpc = getScreenDPC()
export var globalDpcX = globalDpc[0];
export var globalDpcY = globalDpc[1];
