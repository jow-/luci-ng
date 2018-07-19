import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IWidgetDef } from 'reactive-json-form-ng';

@Injectable({
  providedIn: 'root'
})
export class ViewsResolverService implements Resolve<IWidgetDef> {

  constructor(private _http: HttpClient) { }

  resolve(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IWidgetDef> {

    return this._http.get<IWidgetDef>(`/views${state.url}.json`);
  }

}
