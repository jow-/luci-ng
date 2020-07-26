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
  formatHuman,
  ROOT_EXPR_CONTEXT,
  SchemaUI,
  toHumanReadable,
} from 'rx-json-ui';
import { Observable, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { AppState, APP_STATE } from '../app.service';
import { CgiService } from '../shared/cgi.service';
import { ReconnectService } from '../shared/reconnect.service';
import { RxStore } from '../shared/store';
import { UbusService } from '../shared/ubus.service';
import { UciModel2 } from '../uci/uci';

import { APP_POPUP_OPTS, PopupDialogComponent } from './popup/popup.component';
export const rootContextProvider = {
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
      modules: {},
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
      store: new RxStore(),
      uciUI: (
        config: string,
        type?: string,
        sectionOrUiOrFilter?: number | SchemaUI | string | string[],
        uiOrFilter?: SchemaUI | string | string[],
        ui?: SchemaUI
      ) => {
        let filter: string | string[] | undefined;
        let bind = `uci.${config}`;
        if (type) bind += `['${type}']`;
        if (typeof sectionOrUiOrFilter === 'number') bind += `[${sectionOrUiOrFilter}]`;
        else if (
          typeof sectionOrUiOrFilter === 'string' ||
          Array.isArray(sectionOrUiOrFilter)
        )
          filter = sectionOrUiOrFilter;
        else if (typeof sectionOrUiOrFilter === 'object') ui = sectionOrUiOrFilter;

        if (typeof uiOrFilter === 'string' || Array.isArray(uiOrFilter))
          filter = uiOrFilter;
        else if (typeof uiOrFilter === 'object') ui = uiOrFilter;

        return uci.getSchema(config, type).pipe(
          map((schema: any) => {
            if (typeof sectionOrUiOrFilter === 'number') {
              if (Array.isArray(schema.items))
                schema =
                  sectionOrUiOrFilter < schema.items.length
                    ? schema.items[sectionOrUiOrFilter]
                    : schema.additionalItems;
              else schema = schema.items;
            }

            return buildUI(schema, bind, filter, ui);
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
      toHumanReadable,
      formatHuman,
    },
    undefined,
    true
  );
}
