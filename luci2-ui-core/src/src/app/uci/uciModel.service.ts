/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import 'rxjs/add/observable/of';

import { Config } from './config';
import { UciService } from './uci.service';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';


/**
 * UciModelService
 * Is an object that acts as the glue layer between the data model (Config/Section/Option)
 * and the backend (UciService)
 */
@Injectable()
export class UciModelService {

  configs: Config[] = [];

  constructor(private _uci: UciService) { }

  getConfig(name: string): Config {
    return this.configs.find(c => c.name === name);

  }

  loadConfig(configName: string): Observable<Config> {
    const config = this.getConfig(configName);

    if (config) return Observable.of(config);

    return this._uci.getConfig(configName).map( c => {
      const conf = new Config(configName, c);
      this.configs.push(conf);
      return conf; });



  }
}


