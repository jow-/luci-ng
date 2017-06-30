/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Input, ViewEncapsulation } from '@angular/core';

import { IMenuNode } from '../shell.interface';

@Component({
  selector: 'app-nav-menu',
  template: `<app-nav-item *ngFor="let node of nodes" [node]="node"></app-nav-item>`,
  styleUrls: ['./nav-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NavMenuComponent {
  @Input() nodes: IMenuNode[];
}
