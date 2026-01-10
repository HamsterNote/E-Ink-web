// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { BookFile, Directory, GetFileListResponse, UserInfo } from "../types";
import { getCookie, setCookie } from "../utils";

// 显示登录模态框的回调（由 auth 模块设置）
var showLoginModalCallback: ((showClose: boolean) => void) | null = null;

/**
 * 设置登录模态框显示回调
 * @param callback 回调函数
 */
export function setShowLoginModalCallback(
  callback: (showClose: boolean) => void,
): void {
  showLoginModalCallback = callback;
}

/**
 * 初始化 AJAX 全局设置
 * 配置所有AJAX请求自动携带JWT
 */
export function initAjaxSetup(): void {
  $.ajaxSetup({
    beforeSend: function (xhr) {
      // 注意：getCookie 基于 document.cookie，无法读取 HttpOnly Cookie。
      // 若后端将 jwt_token 设为 HttpOnly，这里拿不到值，Authorization 头不会设置；
      // 认证将依赖浏览器自动携带 Cookie（更安全但 JS 无法读取）。仅非 HttpOnly 时才会填充 Authorization 头。
      var token = getCookie("jwt_token") || "";
      if (token) {
        // 在请求头中携带令牌，通常格式为 "Bearer <token>"
        xhr.setRequestHeader("Authorization", "Bearer " + token);
      }
    },
    statusCode: {
      401: function () {
        if (showLoginModalCallback) {
          showLoginModalCallback(false);
        }
      },
    },
  });
}

/**
 * 获取用户信息
 * @param callback 成功回调
 * @param onError 错误回调
 */
export function getUserInfo(
  callback: (userInfo: UserInfo) => void,
  onError?: (error: unknown) => void,
): void {
  $.ajax({
    url: "/api/v1/users/me",
    type: "GET",
    data: {},
    success: function (response: UserInfo, status, xhr) {
      if (xhr.status === 200) {
        callback(response);
      } else {
        if (onError) {
          onError({ status: xhr.status, message: "非 200 状态码" });
        }
      }
    },
    error: function (xhr, status, error) {
      if (onError) {
        onError(error);
      }
      console.error("获取用户信息失败:", error);
    },
  });
}

/**
 * 获取邮箱验证码
 * @param email 邮箱地址
 * @param purpose 用途 ('register' | 'reset')
 * @param callback 成功回调
 * @param onError 错误回调
 */
export function getEmailCode(
  email: string,
  purpose: string,
  callback: (res: unknown) => void,
  onError?: (error: unknown) => void,
): void {
  $.ajax({
    type: "POST",
    url: "/api/v1/auth/send-email-code",
    data: JSON.stringify({ email: email, purpose: purpose }),
    contentType: "application/json",
    dataType: "json",
    timeout: 5000,
    success: function (response) {
      callback(response);
    },
    error: function (xhr, status, error) {
      if (onError) {
        onError(error);
      }
      if (status === "timeout") {
        alert("请求超时！");
      } else {
        alert("错误：" + error);
      }
    },
  });
}

/**
 * 验证 OAuth 回调中的 JWT 并由服务器设置 HttpOnly Cookie
 * @param jwt 从 URL 参数中获取的 JWT
 * @param callback 验证成功回调
 * @param onError 验证失败回调
 */
export function validateOAuthToken(
  jwt: string,
  callback: () => void,
  onError?: (error: string) => void,
  options?: { statusCode?: JQueryAjaxSettings["statusCode"] },
): void {
  var ajaxOptions: JQueryAjaxSettings = {
    url: "/api/v1/auth/validate-oauth-token",
    type: "POST",
    data: JSON.stringify({ token: jwt }),
    contentType: "application/json",
    dataType: "json",
    xhrFields: {
      withCredentials: true,
    },
    success: function (response, status, xhr) {
      if (xhr.status === 200 && response && response.ok) {
        callback();
      } else {
        if (onError) {
          onError("Token validation failed");
        }
      }
    },
    error: function (xhr, status, error) {
      var errorMsg = "Token validation error";
      if (xhr.responseJSON && xhr.responseJSON.message) {
        errorMsg = xhr.responseJSON.message;
      } else if (error) {
        errorMsg = String(error);
      }
      if (onError) {
        onError(errorMsg);
      }
    },
  };

  if (options && options.statusCode) {
    ajaxOptions.statusCode = options.statusCode;
  }

  $.ajax(ajaxOptions);
}

