/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Injectable } from '@angular/core';
import { RxObject } from 'espression-rx';
import { Schema, SchemaObject } from 'rx-json-ui';
import { combineLatest, EMPTY, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { debug } from '../shared/observable.debug';

import { IUciConfigData } from './backend/config.interface';
import { IUciSectionData } from './backend/section.interface';
import { UciService } from './backend/uci.service';

export interface IMap<T> {
  [config: string]: T;
}
export type RxConfig = IMap<IUciSectionData | IUciSectionData[]>;

@Injectable({
  providedIn: 'root',
})
export class UciModel2 {
  configs: IMap<RxConfig> = {};
  schemas: IMap<Schema> = {};
  private _orig: IMap<IMap<IUciSectionData[]>> = {};

  constructor(private _uci: UciService) {}

  loadConfig(configName: string): Observable<RxConfig> {
    if (configName in this.configs) return of(this.configs[configName]);

    return this._uci.getConfig(configName).pipe(
      map(([data, schema]: [IUciConfigData, SchemaObject]) => {
        this.schemas[configName] = schema;
        this.reactiveConfig(data, configName);
        return this.configs[configName];
      })
    );
  }

  private reactiveConfig(rawConfigData: IUciConfigData, configName: string): void {
    const config: IMap<IUciSectionData[]> = {};
    const orig: IMap<IUciSectionData[]> = {};

    // tslint:disable-next-line: forin
    for (const prop in rawConfigData) {
      let type = rawConfigData[prop]['.type'];
      if (!type) continue;
      type = `@${type}`;

      if (!config[type]) config[type] = RxObject([]);

      // normalize UCI data
      const schema = (this.schemas[configName] as SchemaObject)?.properties?.[type];
      if (
        schema &&
        schema.type === 'array' &&
        !Array.isArray(schema?.items) &&
        schema.items?.type === 'object' &&
        schema.items.properties
      ) {
        // coerce to boolean (uci saves as '1')
        for (const key in rawConfigData[prop]) {
          if (schema.items.properties[key]?.type === 'boolean')
            rawConfigData[prop][key] = ['1', 'yes', 'true'].includes(
              rawConfigData[prop][key]
            );
        }

        // setup defaults to have proper in-memory representation before creating widget
        for (const key in schema.items.properties) {
          if (!(key in rawConfigData[prop]) && 'default' in schema.items.properties[key])
            rawConfigData[prop][key] = (schema.items.properties[key] as any).default;
        }
      }

      config[type].push(RxObject(rawConfigData[prop], true));

      // deep clone data to later test for changes
      if (!orig[type]) orig[type] = [];
      orig[type].push(JSON.parse(JSON.stringify(rawConfigData[prop])));
    }

    this._orig[configName] = orig;
    this.configs[configName] = RxObject(config, false, {
      get: (target: IMap<IUciSectionData[]>, prop: string) => {
        // check if a type or a named section is being requested
        if (prop && prop.charAt(0) !== '@') {
          let result: IUciSectionData | undefined;
          // tslint:disable-next-line: forin
          for (const type in target) {
            result = target[type].find((sec) => sec['.name'] === prop);
            if (result) return result;
          }
        }
        return target[prop];
      },
    });
  }

  getSchema(config: string, type?: string): Observable<Schema | undefined> {
    return this.loadConfig(config).pipe(
      map(() => {
        if (!(config in this.schemas)) return undefined;
        const schema = <SchemaObject>this.schemas[config];
        if (!type) return schema;
        type = type.charAt(0) === '@' ? type : `@${type}`;
        if (!schema.properties || !(type in schema.properties)) return undefined;

        return schema.properties[type];
      })
    );
  }

  save(): Observable<any> {
    return combineLatest(
      Object.keys(this.configs).map((config) => this.saveConfig(config))
    ).pipe(debug('uci save'));
  }
  saveConfig(config: string): Observable<any> {
    if (!(config in this.configs)) return EMPTY;

    return combineLatest(
      Object.keys(this.configs[config]).map((type) => this.saveSections(config, type))
    ).pipe(
      switchMap(() => this._uci.apply()),
      switchMap(() => this._uci.changes(config)),
      debug(`changes: ${config}`)
    );
  }

  saveSections(config: string, type: string): Observable<any> {
    let obs: Array<Observable<any>> = [];

    const original = this._orig[config][type];
    const updated = <IUciSectionData[]>this.configs[config][type];

    original
      .filter((oldSec) => !updated.find((newSec) => newSec['.name'] === oldSec['.name']))
      .forEach((sect) => obs.push(this._uci.delete({ config, section: sect['.name'] })));

    updated
      .filter((newSec) => typeof newSec['.index'] === 'undefined')
      .forEach((sect) => {
        const values: any = {};
        for (const key in sect) {
          if (key.charAt(0) !== '.') values[key] = sect[key];
        }
        obs.push(this._uci.addSection({ config, name: sect['.name'], type, values }));
      });

    updated
      .filter((newSec) => typeof newSec['.index'] !== 'undefined')
      .forEach((sect) => (obs = obs.concat(this.saveOptions(config, type, sect))));

    return combineLatest(obs);
  }

  saveOptions(
    config: string,
    type: string,
    newSec: IUciSectionData
  ): Array<Observable<any>> {
    const obs: Array<Observable<any>> = [];

    const section = newSec['.name'];
    let options: string[] = [];
    const oldSec = this._orig[config][type].find((sec) => sec['.name'] === section);

    if (!oldSec) return obs;

    const oldKeys = Object.keys(oldSec).filter((k) => k.charAt(0) !== '.');
    const newKeys = Object.keys(newSec).filter((k) => k.charAt(0) !== '.');

    // delete options
    options = oldKeys.filter((key) => !newKeys.includes(key));
    if (options.length) obs.push(this._uci.delete({ config, section, options }));

    // add & update options

    options = newKeys.filter((key) => {
      if (Array.isArray(newSec[key]) && Array.isArray(oldSec[key])) {
        if (newSec[key].length !== oldSec[key].length) return true;

        for (let i = 0; i < newSec[key].length; i++)
          if (newSec[key][i] !== oldSec[key][i]) return true;
        return false;
      } else return newSec[key] !== oldSec[key];
    });

    if (options.length) {
      const values: any = {};
      options.forEach((key) => (values[key] = newSec[key]));
      obs.push(this._uci.set({ config, section, values }));
    }

    return obs;
  }
}
