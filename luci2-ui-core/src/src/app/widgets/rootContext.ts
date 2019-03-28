/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { JsonPath } from 'espression-jsonpath';
import { RxObject } from 'espression-rx';
import { Context, ESpression, Expressions, ROOT_EXPR_CONTEXT } from 'reactive-json-form-ng';

import { UbusService } from '../shared/ubus.service';
import { UciModel2 } from '../uci/uci';

export const rootContextProvider = {
  // tslint:disable-line:naming-convention
  provide: ROOT_EXPR_CONTEXT,
  useFactory: rootContextFactory,
  deps: [UbusService, Expressions, UciModel2],
};

export function rootContextFactory(ubus: UbusService, expr: ESpression, uci: UciModel2): Context {
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
      RxObject,
      $tmp: RxObject({}),
    },
    undefined,
    true
  );
}
