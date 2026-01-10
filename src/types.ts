export interface Directory {
  uuid: string;
  order?: number;
  name: string;
  type: "directory";
  parent: Directory | undefined;
}

export interface BookFile {
  size: number;
  createAt: string;
  ext: string;
  originalFilename: string;
  order: number;
  tags: string;
  color: string;
  uuid: string;
  parent: Directory | undefined;
  page: number;
  pageSize: number;
}

export interface GetFileListResponse {
  items: BookFile[];
  page: number;
  pageSize: number;
  total: number;
}

export interface DirectoryResponse {
  items: Directory[];
}

export interface UserInfo {
  uuid: string;
  email: string;
  username: string;
  avatar: string;
}

declare global {
  interface Window {
    showHome: () => void;
  }
}
