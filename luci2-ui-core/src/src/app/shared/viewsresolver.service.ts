/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { AbstractWidgetDef } from 'rx-json-ui';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewsResolverService implements Resolve<AbstractWidgetDef> {
  constructor(private _http: HttpClient) {}

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<AbstractWidgetDef> {
    return this._http.get<AbstractWidgetDef>(`views/${route.data.view}.view.json`);
  }
}
