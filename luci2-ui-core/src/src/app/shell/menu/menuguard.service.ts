/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MenuGuardService implements CanActivate {
  constructor(private _router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    // return this._menu.loadMenu().pipe(
    //   map( _ => (this._router.navigateByUrl( _state.url), false))
    // );
    console.log(this._router.navigated);

    console.log('guard', _route, _state);
    return false;
  }
}
