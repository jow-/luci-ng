import { Component, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import { AbstractWidget, Expressions } from 'reactive-json-form-ng';
import { empty } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UciModelService } from 'app/uci/uciModel.service';
import { ConfigData } from 'app/uci/data/config';

@Component({
  selector: 'dyn-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UciSectionComponent extends AbstractWidget {

  sectionName: string;
  config: ConfigData;
  section: any;
  constructor(cdr: ChangeDetectorRef, expr: Expressions, private _uciModel: UciModelService) {
    super(cdr, expr);
  }

  dynOnAfterBind() {
    this.bindings.sectionName = this.bindings.sectionName.pipe(
      switchMap(sec => {
        if (!sec) return empty();

        const match = /^\s*([a-zA-Z]+)\.([a-zA-Z]+)\s*$/.exec(sec);

        if (match) {

          return this._uciModel.loadConfig(match[1]).pipe(
            map(c => {
              this.config = c;
              this.section = c.getSection(match[2]);
            }));
        }
        return empty();
      }));
  }

}
