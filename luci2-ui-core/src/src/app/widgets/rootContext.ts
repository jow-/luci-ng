/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material';
import { JsonPath } from 'espression-jsonpath';
import { RxObject } from 'espression-rx';
import { Context, ESpression, Expressions, ROOT_EXPR_CONTEXT } from 'reactive-json-form-ng';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

import { UbusService } from '../shared/ubus.service';
import { UciModel2 } from '../uci/uci';

export const rootContextProvider = {
  // tslint:disable-line:naming-convention
  provide: ROOT_EXPR_CONTEXT,
  useFactory: rootContextFactory,
  deps: [UbusService, Expressions, UciModel2, HttpClient, MatSnackBar],
};

export function rootContextFactory(
  ubus: UbusService,
  expr: ESpression,
  uci: UciModel2,
  http: HttpClient,
  snackbar: MatSnackBar
): Context {
  const jsonPath = new JsonPath();
  return Context.create(
    undefined,
    undefined,
    {
      ubus: ubus.callFactory(),
      ubusList: ubus.list.bind(ubus),
      map: expr.mapFactory(),
      reduce: expr.reduceFactory(),
      uci,
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
      RxObject,
      $tmp: RxObject({}),
    },
    undefined,
    true
  );
}
