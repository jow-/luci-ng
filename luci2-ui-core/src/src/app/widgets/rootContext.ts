/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonPath } from 'espression-jsonpath';
import { RxObject } from 'espression-rx';
import {
  buildUI,
  Context,
  ESpression,
  Expressions,
  ROOT_EXPR_CONTEXT,
  SchemaArray,
} from 'rx-json-ui';
import { Observable, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { CgiService } from '../shared/cgi.service';
import { UbusService } from '../shared/ubus.service';
import { UciModel2 } from '../uci/uci';

import { PopupDialogComponent } from './popup/popup.component';

export const rootContextProvider = {
  // tslint:disable-line:naming-convention
  provide: ROOT_EXPR_CONTEXT,
  useFactory: rootContextFactory,
  deps: [
    UbusService,
    Expressions,
    UciModel2,
    HttpClient,
    MatSnackBar,
    MatDialog,
    CgiService,
  ],
};

export function rootContextFactory(
  ubus: UbusService,
  expr: ESpression,
  uci: UciModel2,
  http: HttpClient,
  snackbar: MatSnackBar,
  dialog: MatDialog,
  cgi: CgiService
): Context {
  const jsonPath = new JsonPath();
  return Context.create(
    undefined,
    undefined,
    {
      console,
      ubus: ubus.callFactory(),
      ubusList: ubus.list.bind(ubus),
      map: expr.mapFactory(),
      reduce: expr.reduceFactory(),
      uci: { configs: uci.configs, loadConfig: uci.loadConfig.bind(uci) },
      cgi,
      $user: ubus.user,
      jsonPath: (obj: object, path: string) => jsonPath.query(obj, path).values,
      load: (url: string) => http.get(url).pipe(catchError(() => of(undefined))),
      snackbar(message: string, action: string, onAction: string): true {
        // use 'funtion' to have 'this' as the calling context

        const snack = snackbar.open(message, action, { duration: 5000 });
        if (onAction)
          snack.onAction().subscribe(() => {
            expr
              .eval(onAction, this, true) // tslint:disable-line: no-invalid-this
              .pipe(take(1))
              .subscribe();
          });

        return true;
      },
      popupMsg(
        message: string,
        cancelLabel?: string | boolean,
        okLabel?: string
      ): Observable<boolean> {
        // use 'funtion' to have 'this' as the calling context
        if (!okLabel) okLabel = 'OK';
        if (cancelLabel === true) cancelLabel = 'Cancel';

        return dialog
          .open(PopupDialogComponent, {
            data: { message, okLabel, cancelLabel },
          })
          .afterClosed();
      },
      RxObject,
      $tmp: RxObject({}),
      buildUI,
      uciUI: (
        config: string,
        type?: string,
        section?: number,
        options?:
          | string
          | string[]
          | { include?: string[]; exclude?: string[]; wrapForm?: boolean }
      ) => {
        let opt: {
          include?: string[];
          exclude?: string[];
          wrapForm?: boolean;
        } = {};

        if (typeof options === 'string' && options) opt = { include: [options] };
        else if (Array.isArray(options)) opt = { include: options };
        else if (typeof options === 'object') opt = options;

        return uci.getSchema(config, type).pipe(
          map((schema: any) => {
            if (!opt.include) {
              switch (schema.type) {
                case 'object':
                  opt.include = Object.keys(schema.properties);
                  break;
                case 'array':
                  opt.include = Object.keys(schema.items.properties);
                  break;
                default:
                  opt.include = [];
              }

              if (opt.exclude)
                opt.include = opt.include!.filter(key => !opt.exclude!.includes(key));
            }
            if (typeof section === 'number') {
              schema = (<SchemaArray>schema).items;

              if (opt.wrapForm)
                return buildUI(schema, `uci.configs.${config}['${type}'][${section}]`);
              else
                return opt.include!.map(key =>
                  buildUI(
                    schema.properties[key],
                    `uci.configs.${config}['${type}'][${section}].${key}`
                  )
                );
            }
            return type
              ? buildUI(schema, `uci.configs.${config}['${type}']`)
              : buildUI(schema, `uci.configs.${config}`);
          })
        );
      },
    },
    undefined,
    true
  );
}
