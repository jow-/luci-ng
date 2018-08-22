/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */


import { Component, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import { AbstractWidget, Expressions } from 'reactive-json-form-ng';

@Component({
  selector: 'wdg-level',
  templateUrl: './level.component.html',
  styleUrls: ['./level.component.scss'],
  exportAs: 'data',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LevelComponent extends AbstractWidget {

  value: number;
  total: number;
  icon: string;
  unit: string;
  title: string;
  noGraph: boolean;


  constructor(cdr: ChangeDetectorRef, expr: Expressions) {
    super(cdr, expr);
  }


}
