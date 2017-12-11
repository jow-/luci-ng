/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { ConfigData } from './data/config';
import { UciService } from './backend/uci.service';

import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';
import { of } from 'rxjs/observable/of';


/**
 * UciModelService
 * Is an object that acts as the glue layer between the data model (Config/Section/Option)
 * and the backend (UciService)
 */
@Injectable()
export class UciModelService {

  configs: Map<string, ConfigData>;

  constructor(private _uci: UciService) {
    this.configs = new Map();
  }

  getConfig(name: string): ConfigData {
    return this.configs.get(name);

  }

  loadConfig(configName: string): Observable<ConfigData> {
    const config = this.configs.get(configName);

    if (config) return of(config);

    return this._uci.getConfig(configName).pipe(map(([data, schema]) => {
      const conf = new ConfigData(configName, data, schema);
      this.configs.set(configName, conf);
      return conf;
    }));



  }
}