/**
 * 通知后端清理认证状态（用于 HttpOnly Cookie 退出）
 * @returns Promise<void>
 */
export function logoutSession(): Promise<void> {
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: "/api/v1/auth/logout",
      type: "POST",
      dataType: "json",
      xhrFields: {
        withCredentials: true,
      },
      success: function () {
        resolve();
      },
      error: function (xhr, status, error) {
        reject(error || { message: "logout error", status: status });
      },
    });
  });
}

/**
 * 用户登录
 * @param email 邮箱
 * @param password 密码
 * @param callback 成功回调
 * @param onError 错误回调
 */
export function login(
  email: string,
  password: string,
  callback: () => void,
  onError: () => void,
): void {
  $.ajax({
    url: "/api/v1/auth/login",
    type: "POST",
    data: {
      email: email,
      password: password,
    },
    success: function () {
      // 登录成功后后端可能通过 HttpOnly Cookie 设置会话，不依赖 access_token
      callback();
    },
    error: function () {
      alert("登录失败！请检查邮箱和密码");
      onError();
    },
  });
}

/**
 * 用户注册
 * @param email 邮箱
 * @param password 密码
 * @param username 用户名
 * @param emailCode 邮箱验证码
 * @param callback 成功回调
 * @param onError 错误回调
 */
export function register(
  email: string,
  password: string,
  username: string,
  emailCode: string,
  callback?: () => void,
  onError?: () => void,
): void {
  $.ajax({
    url: "/api/v1/auth/register-email",
    type: "POST",
    data: {
      email: email,
      password: password,
      username: username,
      emailCode: emailCode,
    },
    success: function () {
      // 注册成功后后端可能通过 HttpOnly Cookie 设置会话，不依赖 access_token
      if (callback) {
        callback();
      }
    },
    error: function (xhr) {
      switch (xhr.status) {
        case 409:
          alert("邮箱已被注册");
          break;
        default:
          alert("注册失败！请检查验证码");
      }
      if (onError) {
        onError();
      }
    },
  });
}

/**
 * 重置密码
 * @param email 邮箱
 * @param newPassword 新密码
 * @param code 验证码
 * @param callback 成功回调
 * @param onError 错误回调
 */
export function resetPassword(
  email: string,
  newPassword: string,
  code: string,
  callback?: () => void,
  onError?: () => void,
): void {
  $.ajax({
    url: "/api/v1/auth/reset-password",
    type: "POST",
    data: {
      email: email,
      newPassword: newPassword,
      code: code,
    },
    success: function (response, status, xhr) {
      if (xhr.status === 201 && response.ok) {
        alert("密码重置成功！请登录");
        if (callback) {
          callback();
        }
      }
    },
    error: function () {
      alert("密码重置失败！请检查验证码");
      if (onError) {
        onError();
      }
    },
  });
}

