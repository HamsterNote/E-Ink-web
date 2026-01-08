// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from 'jquery';

/**
 * 显示菜单
 * @param $content 菜单项的 jQuery 对象数组
 * @param className 菜单的 CSS 类名
 * @param style 菜单的内联样式
 */
export function showMenu($content: JQuery<HTMLElement>[], className?: string, style?: string): void {
	var cls = className || '';
	var stl = style || '';

	var $app = $('#app')
	var $menu = $('<div class="menu ' + cls + '" style="' + stl + '"></div>')
	var $menuMask = $('<div class="menu-mask ' + cls + '"></div>')
	$app.append($menuMask)

	for (var i = 0; i < $content.length; i++) {
		$menu.append($content[i])
	}

	$menu.click(function() {
		$menu.remove()
		$menuMask.remove()
	})

	$menuMask.click(function() {
		$menu.remove()
		$menuMask.remove()
	})

	$app.append($menu)
}

