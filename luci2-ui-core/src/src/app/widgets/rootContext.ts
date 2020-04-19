/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { formatDate, formatNumber } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonPath } from 'espression-jsonpath';
import { GET_OBSERVABLE, RxObject } from 'espression-rx';
import {
  buildUI,
  Context,
  ESpression,
  Expressions,
  formatDuration,
  ROOT_EXPR_CONTEXT,
  SchemaArray,
} from 'rx-json-ui';
import { Observable, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { AppState, APP_STATE } from '../app.service';
import { CgiService } from '../shared/cgi.service';
import { ReconnectService } from '../shared/reconnect.service';
import { UbusService } from '../shared/ubus.service';
import { UciModel2 } from '../uci/uci';

import { APP_POPUP_OPTS, PopupDialogComponent } from './popup/popup.component';
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
    ReconnectService,
    APP_STATE,
  ],
};

export function rootContextFactory(
  ubus: UbusService,
  expr: ESpression,
  uci: UciModel2,
  http: HttpClient,
  snackbar: MatSnackBar,
  dialog: MatDialog,
  cgi: CgiService,
  reconnect: ReconnectService,
  appSate: AppState
): Context {
  const jsonPath = new JsonPath();
  return Context.create(
    undefined,
    undefined,
    {
      console,
      ubus: ubus.callFactory(),
      ubusList: ubus.list.bind(ubus),
      uci: uci.configs,
      uciLoad: uci.loadConfig.bind(uci),
      cgi,
      $user: appSate[GET_OBSERVABLE]('userName'),
      jsonPath: (obj: object, path: string) => jsonPath.query(obj, path).values,
      load: (url: string) => http.get(url).pipe(catchError(() => of(undefined))),
      loadView: (glob: string) =>
        ubus
          .loadView(glob)
          .pipe(
            map((c: any[]) =>
              c.reduce((ac, e) => (Array.isArray(e) ? ac.concat(...e) : ac.concat(e)), [])
            )
          ),
      snackbar(message: string, action: string, onAction: string | (() => any)): true {
        // use 'function' to have 'this' as the calling context

        const snack = snackbar.open(message, action, { duration: 5000 });
        if (onAction)
          snack.onAction().subscribe(() => {
            if (typeof onAction === 'string')
              expr
                .eval(onAction, this, true) // tslint:disable-line: no-invalid-this
                .pipe(take(1))
                .subscribe();
            else if (typeof onAction === 'function') onAction();
          });

        return true;
      },
      popupMsg(
        message: string,
        cancelLabel?: string | boolean,
        okLabel?: string
      ): Observable<boolean> {
        // use 'function' to have 'this' as the calling context
        if (!okLabel) okLabel = 'OK';
        if (cancelLabel === true) cancelLabel = 'Cancel';

        return dialog
          .open(PopupDialogComponent, {
            ...APP_POPUP_OPTS,

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
                opt.include = opt.include!.filter((key) => !opt.exclude!.includes(key));
            }
            if (typeof section === 'number') {
              schema = (<SchemaArray>schema).items;

              if (opt.wrapForm)
                return buildUI(schema, `uci.${config}['${type}'][${section}]`);
              else
                return opt.include!.map((key) =>
                  buildUI(
                    schema.properties[key],
                    `uci.${config}['${type}'][${section}].${key}`
                  )
                );
            }
            return type
              ? buildUI(schema, `uci.${config}['${type}']`)
              : buildUI(schema, `uci.${config}`);
          })
        );
      },
      eval(expression: string, context?: object): any {
        // evaluate in provided context or in the context of the call
        let result: any;
        try {
          result = expr.eval(expression, context || this); // tslint:disable-line: no-invalid-this
        } catch (e) {
          return undefined;
        }

        return result;
      },
      formatDuration,
      formatDate: (
        value: string | number | Date,
        format: string,
        tz: string | undefined
      ) => formatDate(value, format, 'en-us', tz),
      formatNumber: (value: number, digits: string | undefined) =>
        formatNumber(value, 'en-us', digits),
      reconnect: reconnect.reconnect.bind(reconnect),
    },
    undefined,
    true
  );
}
