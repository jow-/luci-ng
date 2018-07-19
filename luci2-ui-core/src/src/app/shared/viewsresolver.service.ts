import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { IWidgetDef } from '../widgets';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViewsResolverService implements Resolve<IWidgetDef> {

  constructor(private _http: HttpClient) { }

  resolve(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<IWidgetDef> {

    return this._http.get<IWidgetDef>(`/views${state.url}.json`);
  }

}