/**
 * 上传文件
 * @param file 文件对象
 * @param onProgress 进度回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export function uploadFile(
  file: File,
  onProgress: (progress: number) => void,
  onComplete: (res: unknown) => void,
  onError?: (error: unknown) => void,
): void {
  // 1) 初始化上传，获取 uuid
  $.ajax({
    type: "POST",
    url: "/api/v1/files/init",
    data: JSON.stringify({
      originalFilename: file.name,
      size: file.size,
    }),
    contentType: "application/json",
    dataType: "json",
    success: function (initRes: {
      uuid?: string;
      id?: string;
      data?: string;
      result?: { uuid?: string };
    }) {
      try {
        var uuidRaw =
          initRes &&
          (initRes.uuid ||
            initRes.id ||
            initRes.data ||
            (initRes.result && initRes.result.uuid));
        if (!uuidRaw) {
          if (onError) {
            onError({ message: "init upload missing uuid", initRes: initRes });
          }
          return;
        }
        var uuid: string = uuidRaw;
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", "/api/v1/files/" + encodeURIComponent(uuid), true);
        // 携带认证头
        try {
          var token = getCookie("jwt_token") || "";
          if (token) {
            xhr.setRequestHeader("Authorization", "Bearer " + token);
          }
        } catch (e) {
          // ignore
        }
        // 设定内容类型
        var contentType = file.type || "application/octet-stream";
        xhr.setRequestHeader("Content-Type", contentType);
        // 进度回调
        if (xhr.upload && typeof onProgress === "function") {
          xhr.upload.onprogress = function (evt: ProgressEvent) {
            if (evt && evt.lengthComputable) {
              var percent = Math.floor((evt.loaded / evt.total) * 100);
              onProgress(percent);
            }
          };
        }
        xhr.onerror = function () {
          if (onError) {
            onError({ message: "upload network error" });
          }
        };
        xhr.onabort = function () {
          if (onError) {
            onError({ message: "upload aborted" });
          }
        };
        xhr.onload = function () {
          var status = xhr.status;
          if (status >= 200 && status < 300) {
            var text = xhr.responseText;
            var res: unknown = null;
            try {
              res = text ? JSON.parse(text) : null;
            } catch (e) {
              res = { ok: true, uuid: uuid };
            }
            if (!res) {
              $.ajax({
                type: "GET",
                url: "/api/v1/files/" + encodeURIComponent(uuid) + "/status",
                dataType: "json",
                success: function (statusRes: unknown) {
                  onComplete(statusRes || { ok: true, uuid: uuid });
                },
                error: function () {
                  onComplete({ ok: true, uuid: uuid });
                },
              });
            } else {
              onComplete(res || { ok: true, uuid: uuid });
            }
          } else {
            if (onError) {
              onError({
                message: "upload failed",
                status: status,
                body: xhr.responseText,
              });
            }
          }
        };
        // 发送文件本体
        xhr.send(file);
      } catch (err) {
        if (onError) {
          onError(err);
        }
      }
    },
    error: function (xhr, status, error) {
      if (onError) {
        onError(error || { message: "init upload error", status: status });
      }
    },
  });
}

/**
 * 获取文件列表
 * @param parent 父目录
 * @param page 页码
 * @param pageSize 每页数量
 * @returns Promise<GetFileListResponse>
 */
export function getFileList(
  parent: Directory | undefined,
  page: number,
  pageSize: number,
): Promise<GetFileListResponse> {
  return new Promise(function (resolve, reject) {
    var url = "/api/v1/files?";
    if (parent) {
      url += "parentUuid=" + parent.uuid + "&";
    }
    url += "page=" + (page + 1) + "&pageSize=" + pageSize;

    $.ajax({
      type: "GET",
      url: url,
      dataType: "json",
      success: function (response) {
        var items = response.items.map(function (
          item: Omit<BookFile, "pageSize" | "page">,
        ) {
          return {
            size: item.size,
            createAt: item.createAt,
            ext: item.ext,
            originalFilename: item.originalFilename,
            order: item.order,
            tags: item.tags,
            color: item.color,
            uuid: item.uuid,
            parent: parent,
            page: page,
            pageSize: pageSize,
          };
        });
        resolve({
          items: items,
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
        });
      },
      error: function (xhr, status, error) {
        reject(error);
      },
    });
  });
}

/**
 * 创建文件夹
 * @param name 文件夹名称
 * @param parentUuid 父文件夹 UUID（可选，不传表示顶层）
 * @returns Promise<CreateFolderResponse>
 */
export function createFolder(
  name: string,
  parentUuid?: string,
): Promise<{ uuid: string; name: string; parentUuid: string | null }> {
  return new Promise(function (resolve, reject) {
    var data: { name: string; parentUuid?: string } = { name: name };
    if (parentUuid) {
      data.parentUuid = parentUuid;
    }

    $.ajax({
      type: "POST",
      url: "/api/v1/folders",
      data: JSON.stringify(data),
      contentType: "application/json",
      dataType: "json",
      success: function (response) {
        resolve({
          uuid: response.uuid,
          name: response.name,
          parentUuid: response.parentUuid || null,
        });
      },
      error: function (xhr, status, error) {
        reject(error || { message: "create folder error", status: status });
      },
    });
  });
}

/**
 * 获取文件夹列表
 * @param parentUuid 父文件夹 UUID（可选，不传或 null 表示顶层）
 * @returns Promise<Directory[]>
 */
