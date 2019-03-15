/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Injectable } from '@angular/core';
import { RxObject } from 'espression-rx';
import { IMap, ISchema, ISchemaObject } from 'reactive-json-form-ng';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { IUciConfigData } from './backend/config.interface';
import { IUciSectionData } from './backend/section.interface';
import { UciService } from './backend/uci.service';

export type RxConfig = IMap<IUciSectionData | IUciSectionData[]>;

@Injectable({
  providedIn: 'root',
})
export class UciModel2 {
  configs: IMap<RxConfig> = {};
  schemas: IMap<ISchema> = {};

  constructor(private _uci: UciService) {}

  loadConfig(configName: string): Observable<RxConfig> {
    if (configName in this.configs) return of(this.configs[configName]);

    return this._uci.getConfig(configName).pipe(
      map(([data, schema]: [IUciConfigData, any]) => {
        this.schemas[configName] = schema;
        return (this.configs[configName] = this.reactiveConfig(data));
      })
    );
  }

  reactiveConfig(rawConfigData: IUciConfigData): IMap<IUciSectionData[]> {
    const config: IMap<IUciSectionData[]> = {};
    // tslint:disable-next-line: forin
    for (const prop in rawConfigData) {
      let type = rawConfigData[prop]['.type'];
      if (!type) continue;
      type = `@${type}`;

      if (!config[type]) config[type] = RxObject([]);
      config[type].push(RxObject(rawConfigData[prop], true));
    }

    return RxObject(config, false, {
      get: (target: IMap<IUciSectionData[]>, prop: string) => {
        // check if a type or a named section is being requested
        if (prop && prop.charAt(0) !== '@') {
          let result: IUciSectionData | undefined;
          // tslint:disable-next-line: forin
          for (const type in target) {
            result = target[type].find(sec => sec['.name'] === prop);
            if (result) return result;
          }
        }
        return target[prop];
      },
    });
  }

  getSchema(config: string, type?: string): Observable<ISchema | undefined> {
    return this.loadConfig(config).pipe(
      map(() => {
        if (!(config in this.schemas)) return undefined;
        const schema = <ISchemaObject>this.schemas[config];
        if (!type) return schema;
        type = type.charAt(0) === '@' ? type : `@${type}`;
        if (!schema.properties || !(type in schema.properties)) return undefined;

        return schema.properties[type];
      })
    );
  }
}
