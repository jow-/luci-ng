/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { BaseWidget, Expressions } from 'rx-json-ui';

export interface ILevelWidgetDef {
  value: number;
  total: number;
  icon: string;
  unit: string;
  title: string;
  noGraph: boolean;
}
@Component({
  selector: 'wdg-level',
  templateUrl: './level.component.html',
  styleUrls: ['./level.component.scss'],
  exportAs: 'data',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelComponent extends BaseWidget<ILevelWidgetDef> {
  constructor(cdr: ChangeDetectorRef, expr: Expressions) {
    super(cdr, expr);
  }
}
