/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonPath } from 'espression-jsonpath';
import { BehaviorSubject, isObservable, Observable, of, throwError } from 'rxjs';
import {
  catchError,
  delay,
  map,
  mergeMap,
  repeatWhen,
  retryWhen,
  shareReplay,
  tap,
} from 'rxjs/operators';

import { ILogin } from '../shell/login/ILogin.interface';
import { LoginComponent } from '../shell/login/login.component';

import { JsonrpcErrorCodes } from './jsonrpc.interface';
import { JsonrpcService } from './jsonrpc.service';
import { debug } from './observable.debug';

const UBUS_ERRORS = [
  'OK', // UBUS_STATUS_OK,
  'Invalid command', // UBUS_STATUS_INVALID_COMMAND,
  'Invalid argument', // UBUS_STATUS_INVALID_ARGUMENT,
  'Method not found', // UBUS_STATUS_METHOD_NOT_FOUND,
  'Not found', // UBUS_STATUS_NOT_FOUND,
  'No data', // UBUS_STATUS_NO_DATA,
  'Permission denied', // UBUS_STATUS_PERMISSION_DENIED,
  'Timeout', // UBUS_STATUS_TIMEOUT,
  'Not supported', // UBUS_STATUS_NOT_SUPPORTED,
  'Unknown error', // UBUS_STATUS_UNKNOWN_ERROR,
  'Connection failed', // UBUS_STATUS_CONNECTION_FAILED,
];

@Injectable({
  providedIn: 'root',
})
export class UbusService implements ILogin {
  // TODO: check acls before calling
  private _sid: string | undefined;
  private _dialogRef: MatDialogRef<LoginComponent> | undefined;

  private _user: BehaviorSubject<string>;

  private _jsPath = new JsonPath();

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
    autologin: boolean = true,
    // tslint:disable-next-line: ban-types
    returnError?: { [code: number]: any } | Function
  ): Observable<T> {
    // cache params in object, so that SID can be changed later and be seen by resubscription holding a reference
    const jsonrpcParams = [this.sid, service, method, params || {}];
    return this._jsonrpc.request('call', jsonrpcParams).pipe(
      // all ubus calls return an array in the response in the form: [ status, response ]
      // for successful responses (status=0) return directly the response
      // for errors throw corresponding error wrapped in IJsonrpcError
      map((r) => {
        if (!Array.isArray(r))
          throw { code: 0, message: 'Invalid response format', layer: 'js' };
        if (r[0] !== 0)
          throw {
            code: r[0],
            layer: 'ubus',
            data: r[1],
            message: `${r[0]} - ${UBUS_ERRORS[r[0]] || ''}`,
          };
        return r.length > 1 ? r[1] : null;
      }),
      // if there is "accessDenied" login and retry
      retryWhen((o) =>
        o.pipe(
          mergeMap((e) =>
            autologin &&
            e.layer === 'jsonrpc' &&
            e.code === JsonrpcErrorCodes.AccessDenied
              ? this.loginDialog().pipe(
                  tap(() => (jsonrpcParams[0] = this.sid)),
                  debug('loginDialog')
                )
              : throwError(e)
          )
        )
      ),
      catchError((e) => {
        if (
          typeof returnError === 'object' &&
          (e.code in returnError || 'all' in returnError)
        ) {
          let ret = returnError[e.code in returnError ? e.code : 'all'];
          if (typeof ret === 'function') ret = ret(e);
          return isObservable(ret) ? ret : of(ret);
        } else if (typeof returnError === 'function') {
          const ret = returnError(e);
          return isObservable(ret) ? ret : of(ret);
        }
        this._snackbar.open(
          `Error calling ubus "${service} ${method}": ${e.message}`,
          'close',
          {
            duration: 5000,
          }
        );
        return throwError(e);
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
    this.sid = ' '; // always call login with resete SID
    return this.call<any>(
      'session',
      'login',
      { username: user, password, timeout: 900 },
      false
    ).pipe(
      map((s) => {
        // save new token on successful login
        this.sid = s && s.ubus_rpc_session;
        window.localStorage.setItem('ubus-sid', this.sid);
        this._user.next(s && s.data && s.data.username);
        return this.sid;
      }),
      debug('login')
    );
  }

  loadView(glob: string): Observable<[]> {
    return this.call('luci2.file', 'read_json', {
      glob: `/usr/share/rpcd/luci2/views/${glob}`,
    }).pipe(map((res: any) => res?.content || []));
  }
  callFactory(): (
    service: string,
    method: string,
    params?: object | string | number,
    jsPathFilter?: string | number | { [code: number]: string },
    repeatDelay?: number | { [code: number]: string },
    errorVal?: { [code: number]: string }
  ) => Observable<any> {
    return (
      service: string,
      method: string,
      params?: object | string | number,
      jsPathFilter?: string | number | { [code: number]: string },
      repeatDelay?: number | { [code: number]: string },
      errorVal?: { [code: number]: string }
    ) => {
      if (typeof repeatDelay === 'object' || typeof repeatDelay === 'function') {
        errorVal = repeatDelay;
        repeatDelay = undefined;
      }
      if (typeof jsPathFilter === 'number') {
        repeatDelay = jsPathFilter;
        jsPathFilter = undefined;
      } else if (typeof jsPathFilter === 'object' || typeof jsPathFilter === 'function') {
        errorVal = jsPathFilter;
        jsPathFilter = undefined;
      }

      if (typeof params === 'string') {
        jsPathFilter = params;
        params = undefined;
      } else if (typeof params === 'number') {
        repeatDelay = params;
        params = undefined;
        jsPathFilter = undefined;
      }

      let result = this.call<any>(service, method, params, true, errorVal);

      if (repeatDelay && typeof repeatDelay === 'number')
        result = result.pipe(repeatWhen((o) => o.pipe(delay(<number>repeatDelay))));
      if (jsPathFilter && typeof jsPathFilter === 'string')
        result = result.pipe(
          map((res) => this._jsPath.query(res, <string>jsPathFilter).values)
        );

      return result.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    };
  }
}
