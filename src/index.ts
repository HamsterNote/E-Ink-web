// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

import  $ from 'jquery';

function init() {
  // 简单演示：将内容写入 #app，并绑定点击事件
  var $app = $('#app');
  $app.text('Hello from ES5 + TypeScript + jQuery (HTML4/CSS2.1)');

  var $btn = $('<a href="#" id="btnRefresh">刷新</a>');
  $btn.on('click', function (e) {
    e.preventDefault();
    var now = new Date();
    $app.text('当前时间: ' + now.toLocaleString());
  });
  $app.after($('<div class="toolbar"></div>').append($btn));
}

// DOM Ready（使用 jQuery 1.x 风格）
$(function () {
  init();
});
