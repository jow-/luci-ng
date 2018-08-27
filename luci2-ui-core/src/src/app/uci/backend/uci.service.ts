/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { debug } from '../../shared/observable.debug';
import { UbusService } from '../../ubus/ubus.service';

import {
  IUciAddSectionParam,
  IUciAddSectionRet,
  IUciDeleteParam,
  IUciSetParam,
} from './actions.interface';
import { IUciConfigData } from './config.interface';

@Injectable()
export class UciService {
  constructor(private _ubus: UbusService, private _http: HttpClient) {}

  getConfig(config: string): Observable<[IUciConfigData, any]> {
    return forkJoin(
      this._ubus
        .call<IUciConfigData>('uci', 'get', { config })
        .pipe(map(r => (r && r.values) || {})),
      this._http.get<{}>(`/schemas/${config}.json`).pipe(
        debug('schema get'),
        catchError(() => of({})),
        debug('schema')
      )
    ).pipe(debug('forkJoin UCI'));
  }

  /** Adds a section and returns its name, or empty string on error */
  addSection(param: IUciAddSectionParam): Observable<string> {
    return this._ubus
      .call<IUciAddSectionRet>('uci', 'add', param)
      .pipe(map(r => (r && r.section) || ''));
  }

  set(param: IUciSetParam): Observable<any> {
    return this._ubus.call('uci', 'set', param);
  }

  delete(param: IUciDeleteParam): Observable<any> {
    return this._ubus.call('uci', 'delete', param);
  }
}