export function getFolderList(parentUuid?: string): Promise<Directory[]> {
  var maxAttempts = 3;
  var baseDelayMs = 300;

  return new Promise(function (resolve, reject) {
    var url = "/api/v1/folders";
    if (parentUuid) {
      url += "?parentUuid=" + encodeURIComponent(parentUuid);
    }

    var attempt = 0;

    function doRequest(): void {
      attempt += 1;

      $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        success: function (response) {
          // 后端返回数组，转换为 Directory 类型
          var folders: Directory[] = [];
          for (var i = 0; i < response.length; i++) {
            var item = response[i];
            folders.push({
              uuid: item.uuid,
              name: item.name,
              type: "directory",
              order: item.order || 0,
              parent: undefined, // 父目录引用在调用处设置
            });
          }
          resolve(folders);
        },
        error: function (xhr, status, errorThrown) {
          var apiError = buildApiRequestError(
            "get folder list error",
            xhr,
            status,
            errorThrown,
          );

          // 对瞬时错误做有限重试，避免因为网络波动导致递归删除中断
          if (attempt < maxAttempts && isTransientApiError(apiError)) {
            var delayMs = getRetryDelayMs(baseDelayMs, attempt - 1);
            setTimeout(function () {
              doRequest();
            }, delayMs);
            return;
          }

          var err: GetFolderListError = {
            name: "GetFolderListError",
            message: apiError.message,
            parentUuid: parentUuid,
            cause: apiError,
          };
          reject(err);
        },
      });
    }

    doRequest();
  });
}

/**
 * 批量删除文件
 * @param uuids 文件 UUID 数组
 * @returns Promise<BatchDeleteResponse>
 */
export function batchDeleteFiles(uuids: string[]): Promise<{
  ok: boolean;
  deleted: number;
  results: Array<{ uuid: string; ok?: boolean; code?: string }>;
}> {
  var maxAttempts = 3;
  var baseDelayMs = 300;

  return new Promise(function (resolve, reject) {
    if (!uuids || uuids.length === 0) {
      resolve({ ok: true, deleted: 0, results: [] });
      return;
    }

    var attempt = 0;

    function doRequest(): void {
      attempt += 1;

      $.ajax({
        type: "DELETE",
        url: "/api/v1/files/batch",
        data: JSON.stringify({ uuids: uuids }),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
          resolve(response);
        },
        error: function (xhr, status, errorThrown) {
          var apiError = buildApiRequestError(
            "batch delete files error",
            xhr,
            status,
            errorThrown,
          );

          // 对瞬时错误做有限重试（例如网络抖动/5xx），避免只删了一部分就中断
          if (attempt < maxAttempts && isTransientApiError(apiError)) {
            var delayMs = getRetryDelayMs(baseDelayMs, attempt - 1);
            setTimeout(function () {
              doRequest();
            }, delayMs);
            return;
          }

          var err: BatchDeleteFilesError = {
            name: "BatchDeleteFilesError",
            message: apiError.message,
            uuids: uuids.slice(0),
            cause: apiError,
          };
          reject(err);
        },
      });
    }

    doRequest();
  });
}

/**
 * 删除单个文件夹
 * @param uuid 文件夹 UUID
 * @returns Promise<{ ok: boolean }>
 */
export function deleteFolder(uuid: string): Promise<{ ok: boolean }> {
  var maxAttempts = 3;
  var baseDelayMs = 300;

  return new Promise(function (resolve, reject) {
    var attempt = 0;

    function doRequest(): void {
      attempt += 1;

      $.ajax({
        type: "DELETE",
        url: "/api/v1/folders/" + encodeURIComponent(uuid),
        dataType: "json",
        success: function (response) {
          resolve(response);
        },
        error: function (xhr, status, errorThrown) {
          var apiError = buildApiRequestError(
            "delete folder error",
            xhr,
            status,
            errorThrown,
          );

          // 删除操作需要具备幂等性：若文件夹已不存在，视为成功，便于恢复/重试
          if (apiError.status === 404) {
            resolve({ ok: true });
            return;
          }

          // 对瞬时错误做有限重试（例如网络抖动/5xx）
          if (attempt < maxAttempts && isTransientApiError(apiError)) {
            var delayMs = getRetryDelayMs(baseDelayMs, attempt - 1);
            setTimeout(function () {
              doRequest();
            }, delayMs);
            return;
          }

          var err: DeleteFolderError = {
            name: "DeleteFolderError",
            message: apiError.message,
            uuid: uuid,
            cause: apiError,
          };
          reject(err);
        },
      });
    }

    doRequest();
  });
}

