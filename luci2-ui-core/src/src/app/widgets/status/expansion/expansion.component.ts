/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */


import { Component, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import { AbstractWidget, Expressions } from 'reactive-json-form-ng';

@Component({
  selector: 'wdg-expansion',
  templateUrl: './expansion.component.html',
  styleUrls: ['./expansion.component.scss'],
  // tslint:disable-next-line:use-host-property-decorator
  host: {
    '[style.grid-column]': 'gridCol',
    '[style.grid-row]': 'gridRow',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpansionComponent extends AbstractWidget {

  gridCol: string;
  gridRow: string;
  gridRowOpen: string;
  gridRowClosed: string;
  value: number;
  total: number;
  icon: string;
  unit: string;
  title: string;
  format: string;
  noGraph: boolean;
  constructor(cdr: ChangeDetectorRef, expr: Expressions) {
    super(cdr, expr);
  }

}
