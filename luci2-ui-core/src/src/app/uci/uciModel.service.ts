/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Injectable } from '@angular/core';
import { debug } from '../shared/observable.debug';
import { IUciConfigData } from './backend/config.interface';
import { OptionData } from './data/option';
import { SectionData } from './data/section';
import { JsonPath } from 'espression-jsonpath';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { exhaust, map, tap } from 'rxjs/operators';
import { UciService } from './backend/uci.service';
import { ConfigData } from './data/config';
import { UciSelector } from './uciSelector.class';



const jsonpath = new JsonPath();
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
      return throwError('Invalid selector');

    if (!selector.config && !context)
      return throwError('No Config in selector and no context supplied');

    if (!selector.sectionName && !selector.sectionType && !context)
      return throwError('No Section Name/Type in selector and no context supplied');

    // TODO: make Sections emmit on change

    // select store level to query depending on the level of the selector
    const store: object = (selector.config && this.store) ||
      ((selector.sectionName || selector.sectionType) && context.section.config.store) ||
      context.section.store;

    // once we have the config data, return the observable of the selected option
    return this.loadConfig(selector.config || context.section.config.schema.name).pipe(
      map(() => {
        const query = jsonpath.query(store, selector.jsonPath).values;
        if (multiple) {
          // TODO: reemit on change
          return of(query.map(o => selector.option ? o.value : o));

        }
        if (!query || !query.length) return of('');
        return query[0].asObservable();
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
        calls.push(this._uci.addSection(section.getAddedParams()).pipe(
          tap(name => section.name = section.oldName = name)));
      }
    }

    forkJoin(calls).pipe(debug('save')).subscribe(
      d => console.log(d),
      e => console.log(e),
      () => console.log('complete')
    );
  }
}


