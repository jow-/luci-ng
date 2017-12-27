/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { ConfigData } from './data/config';
import { UciService } from './backend/uci.service';

import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';
import { exhaust } from 'rxjs/operators/exhaust';
import { of } from 'rxjs/observable/of';
import { _throw } from 'rxjs/observable/throw';
import { SectionData } from 'app/uci/data/section';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { OptionData } from 'app/uci/data/option';
import { UciSelector } from './uciSelector.class';
import { IUciConfigData } from 'app/uci/backend/config.interface';
import * as jsonpath from 'jsonpath';


/**
 * UciModelService
 * Is an object that acts as the glue layer between the data model (Config/Section/Option)
 * and the backend (UciService)
 */
@Injectable()
export class UciModelService {

  configs: ConfigData[] = [];

  store: { [config: string]: IUciConfigData } = {};

  constructor(private _uci: UciService) {
  }

  getConfig(name: string): ConfigData {
    return this.configs.find(o => o.schema.name === name);
  }


  /**
   *
   * @param selector
   * @param context
   *
   * TODO: allow multiple return values, and return section names
   */
  bindSelector(selector: UciSelector, context?: OptionData, multiple = false): Observable<string> {

    // validate selector
    if (selector.invalid)
      return _throw('Invalid selector');

    if (!selector.config && !context)
      return _throw('No Config in selector and no context supplied');

    if (!selector.sectionName && !selector.sectionType && !context)
      return _throw('No Section Name/Type in selector and no context supplied');

    // TODO: make Sections emmit on change

    // select store level to query depending on the level of the selector
    const store: object = (selector.config && this.store) ||
      ((selector.sectionName || selector.sectionType) && context.section.config.store) ||
      context.section.store;

    // once we have the config data, return the observable of the selected option
    return this.loadConfig(selector.config || context.section.config.schema.name).pipe(
      map(d => {
        const query = jsonpath.query(store, selector.jsonPath, multiple ? undefined : 1);
        if (multiple) {
          // TODO: reemit on change
          return of(query.map( o => selector.option ? o.value : o));

        } else {
          if (!query || !query.length) return of('');
          return query[0].asObservable();
        }

      }
      ),
      // emmit inner observable until it finishes
      exhaust()
    );
  }

  loadConfig(configName: string): Observable<ConfigData> {
    const config = this.getConfig(configName);

    if (config) return of(config);

    return this._uci.getConfig(configName).pipe(
      map(([data, schema]) => {
        const conf = new ConfigData(configName, data, schema);
        this.configs.push(conf);
        this.store[configName] = conf.store;
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


