/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { debug } from '../../shared/observable.debug';
import { UbusService } from '../../shared/ubus.service';

import {
  IUciAddSectionParam,
  IUciAddSectionRet,
  IUciDeleteParam,
  IUciSetParam,
} from './actions.interface';
import { IUciConfigData } from './config.interface';

@Injectable({
  providedIn: 'root',
})
export class UciService {
  constructor(private _ubus: UbusService) {}

  getConfig(config: string): Observable<[IUciConfigData, any]> {
    return forkJoin([
      this._ubus
        .call<IUciConfigData>('uci', 'get', { config })
        .pipe(map((r) => (r && r.values) || {})),
      this._ubus
        .call<{ content: any[] }>('luci2.file', 'read_json', {
          glob: `/usr/share/rpcd/luci2/uci/${config}.json`,
        })
        .pipe(
          map((res) => res?.content[0] ?? {}),
          catchError(() => of({}))
        ),
    ]).pipe(debug('forkJoin UCI'));
  }

  /** Adds a section and returns its name, or empty string on error */
  addSection(param: IUciAddSectionParam): Observable<string> {
    return this._ubus
      .call<IUciAddSectionRet>('uci', 'add', param)
      .pipe(map((r) => (r && r.section) || ''));
  }

  set(param: IUciSetParam): Observable<null> {
    return this._ubus.call('uci', 'set', param);
  }

  delete(param: IUciDeleteParam): Observable<null> {
    return this._ubus.call('uci', 'delete', param);
  }

  apply(): Observable<null> {
    return this._ubus.call('uci', 'apply', { rollback: true });
  }
  commit(config: string): Observable<null> {
    return this._ubus.call('uci', 'commit', { config });
  }

  changes(config: string): Observable<null> {
    return this._ubus.call('uci', 'changes', { config });
  }
}
