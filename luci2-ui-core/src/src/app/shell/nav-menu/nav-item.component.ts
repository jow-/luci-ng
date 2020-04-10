/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  ViewEncapsulation,
} from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';

import { IMenuNode } from '../shell.interface';

@Component({
  selector: 'app-nav-item',
  templateUrl: 'nav-item.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavItemComponent implements OnChanges {
  @Input()
  level = 1;
  @Input()
  node!: IMenuNode;
  @Input()
  drawer: MatDrawer | undefined;
  isExpanded = false;
  classes: { [index: string]: boolean } = {};
  nodeChilds: IMenuNode[] = [];

  ngOnChanges(): void {
    this.nodeChilds = (this.node && this.node.childs) || [];

    this.setClasses();
  }

  setClasses(): void {
    this.classes = {
      [`level-${this.level}`]: true,
      collapsed: !this.isExpanded,
      expanded: this.isExpanded,
    };
  }

  headerClicked(): void {
    this.isExpanded = !this.isExpanded;
    this.setClasses();
  }
}
