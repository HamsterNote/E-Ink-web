export interface Book {
	id: string;
	name: string;
	cover: string;
	order?: number;
	parent?: string;
	type: 'book'
}

export interface Directory {
	id: string;
	order?: number;
	parent?: string;
	name: string;
	type: 'directory'
}

export interface UserInfo {
	uuid: string;
	email: string;
	username: string;
	avatar: string;
}
