// 注意：保持 ES5 语法（避免 let/const、箭头函数、class 等）
// TypeScript 仅做类型检查；输出通过 Babel/webpack 降级为 ES5。
import $ from "jquery";
import { BookFile, Directory, GetFileListResponse, UserInfo } from "../types";
import { getCookie } from "../utils";

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
      // 从 localStorage 中取出令牌
      var token =
        localStorage.getItem("jwt_token") || getCookie("jwt_token") || "";
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
  onError?: () => void,
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
          onError();
        }
      }
    },
    error: function (xhr, status, error) {
      if (onError) {
        onError();
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
    success: function (response) {
      // 从响应头获取令牌（取决于后端设置）
      var token = response.access_token as string;

      if (token) {
        // 将令牌保存到 localStorage
        localStorage.setItem("jwt_token", token);
        document.cookie = "jwt_token=" + token;
        callback();
      }
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
 * @returns Promise<string | null> 返回 token 或 null
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
    success: function (response) {
      var token = response.access_token as string;

      if (token) {
        localStorage.setItem("jwt_token", token);
        document.cookie = "jwt_token=" + token;
        if (callback) {
          callback();
        }
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
          var token =
            localStorage.getItem("jwt_token") || getCookie("jwt_token") || "";
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
  return new Promise(function (resolve, reject) {
    var url = "/api/v1/folders";
    if (parentUuid) {
      url += "?parentUuid=" + encodeURIComponent(parentUuid);
    }

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
      error: function (xhr, status, error) {
        reject(error || { message: "get folder list error", status: status });
      },
    });
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
  return new Promise(function (resolve, reject) {
    $.ajax({
      type: "DELETE",
      url: "/api/v1/files/batch",
      data: JSON.stringify({ uuids: uuids }),
      contentType: "application/json",
      dataType: "json",
      success: function (response) {
        resolve(response);
      },
      error: function (xhr, status, error) {
        reject(
          error || { message: "batch delete files error", status: status },
        );
      },
    });
  });
}

/**
 * 删除单个文件夹
 * @param uuid 文件夹 UUID
 * @returns Promise<{ ok: boolean }>
 */
export function deleteFolder(uuid: string): Promise<{ ok: boolean }> {
  return new Promise(function (resolve, reject) {
    $.ajax({
      type: "DELETE",
      url: "/api/v1/folders/" + encodeURIComponent(uuid),
      dataType: "json",
      success: function (response) {
        resolve(response);
      },
      error: function (xhr, status, error) {
        reject(error || { message: "delete folder error", status: status });
      },
    });
  });
}

/**
 * 递归删除文件夹（先删除内容再删除文件夹本身）
 * @param folderUuid 文件夹 UUID
 * @returns Promise<void>
 */
export function deleteFolderRecursive(folderUuid: string): Promise<void> {
  return new Promise(function (resolve, reject) {
    // 1. 获取文件夹内的子文件夹
    getFolderList(folderUuid)
      .then(function (subFolders) {
        // 2. 递归删除所有子文件夹
        var folderPromises: Promise<void>[] = [];
        for (var i = 0; i < subFolders.length; i++) {
          folderPromises.push(deleteFolderRecursive(subFolders[i].uuid));
        }
        return Promise.all(folderPromises);
      })
      .then(function () {
        var parentDir: Directory = {
          uuid: folderUuid,
          name: "",
          type: "directory",
          parent: undefined,
        };
        return getFileList(parentDir, 0, 1000);
      })
      .then(function (fileListRes) {
        // 4. 删除所有文件
        if (fileListRes.items.length > 0) {
          var fileUuids: string[] = [];
          for (var j = 0; j < fileListRes.items.length; j++) {
            if (fileListRes.items[j].uuid) {
              fileUuids.push(fileListRes.items[j].uuid);
            }
          }
          if (fileUuids.length > 0) {
            return batchDeleteFiles(fileUuids);
          }
        }
        return Promise.resolve(null);
      })
      .then(function () {
        // 5. 最后删除文件夹本身
        return deleteFolder(folderUuid);
      })
      .then(function () {
        resolve();
      })
      .catch(function (err) {
        reject(err);
      });
  });
}
