/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Injectable, Injector } from '@angular/core';
import {
  Expressions,
  loadSchema,
  ROOT_EXPR_CONTEXT,
  Schema,
  SchemaObject,
} from 'rx-json-ui';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { UbusService } from '../../shared/ubus.service';

import {
  IUciAddSectionParam,
  IUciAddSectionRet,
  IUciDeleteParam,
  IUciSetParam,
} from './actions.interface';
import { IUciConfigData } from './config.interface';

@Injectable({
  providedIn: 'root',
})
export class UciService {
  constructor(
    private _ubus: UbusService,
    private _expr: Expressions,
    private _injector: Injector
  ) {}

  getConfig(config: string): Observable<[IUciConfigData, SchemaObject]> {
    // delayed injection to avoid circular dependency
    const rootContext = this._injector.get(ROOT_EXPR_CONTEXT);

    return forkJoin([
      this._ubus
        .call<IUciConfigData>('uci', 'get', { config })
        .pipe(map((r) => (r && r.values) || {})),

      loadSchema(
        `${config}.json`,
        this.loadSchema.bind(this),
        undefined,
        this._expr,
        rootContext
      ).pipe(
        map((schemas) =>
          schemas.length
            ? (schemas[0] as SchemaObject)
            : ({ type: 'object' } as SchemaObject)
        )
      ),
    ]);
  }

  loadSchema(path: string, _id?: string): Observable<Schema | Schema[]> {
    // TODO: add cache?
    return this._ubus
      .call<{ content: any[] }>('luci2.file', 'read_json', {
        glob: `/usr/share/rpcd/luci2/uci/${path}`,
      })
      .pipe(
        map((res) => res?.content ?? []),
        catchError(() => of([]))
      );
  }

  /** Adds a section and returns its name, or empty string on error */
  addSection(param: IUciAddSectionParam): Observable<string> {
    return this._ubus
      .call<IUciAddSectionRet>('uci', 'add', param)
      .pipe(map((r) => (r && r.section) || ''));
  }

  set(param: IUciSetParam): Observable<null> {
    return this._ubus.call('uci', 'set', param);
  }

  delete(param: IUciDeleteParam): Observable<null> {
    return this._ubus.call('uci', 'delete', param);
  }

  apply(): Observable<null> {
    return this._ubus.call('uci', 'apply', { rollback: true });
  }
  commit(config: string): Observable<null> {
    return this._ubus.call('uci', 'commit', { config });
  }

  changes(config: string): Observable<null> {
    return this._ubus.call('uci', 'changes', { config });
  }
}
