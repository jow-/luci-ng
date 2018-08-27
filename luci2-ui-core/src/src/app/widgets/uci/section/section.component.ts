/*!
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
import { AbstractWidget, Expressions } from 'reactive-json-form-ng';
import { EMPTY } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { ConfigData } from '../../../uci/data/config';
import { UciModelService } from '../../../uci/uciModel.service';

export interface ISectionWidgetDef {
  sectionName: string;
}
@Component({
  selector: 'wdg-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UciSectionComponent extends AbstractWidget<ISectionWidgetDef> {
  config: ConfigData | undefined;
  section: any;

  constructor(cdr: ChangeDetectorRef, expr: Expressions, private _uciModel: UciModelService) {
    super(cdr, expr);
  }
  dynOnAfterBind(): void {
    this.bindings.sectionName = this.bindings.sectionName.pipe(
      switchMap(sec => {
        if (!sec) return EMPTY;

        const match = /^\s*([a-zA-Z]+)\.([a-zA-Z]+)\s*$/.exec(sec);

        if (match) {
          return this._uciModel.loadConfig(match[1]).pipe(
            map(c => {
              this.config = c;
              this.section = c.getSection(match[2]);
              return sec;
            })
          );
        }
        return EMPTY;
      })
    );
  }
}
