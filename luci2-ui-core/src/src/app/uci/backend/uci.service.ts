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




@Injectable()
export class UciService {

  constructor(private _ubus: UbusService, private _http: HttpClient) { }

  getConfig(config: string): Observable<[IUciConfigData, IUciConfigSchema]> {

    return forkJoin(
      this._ubus.call('uci', 'get', { config }).map(r => r && <IUciConfigData>r.values || <IUciConfigData>{}),
      this._http.get<IUciConfigSchema>(`/assets/schemas/${config}.json`));

  }



}
