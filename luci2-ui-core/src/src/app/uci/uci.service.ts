/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { UbusService } from '../ubus/ubus.service';
import { IUciConfig } from './uci.interface';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';




@Injectable()
export class UciService {

  constructor(private _ubus: UbusService) {}

  getConfig(config: string): Observable<IUciConfig> {
    return this._ubus.call('uci', 'get', {config})
      .map(r => r && r.values || {});
  }



}
