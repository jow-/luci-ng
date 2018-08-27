/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { IWidgetDef } from 'reactive-json-form-ng';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ViewsResolverService implements Resolve<IWidgetDef> {
  constructor(private _http: HttpClient) {}

  resolve(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IWidgetDef> {
    return this._http.get<IWidgetDef>(`/views${state.url}.json`);
  }
}
