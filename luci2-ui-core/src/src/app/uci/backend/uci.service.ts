/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IUciAddSectionParam, IUciAddSectionRet, IUciDeleteParam, IUciSetParam } from 'app/uci/backend/actions.interface';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { debug } from 'app/shared/observable.debug';
import { UbusService } from '../../ubus/ubus.service';
import { IUciConfigData, IUciConfigSchema } from './config.interface';



@Injectable()
export class UciService {

  constructor(private _ubus: UbusService, private _http: HttpClient) { }

  getConfig(config: string): Observable<[IUciConfigData, any]> {

    return forkJoin(
      this._ubus.call<IUciConfigData>('uci', 'get', { config }).pipe(map(r => r && r.values || {})),
      this._http.get<{}>(`/schemas/${config}.json`).pipe(
        debug('schema get'),
        catchError(err => of(<IUciConfigSchema>undefined)),
        debug('schema'))
    ).pipe(debug('forkJoin UCI'));

  }

  /** Adds a section and returns its name */
  addSection(param: IUciAddSectionParam): Observable<string> {
    return this._ubus.call<IUciAddSectionRet>('uci', 'add', param).pipe(
      map(r => r && r.section || null));
  }

  set(param: IUciSetParam): Observable<any> {
    return this._ubus.call('uci', 'set', param);
  }

  delete(param: IUciDeleteParam): Observable<any> {
    return this._ubus.call('uci', 'delete', param);
  }

}
