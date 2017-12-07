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
import { SectionData } from 'app/uci/data/section';
import { forkJoin } from 'rxjs/observable/forkJoin';


/**
 * UciModelService
 * Is an object that acts as the glue layer between the data model (Config/Section/Option)
 * and the backend (UciService)
 */
@Injectable()
export class UciModelService {

  configs: ConfigData[];

  constructor(private _uci: UciService) {
    this.configs = [];
  }

  getConfig(name: string): ConfigData {
    return this.configs.find(o => o.schema.name === name);
  }

  loadConfig(configName: string): Observable<ConfigData> {
    const config = this.getConfig(configName);

    if (config) return of(config);

    return this._uci.getConfig(configName).pipe(map(([data, schema]) => {
      const conf = new ConfigData(configName, data, schema);
      this.configs.push(conf);
      return conf;
    }));
  }

  save() {
    const calls: Observable<any>[] = [];
    for (const config of this.configs) {
      let sections: SectionData[];



      // first delete sections (by name in UCI if it whas changed in the page)
      sections = config.getSectionsByAction(-1);
      for (const section of sections) {
        calls.push(this._uci.delete({ config: config.schema.name, section: section.oldName }));
      }


      // then modify sections
      sections = config.getSectionsByAction(0);
      for (const section of sections) {
        const param = section.getModifiedParams();
        if (param.values)
          calls.push(this._uci.set(param));
      }

      // then add sections and preserve new name
      sections = config.getSectionsByAction(1);
      for (const section of sections) {
        calls.push(this._uci.addSection(section.getAddedParams()).do(name => section.name = section.oldName = name));
      }
    }

    forkJoin(calls).debug('save').subscribe(
      d => console.log(d),
      e => console.log(e),
      () => console.log('complete')
    );
  }
}


