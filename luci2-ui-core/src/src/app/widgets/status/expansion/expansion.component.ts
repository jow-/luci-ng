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
import { BaseWidget, Expressions, MainSlotContentDef } from 'rx-json-ui';

export interface IExpansionWidgetDef {
  gridRowOpen: string;
  gridRowClosed: string;
  gridCol: string;
  value: number;
  total: number;
  icon: string;
  unit: string;
  title: string;
  format: string;
  noGraph: boolean;
}
@Component({
  selector: 'wdg-expansion',
  templateUrl: './expansion.component.html',
  styleUrls: ['./expansion.component.scss'],
  // tslint:disable-next-line:use-host-property-decorator
  host: {
    '[style.grid-column]': 'options.gridCol',
    '[style.grid-row]': 'gridRow',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpansionComponent extends BaseWidget<
  IExpansionWidgetDef,
  MainSlotContentDef
> {
  gridRow = '';

  constructor(cdr: ChangeDetectorRef, expr: Expressions) {
    super(cdr, expr);
  }
}
