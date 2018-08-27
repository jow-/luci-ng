/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { UciModelService } from '../uciModel.service';
import { UciSelector } from '../uciSelector.class';

import { OptionData } from './option';

export class ParameterExpansion {
  /** Matchs an expansion placeholder `${}`, no escaping (uci names doesn't need it) */
  private static _re = /(.*)\${((?:\\.|(?!}).)*[^\\])}/g;

  parameters: Array<[UciSelector, number]> = [];
  parsed: string[] = [];
  constructor(public text: string) {
    let match: RegExpExecArray | null,
      last = 0;

    ParameterExpansion._re.lastIndex = 0;

    // tslint:disable-next-line:no-conditional-assignment
    while ((match = ParameterExpansion._re.exec(text)) && match[0]) {
      if (match[1]) this.parsed.push(match[1]);

      if (match[2]) {
        this.parsed.push('');
        this.parameters.push([new UciSelector(match[2]), this.parsed.length - 1]);
      }
      last = ParameterExpansion._re.lastIndex;
    }

    if (last < text.length) this.parsed.push(text.slice(last));
  }

  bind(context: OptionData, _model: UciModelService): Observable<string> {
    // fixed string
    if (!this.parameters.length) return of(this.text);

    // emmit first when we have all parameters, and then on any change
    const boundValues = this.parameters.map(p => _model.bindSelector(p[0], context));

    return combineLatest(boundValues).pipe(
      map((...values: any[]) => {
        const parsed = this.parsed.slice();
        this.parameters.forEach((p, i) => (parsed[p[1]] = values[i]));
        return parsed.join('');
      })
    );
  }
}
