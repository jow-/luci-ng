/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { LocationStrategy } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { AbstractWidgetDef, Context, ROOT_EXPR_CONTEXT } from 'rx-json-ui';
import { forkJoin, from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { UbusService } from './ubus.service';

@Injectable({
  providedIn: 'root',
})
export class ViewsResolverService implements Resolve<AbstractWidgetDef> {
  constructor(
    private ubus: UbusService,
    private location: LocationStrategy,
    @Inject(ROOT_EXPR_CONTEXT) private rootContext: Context
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<AbstractWidgetDef> {
    // wait for view and module, but only pass on the view
    return forkJoin([
      this.ubus.loadView(`${route.data.view}.view.json`),
      this.loadModule(route.data.module),
    ]).pipe(map(([v]: [AbstractWidgetDef[], boolean]) => v[0]));
  }

  /** Dynamically loads a module and stores it in the `rootContext.modules`  */
  loadModule(moduleName: string): Observable<boolean> {
    if (!moduleName) return of(false);
    // don't reload the same module
    if (this.rootContext.modules[moduleName]) return of(true);
    const baseHref = this.location.getBaseHref();
    return from(
      import(/* webpackIgnore: true */ `${baseHref}assets/modules/${moduleName}.js`)
    ).pipe(
      map((module) => {
        if (module) this.rootContext.modules[moduleName] = module;
        return true;
      })
    );
  }
}
