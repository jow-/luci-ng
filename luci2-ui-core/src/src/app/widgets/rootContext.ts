/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

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
  return Context.create(
    undefined,
    undefined,
    {
      ubus: ubus.call.bind(ubus),
      ubusList: ubus.list.bind(ubus),
      map: expr.mapFactory(),
      reduce: expr.reduceFactory(),
      uci,
      $user: ubus.user,
    },
    undefined,
    true
  );
}
