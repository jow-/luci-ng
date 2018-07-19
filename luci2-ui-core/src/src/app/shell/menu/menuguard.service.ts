import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MenuGuardService implements CanActivate {

  constructor(private _router: Router) { }

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    // return this._menu.loadMenu().pipe(
    //   map( _ => (this._router.navigateByUrl( _state.url), false))
    // );
    console.log(this._router.navigated);

    console.log('guard', _route, _state);
    return false;
  }

}
