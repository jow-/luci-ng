/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class MenuGuardService implements CanActivate {
  constructor(private _router: Router, private _menuService: MenuService) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean> {
    // load menu definitions and routes, and renavigate
    return this._menuService
      .loadMenu()
      .pipe(map(_ => (this._router.navigateByUrl(_state.url), false)));
  }
}
