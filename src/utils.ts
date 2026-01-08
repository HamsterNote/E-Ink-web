// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。

// Cookie 操作

/**
 * 获取指定名称的 Cookie 值
 * @param name Cookie 名称
 * @returns Cookie 值，不存在则返回 null
 */
export function getCookie(name: string): string | null {
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();
    if (cookie.indexOf(name + "=") === 0) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

/**
 * 设置 Cookie
 * @param name Cookie 名称
 * @param value Cookie 值
 * @param days 过期天数（可选，默认为会话 Cookie）
 * @param options 可选配置
 * @param options.secure 是否仅通过 HTTPS 发送（默认 true，生产环境推荐）
 * @param options.sameSite SameSite 属性（默认 "Lax"）
 *
 * 安全说明：
 * - HttpOnly 属性无法通过客户端 JavaScript 设置，只能由服务器通过 Set-Cookie 响应头设置。
 * - 对于敏感令牌（如 JWT），建议通过后端 API 使用 Set-Cookie 响应头设置 HttpOnly Cookie，
 *   而不是通过客户端 JavaScript 设置。
 * - 本函数设置的 Cookie 对 JavaScript 可见，不适合存储敏感认证令牌。
 */
export function setCookie(
  name: string,
  value: string,
  days?: number,
  options?: { secure?: boolean; sameSite?: "Strict" | "Lax" | "None" },
): void {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }

  // URL 编码 cookie 值，防止特殊字符破坏 cookie 格式
  var encodedValue = encodeURIComponent(value);

  // 设置安全属性
  var secure = options && options.secure !== undefined ? options.secure : true;
  var sameSite =
    options && options.sameSite !== undefined ? options.sameSite : "Lax";

  var secureFlag = secure ? "; Secure" : "";
  var sameSiteFlag = "; SameSite=" + sameSite;

  document.cookie =
    name +
    "=" +
    encodedValue +
    expires +
    "; path=/" +
    secureFlag +
    sameSiteFlag;
}

/**
 * 删除指定名称的 Cookie
 * @param name Cookie 名称
 */
export function removeCookie(name: string): void {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// URL Query 参数操作

/**
 * 获取 URL query 参数值
 * @param name 参数名称
 * @returns 参数值；参数存在但值为空返回空字符串；参数不存在返回 null
 */
export function getQueryParam(name: string): string | null {
  var search = window.location.search;
  if (!search || search.length <= 1) {
    return null;
  }
  var queryString = search.substring(1);
  var params = queryString.split("&");
  for (var i = 0; i < params.length; i++) {
    var param = params[i];
    var eqIndex = param.indexOf("=");
    var key: string;
    var value: string;

    if (eqIndex === -1) {
      key = decodeURIComponent(param);
      value = "";
    } else {
      key = decodeURIComponent(param.substring(0, eqIndex));
      value = decodeURIComponent(param.substring(eqIndex + 1));
    }

    if (key === name) {
      return value;
    }
  }
  return null;
}

/**
 * 从 URL 中移除指定的 query 参数
 * 优先使用 replaceState（不刷新页面），旧浏览器降级为 location.replace（会刷新页面）
 * @param name 要移除的参数名称
 */
export function removeQueryParam(name: string): void {
  var search = window.location.search;
  var hash = window.location.hash;
  var baseUrl =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname;

  if (!search || search.length <= 1) {
    return;
  }

  var queryString = search.substring(1);
  var params = queryString.split("&");
  var newParams: string[] = [];

  for (var i = 0; i < params.length; i++) {
    var param = params[i];
    var eqIndex = param.indexOf("=");
    var key = eqIndex === -1 ? param : param.substring(0, eqIndex);

    if (decodeURIComponent(key) !== name) {
      newParams.push(param);
    }
  }

  var newUrl = baseUrl;
  if (newParams.length > 0) {
    newUrl += "?" + newParams.join("&");
  }
  newUrl += hash;

  if (window.history && typeof window.history.replaceState === "function") {
    try {
      window.history.replaceState({}, document.title, newUrl);
    } catch (e) {
      window.location.replace(newUrl);
    }
  } else {
    window.location.replace(newUrl);
  }
}

// 屏幕相关

/**
 * 获取屏幕的大致DPC（每厘米像素数）
 * @returns [xDPC, yDPC] 分别表示X轴和Y轴方向的 DPC
 */
export function getScreenDPC(): number[] {
  var dpc: number[] = [];
  // 创建一个临时div元素
  var div = document.createElement("div");
  // 设置其宽度为1厘米，并确保在视口外不可见
  div.style.cssText =
    "width:1cm;height:1cm;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden;pointer-events:none;";
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
export var globalDpc = getScreenDPC();
export var globalDpcX = globalDpc[0];
export var globalDpcY = globalDpc[1];