/**
 * 递归删除文件夹（先删除内容再删除文件夹本身）
 * @param folderUuid 文件夹 UUID
 * @returns Promise<void>
 */
export function deleteFolderRecursive(folderUuid: string): Promise<void> {
  // 可配置的分页大小
  var defaultPageSize = 100;
  var fileItemRetryAttempts = 2;
  var fileItemRetryDelayMs = 200;

  /**
   * 删除文件夹内的全部文件（支持失败聚合与安全退出）
   * @param parentDir 父目录
   * @param pageSize 每页数量
   * @param acc 失败收集器
   * @returns Promise<void>
   */
  function deleteAllFilesInFolder(
    parentDir: Directory,
    pageSize: number,
    acc: DeleteFolderRecursiveFailureAccumulator,
  ): Promise<void> {
    // 记录已确认“永久失败”的文件，避免无限循环
    var permanentlyFailedFiles: { [uuid: string]: true } = {};

    function deleteBatchWithItemRetry(
      uuids: string[],
      remainingAttempts: number,
      lastErrorForUuid: { [uuid: string]: unknown },
    ): Promise<void> {
      if (!uuids || uuids.length === 0) {
        return Promise.resolve();
      }

      return batchDeleteFiles(uuids)
        .then(function (res) {
          var requestedSet: { [uuid: string]: true } = {};
          for (var i = 0; i < uuids.length; i++) {
            requestedSet[uuids[i]] = true;
          }

          var failedNext: string[] = [];

          if (res && res.results && res.results.length) {
            for (var r = 0; r < res.results.length; r++) {
              var item = res.results[r];
              var isOk = item && item.ok === true;
              var code = item && item.code ? String(item.code) : "";

              // 后端：not_found 表示已不存在，删除语义上视为成功（幂等）
              if (isOk || code === "not_found") {
                if (item && item.uuid) {
                  delete requestedSet[item.uuid];
                }
                continue;
              }

              if (item && item.uuid) {
                failedNext.push(item.uuid);
                lastErrorForUuid[item.uuid] = { code: code || "delete_failed" };
                delete requestedSet[item.uuid];
              }
            }
          }

          // 若后端未返回某些 uuid 的结果，按失败处理并记录
          for (var missingUuid in requestedSet) {
            if (requestedSet.hasOwnProperty(missingUuid)) {
              failedNext.push(missingUuid);
              lastErrorForUuid[missingUuid] = { code: "missing_result" };
            }
          }

          if (failedNext.length === 0) {
            return;
          }

          if (remainingAttempts > 0) {
            return delay(fileItemRetryDelayMs).then(function () {
              return deleteBatchWithItemRetry(
                failedNext,
                remainingAttempts - 1,
                lastErrorForUuid,
              );
            });
          }

          // 仍失败：标记为永久失败并聚合错误，供调用方恢复/续删
          for (var f = 0; f < failedNext.length; f++) {
            var failedUuid = failedNext[f];
            permanentlyFailedFiles[failedUuid] = true;
            recordFailedFile(acc, failedUuid, lastErrorForUuid[failedUuid]);
          }
        })
        .catch(function (err) {
          // batchDeleteFiles 已包含重试；此处认为是永久失败并聚合
          for (var i = 0; i < uuids.length; i++) {
            permanentlyFailedFiles[uuids[i]] = true;
            recordFailedFile(acc, uuids[i], err);
          }
        });
    }

    function processPage(page: number): Promise<void> {
      return getFileList(parentDir, page, pageSize)
        .then(function (pageRes) {
          if (!pageRes || !pageRes.items || pageRes.items.length === 0) {
            return;
          }

          var toDelete: string[] = [];
          for (var i = 0; i < pageRes.items.length; i++) {
            var uuid = pageRes.items[i].uuid;
            if (uuid && !permanentlyFailedFiles[uuid]) {
              toDelete.push(uuid);
            }
          }

          // 当前页全部是已确认失败的文件：尝试下一页（避免卡死）
          if (toDelete.length === 0) {
            return processPage(page + 1);
          }

          var lastErrorForUuid: { [uuid: string]: unknown } = {};
          return deleteBatchWithItemRetry(
            toDelete,
            fileItemRetryAttempts,
            lastErrorForUuid,
          ).then(function () {
            // 注意：删除会改变 offset；同页重试，直到该页不再有可删除项
            return processPage(page);
          });
        })
        .catch(function (err) {
          // 文件列表获取失败：记录并安全退出（避免无限重试导致卡死）
          recordFailedFolder(acc, parentDir.uuid, err);
        });
    }

    return processPage(0);
  }

  return new Promise(function (resolve, reject) {
    var acc = createDeleteFolderRecursiveFailureAccumulator();

    function finish(): void {
      if (hasDeleteFolderRecursiveFailures(acc)) {
        reject(buildDeleteFolderRecursiveError(folderUuid, acc));
        return;
      }
      resolve();
    }

    // 1. 获取文件夹内的子文件夹
    getFolderList(folderUuid)
      .then(function (subFolders) {
        // 2. 递归删除所有子文件夹（不因单个失败而提前中断）
        function deleteNextSubFolder(index: number): Promise<void> {
          if (index >= subFolders.length) {
            return Promise.resolve();
          }

          var sub = subFolders[index];
          return deleteFolderRecursive(sub.uuid)
            .catch(function (err) {
              mergeDeleteFolderRecursiveError(acc, err, sub.uuid);
              return;
            })
            .then(function () {
              return deleteNextSubFolder(index + 1);
            });
        }

        return deleteNextSubFolder(0);
      })
      .then(function () {
        var parentDir: Directory = {
          uuid: folderUuid,
          name: "",
          type: "directory",
          parent: undefined,
        };
        // 3. 删除所有文件（失败会聚合到 acc，不会直接 reject）
        return deleteAllFilesInFolder(parentDir, defaultPageSize, acc);
      })
      .then(function () {
        // 4. 最后删除文件夹本身（失败会聚合到 acc）
        return deleteFolder(folderUuid)
          .catch(function (err) {
            recordFailedFolder(acc, folderUuid, err);
            return { ok: false };
          })
          .then(function () {
            finish();
          });
      })
      .catch(function (err) {
        // getFolderList 失败属于“无法规划递归删除”的致命错误，直接返回结构化错误
        recordFailedFolder(acc, folderUuid, err);
        finish();
      });
  });
}

