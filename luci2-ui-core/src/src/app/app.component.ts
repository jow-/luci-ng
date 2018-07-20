/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { IMenuItem } from './shell/menu/menu.interface';
import { MenuService } from './shell/menu/menu.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  menu: IMenuItem;

  constructor(private _menuService: MenuService, private _cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this._menuService.loadMenu()
      .subscribe(m => {
        this.menu = m;
        this._cdr.markForCheck();
      });

  }
}
