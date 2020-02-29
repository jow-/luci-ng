/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { AbstractWidgetDef } from 'rx-json-ui';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { UbusService } from './ubus.service';

@Injectable({
  providedIn: 'root',
})
export class ViewsResolverService implements Resolve<AbstractWidgetDef> {
  constructor(private ubus: UbusService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<AbstractWidgetDef> {
    return this.ubus
      .loadView(`${route.data.view}.view.json`)
      .pipe(map((v: AbstractWidgetDef[]) => v[0]));
  }
}