interface ApiRequestError {
  message: string;
  status?: number;
  textStatus?: string;
  responseText?: string;
  responseJSON?: unknown;
  errorThrown?: string;
}

export interface GetFolderListError {
  name: "GetFolderListError";
  message: string;
  parentUuid?: string;
  cause: ApiRequestError;
}

export interface BatchDeleteFilesError {
  name: "BatchDeleteFilesError";
  message: string;
  uuids: string[];
  cause: ApiRequestError;
}

export interface DeleteFolderError {
  name: "DeleteFolderError";
  message: string;
  uuid: string;
  cause: ApiRequestError;
}

export interface DeleteFolderRecursiveError {
  name: "DeleteFolderRecursiveError";
  message: string;
  rootFolderUuid: string;
  failedFileUuids: string[];
  failedFolderUuids: string[];
  fileFailures: Array<{ uuid: string; error: unknown }>;
  folderFailures: Array<{ uuid: string; error: unknown }>;
}

interface DeleteFolderRecursiveFailureAccumulator {
  failedFileUuids: string[];
  failedFolderUuids: string[];
  fileFailures: Array<{ uuid: string; error: unknown }>;
  folderFailures: Array<{ uuid: string; error: unknown }>;
  failedFileSet: { [uuid: string]: true };
  failedFolderSet: { [uuid: string]: true };
}

function createDeleteFolderRecursiveFailureAccumulator(): DeleteFolderRecursiveFailureAccumulator {
  return {
    failedFileUuids: [],
    failedFolderUuids: [],
    fileFailures: [],
    folderFailures: [],
    failedFileSet: {},
    failedFolderSet: {},
  };
}

function hasDeleteFolderRecursiveFailures(
  acc: DeleteFolderRecursiveFailureAccumulator,
): boolean {
  return (
    acc.failedFileUuids.length > 0 ||
    acc.failedFolderUuids.length > 0 ||
    acc.fileFailures.length > 0 ||
    acc.folderFailures.length > 0
  );
}

function recordFailedFile(
  acc: DeleteFolderRecursiveFailureAccumulator,
  uuid: string,
  error: unknown,
): void {
  if (!uuid) {
    return;
  }
  if (!acc.failedFileSet[uuid]) {
    acc.failedFileSet[uuid] = true;
    acc.failedFileUuids.push(uuid);
    acc.fileFailures.push({ uuid: uuid, error: error });
  }
}

