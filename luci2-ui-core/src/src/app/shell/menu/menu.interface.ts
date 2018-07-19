/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

export interface IMenuItem {
  index: number;
  title: string;
  tabbed?: boolean;
  view?: string;
  link: string;

  [extra: string]: any;

  childs?: IMenuItem[] | Object
}

export interface IMenu {
  [key: string]: IMenuItem
}
