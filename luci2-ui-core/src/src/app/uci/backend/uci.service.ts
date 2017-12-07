/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { UbusService } from '../../ubus/ubus.service';
import { IUciConfigData, IUciConfigSchema } from './config.interface';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
import { IUciAddSectionParam, IUciAddSectionRet, IUciSetParam, IUciDeleteParam } from 'app/uci/backend/actions.interface';




@Injectable()
export class UciService {

  constructor(private _ubus: UbusService, private _http: HttpClient) { }

  getConfig(config: string): Observable<[IUciConfigData, any]> {

    return forkJoin(
      this._ubus.call<IUciConfigData>('uci', 'get', { config }).map(r => r && r.values || {}),
      this._http.get<{}>(`/schemas/${config}.json`).debug('schema get')
        .catch(err => of(<IUciConfigSchema>undefined)).debug('schema')
        ).debug('forkJoin UCI');

  }

  /** Adds a section and returns its name */
  addSection(param: IUciAddSectionParam): Observable<string> {
    return this._ubus.call<IUciAddSectionRet>('uci', 'add', param)
      .map(r => r && r.section || null);
  }

  set(param: IUciSetParam): Observable<any> {
    return this._ubus.call('uci', 'set', param);
  }

  delete(param: IUciDeleteParam): Observable<any> {
    return this._ubus.call('uci', 'delete', param);
  }

}
