/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbusService } from '../../ubus/ubus.service';
import { IMenu, IMenuItem } from './menu.interface';



@Injectable()
export class MenuService {

  constructor(private _ubus: UbusService) {   }

  loadMenu(): Observable<IMenuItem> {
    return this._ubus.call<any>('luci2.ui', 'menu').pipe(
      map(r => this.toChildArray(this.toChildTree(r.menu))));
  }


  /**
   * Returns a new transforms menu definition from the flat path like object returned by ubus luci.ui to a tree like structure
   * with subnodes in a 'childs' property, for further transformation to ordered array children
   *
   * @param menu
   */
  toChildTree(menu: IMenu): IMenuItem {
    const root: IMenuItem = { title: 'root', index: 0, childs: {} };
    let node: IMenuItem;


    if (!menu) return root;

    for (const key in menu)
      if (menu.hasOwnProperty(key)) {

        const path = key.split(/\//);
        node = root;

        for (let i = 0; i < path.length; i++) {
          if (!node.childs)
            node.childs = {};

          if (!node.childs[path[i]])
            node.childs[path[i]] = { link: '/' + path.slice(0, i + 1).join('/') };

          node = node.childs[path[i]];
        }

        Object.assign(node, menu[key]);
        if (!node.title) node.title = node.path;
      }

    return root;
  }

  /**
   * Transforms the node definition from child as objects to childs as array, mutating the original menu definition
   * Children are sorted according the 'index' property
   * @param node
   */
  toChildArray(node: IMenuItem): IMenuItem {
    const childs: IMenuItem[] = [];

    if (!node.childs) return node;

    for (const key in node.childs)
      if (node.childs.hasOwnProperty(key)) {
        this.toChildArray(node.childs[key]);
        childs.push(node.childs[key]);
      }

    childs.sort((a, b) => (a.index || 0) - (b.index || 0));

    if (childs.length) {
      node.childs = childs;
    } else {
      delete node.childs;
    }

    return node;

  }


}
