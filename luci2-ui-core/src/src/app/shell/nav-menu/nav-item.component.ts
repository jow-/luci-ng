/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Input, OnChanges, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

import { IMenuNode } from '../shell.interface';

@Component({
  selector: 'app-nav-item',
  templateUrl: 'nav-item.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavItemComponent implements OnChanges {
  @Input() level = 1;
  @Input() node: IMenuNode;

  isExpanded = false;
  classes: {[index: string]: boolean };
  nodeChilds: IMenuNode[];

  ngOnChanges() {
    this.nodeChilds = (this.node && this.node.childs) || [];

    this.setClasses();
  }

  setClasses() {
    this.classes = {
      ['level-' + this.level]: true,
      collapsed: !this.isExpanded,
      expanded: this.isExpanded,
    };
  }

  headerClicked() {
    this.isExpanded = !this.isExpanded;
    this.setClasses();
  }
}
