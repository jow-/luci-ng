/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

export interface IMenuItem {
  [extra: string]: any;
  index: number;
  title: string;
  tabbed?: boolean;
  view?: string;
  link: string;
  linkTo?: string;
}

export interface IMenuItemObj extends IMenuItem {
  childs?: { [path: string]: IMenuItemObj };
}

export interface IMenuItemArr extends IMenuItem {
  childs?: IMenuItemArr[];
}
export interface IMenu {
  [key: string]: IMenuItem;
}
