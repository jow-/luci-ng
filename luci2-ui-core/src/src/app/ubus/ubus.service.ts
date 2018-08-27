/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap, retryWhen, tap } from 'rxjs/operators';

import { JsonrpcErrorCodes } from '../shared/jsonrpc.interface';
import { JsonrpcService } from '../shared/jsonrpc.service';
import { debug } from '../shared/observable.debug';
import { ILogin } from '../shell/login/ILogin.interface';
import { LoginComponent } from '../shell/login/login.component';

@Injectable()
export class UbusService implements ILogin {
  // TODO: check acls befor calling
  private _sid: string | undefined;
  private _dialogRef: MatDialogRef<LoginComponent> | undefined;

  private _user: BehaviorSubject<string>;

  constructor(
    private _jsonrpc: JsonrpcService,
    private _dialog: MatDialog,
    private _snackbar: MatSnackBar
  ) {
    this._jsonrpc.setUrl('/ubus');

    // reuse last saved session id
    this.sid = window.localStorage.getItem('ubus-sid') || '';

    this._user = new BehaviorSubject('');

    // TODO: test if session is ok and get current user
  }

  set sid(sid: string) {
    this._sid = /^[0-9a-fA-F]{32}$/.test(sid) ? sid : '00000000000000000000000000000000';
  }
  get sid(): string {
    return this._sid || '';
  }

  get user(): Observable<string> {
    return this._user.asObservable();
  }
  list(params: any): Observable<any[]> {
    return this._jsonrpc.request('list', params);
  }

  call<T>(
    service: string,
    method: string,
    params?: object,
    autologin: boolean = true
  ): Observable<T> {
    // cache params in object, so that SID can be changed later and be seen by resuscription holding a reference
    const jsonrpcParams = [this.sid, service, method, params || {}];
    return this._jsonrpc.request('call', jsonrpcParams).pipe(
      // all ubus calls return an array in the response in the form: [ status, response ]
      // for successfull responses (status=0) return directly the response
      // for errors throw corresponding error wrapped in IJsonrpcError
      map(r => {
        if (!Array.isArray(r)) throw { code: 0, message: 'Invalid response format', layer: 'js' };
        if (r[0] !== 0) throw { code: r[0], layer: 'ubus', data: r[1], message: r[0] };
        return r[1];
      }),
      debug('ubus pre retry'),
      // if there is "accessDenied" login and retry
      retryWhen(o =>
        o.pipe(
          mergeMap(
            e =>
              autologin && e.layer === 'jsonrpc' && e.code === JsonrpcErrorCodes.AccessDenied
                ? this.loginDialog().pipe(
                    tap(() => (jsonrpcParams[0] = this.sid)),
                    debug('loginDialog')
                  )
                : throwError(e)
          )
        )
      ),
      catchError(e => {
        this._snackbar.open(`Error calling ${service} ${method}: ${e.message}`, 'close', {
          duration: 5000,
        });
        throw e;
      }),

      debug('ubus')
    );
  }

  loginDialog(): Observable<any> {
    const opts: MatDialogConfig = {
      data: this,
      disableClose: true,
      hasBackdrop: true,
    };

    if (!this._dialogRef) this._dialogRef = this._dialog.open(LoginComponent, opts);

    return this._dialogRef.afterClosed().pipe(
      tap(() => {
        this._dialogRef = undefined;
      })
    );
  }

  login(user: string, password: string): Observable<any> {
    this.sid = ' '; // always call login with reseted SID
    return this.call<any>(
      'session',
      'login',
      { username: user, password, timeout: 900 },
      false
    ).pipe(
      map(s => {
        // save new token on successful login
        this.sid = s && s.ubus_rpc_session;
        window.localStorage.setItem('ubus-sid', this.sid);
        this._user.next(s && s.data && s.data.username);
        return this.sid;
      }),
      debug('login')
    );
  }
}