function recordFailedFolder(
  acc: DeleteFolderRecursiveFailureAccumulator,
  uuid: string,
  error: unknown,
): void {
  if (!uuid) {
    return;
  }
  if (!acc.failedFolderSet[uuid]) {
    acc.failedFolderSet[uuid] = true;
    acc.failedFolderUuids.push(uuid);
    acc.folderFailures.push({ uuid: uuid, error: error });
  }
}

function mergeDeleteFolderRecursiveError(
  acc: DeleteFolderRecursiveFailureAccumulator,
  err: unknown,
  folderUuid: string,
): void {
  if (isDeleteFolderRecursiveError(err)) {
    for (var i = 0; i < err.fileFailures.length; i++) {
      recordFailedFile(acc, err.fileFailures[i].uuid, err.fileFailures[i].error);
    }
    for (var j = 0; j < err.folderFailures.length; j++) {
      recordFailedFolder(
        acc,
        err.folderFailures[j].uuid,
        err.folderFailures[j].error,
      );
    }
    return;
  }

  // 非结构化错误：至少确保把当前子文件夹记录为失败，便于续删/回滚
  recordFailedFolder(acc, folderUuid, err);
}

function buildDeleteFolderRecursiveError(
  rootFolderUuid: string,
  acc: DeleteFolderRecursiveFailureAccumulator,
): DeleteFolderRecursiveError {
  return {
    name: "DeleteFolderRecursiveError",
    message: "delete folder recursive failed",
    rootFolderUuid: rootFolderUuid,
    failedFileUuids: acc.failedFileUuids.slice(0),
    failedFolderUuids: acc.failedFolderUuids.slice(0),
    fileFailures: acc.fileFailures.slice(0),
    folderFailures: acc.folderFailures.slice(0),
  };
}

function isDeleteFolderRecursiveError(
  err: unknown,
): err is DeleteFolderRecursiveError {
  if (!err || typeof err !== "object") {
    return false;
  }
  var maybe = err as { name?: unknown };
  return maybe.name === "DeleteFolderRecursiveError";
}

function delay(ms: number): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, ms);
  });
}

function getRetryDelayMs(baseDelayMs: number, attemptIndex: number): number {
  // attemptIndex 从 0 开始：0=>base, 1=>2*base, 2=>4*base...
  return baseDelayMs * Math.pow(2, attemptIndex);
}

function buildApiRequestError(
  fallbackMessage: string,
  xhr: JQueryXHR,
  textStatus: string,
  errorThrown: string,
): ApiRequestError {
  var status: number | undefined;
  if (xhr && typeof xhr.status === "number") {
    status = xhr.status;
  }

  var responseText: string | undefined;
  if (xhr && typeof xhr.responseText === "string") {
    responseText = xhr.responseText;
  }

  var responseJSON: unknown;
  var xhrWithJson = xhr as JQueryXHR & { responseJSON?: unknown };
  if (xhrWithJson && typeof xhrWithJson.responseJSON !== "undefined") {
    responseJSON = xhrWithJson.responseJSON;
  }

  var message = fallbackMessage;
  if (responseJSON && typeof responseJSON === "object") {
    var maybeMessage = (responseJSON as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage) {
      message = maybeMessage;
    }
  }
  if (message === fallbackMessage && errorThrown) {
    message = String(errorThrown);
  }

  return {
    message: message,
    status: status,
    textStatus: textStatus,
    responseText: responseText,
    responseJSON: responseJSON,
    errorThrown: errorThrown,
  };
}

function isTransientApiError(err: ApiRequestError): boolean {
  // 没有明确状态码时，通常是网络问题或跨域/取消等，按瞬时处理（交由重试上限兜底）
  if (typeof err.status !== "number") {
    return true;
  }

  // 0 常见于网络断开/请求被取消
  if (err.status === 0) {
    return true;
  }

  // 408/429/5xx 一般可重试
  if (
    err.status === 408 ||
    err.status === 429 ||
    (err.status >= 500 && err.status <= 599)
  ) {
    return true;
  }

  // jQuery 的 timeout 也视为可重试
  if (err.textStatus === "timeout") {
    return true;
  }

  return false;
}
