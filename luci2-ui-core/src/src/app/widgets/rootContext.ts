
/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ROOT_EXPR_CONTEXT, Context, Expressions, ESpression } from 'reactive-json-form-ng';
import { UbusService } from '../ubus/ubus.service';

export const rootContextProvider = { // tslint:disable-line:naming-convention
  provide: ROOT_EXPR_CONTEXT,
  useFactory: rootContextFactory,
  deps: [UbusService, Expressions]
};

export function rootContextFactory(ubus: UbusService, expr: ESpression) {
  return Context.create(null, null, {
    ubus: ubus.call.bind(ubus),
    ubusList: ubus.list.bind(ubus),
    map: expr.mapFactory(),
    reduce: expr.reduceFactory(),
    $user: ubus.user
  }, null, true);
}
