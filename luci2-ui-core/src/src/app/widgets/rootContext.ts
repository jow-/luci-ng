/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Context, ESpression, Expressions, ROOT_EXPR_CONTEXT } from 'reactive-json-form-ng';

import { UbusService } from '../ubus/ubus.service';

export const rootContextProvider = {
  // tslint:disable-line:naming-convention
  provide: ROOT_EXPR_CONTEXT,
  useFactory: rootContextFactory,
  deps: [UbusService, Expressions],
};

export function rootContextFactory(ubus: UbusService, expr: ESpression): Context {
  return Context.create(
    undefined,
    undefined,
    {
      ubus: ubus.call.bind(ubus),
      ubusList: ubus.list.bind(ubus),
      map: expr.mapFactory(),
      reduce: expr.reduceFactory(),
      $user: ubus.user,
    },
    undefined,
    true
  );
}
