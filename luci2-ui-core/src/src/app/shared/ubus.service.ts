/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

/* eslint-disable no-throw-literal */

import { Inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonPath } from 'espression-jsonpath';
import { GET_OBSERVABLE } from 'espression-rx';
import { isObservable, Observable, of, throwError } from 'rxjs';
import {
  catchError,
  delay,
  filter,
  map,
  repeatWhen,
  retryWhen,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import { AppState, APP_STATE } from '../app.service';
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
  'Resource not found', // UBUS_STATUS_NOT_FOUND,
  'No data received', // UBUS_STATUS_NO_DATA,
  'Permission denied', // UBUS_STATUS_PERMISSION_DENIED,
  'Request timeout', // UBUS_STATUS_TIMEOUT,
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

  private _jsPath = new JsonPath();

  private _viewCache = new Map<string, any[]>();

  constructor(
    @Inject(APP_STATE) private _appState: AppState,
    private _jsonrpc: JsonrpcService,
    private _dialog: MatDialog,
    private _snackbar: MatSnackBar
  ) {
    this._jsonrpc.setUrl('/ubus');

    this._appState.pollState = true;

    // try reuse last saved session id
    this.sid = window.localStorage.getItem('ubus-sid') || '';

    // check if still valid and retrieve username (login if necessary)
    this.call('session', 'get', undefined, true, { all: {} })
      .pipe(map((session: any) => (this._appState.userName = session?.values?.username)))
      .subscribe();
  }

  set sid(sid: string) {
    this._sid = /^[0-9a-fA-F]{32}$/.test(sid) ? sid : '00000000000000000000000000000000';
    window.localStorage.setItem('ubus-sid', this._sid);
  }
  get sid(): string {
    return this._sid || '';
  }

  list(params: any): Observable<any[]> {
    return this._jsonrpc.request('list', params);
  }

  call<T>(
    service: string,
    method: string,
    params?: object,
    autologin: boolean = true,
    returnError?: { [code: number]: any; all?: any } | ((e: any) => any)
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
          switchMap((outerError) => {
            if (
              autologin &&
              outerError.layer === 'jsonrpc' &&
              outerError.code === JsonrpcErrorCodes.AccessDenied
            ) {
              // check if session expired or just insufficient privileges
              return this.call('session', 'get', undefined, false).pipe(
                map((s: any) => {
                  // if we are here with a username it was a valid session with really permission problems
                  outerError.accessDenied = !!s.values.username;
                  console.log('AccessDenied');
                  throw outerError;
                }),
                catchError((innerError) => {
                  console.log('innerError', innerError);
                  if (innerError.accessDenied) {
                    delete innerError.accessDenied;
                    return throwError(innerError);
                  }
                  return this.loginDialog().pipe(
                    tap(() => (jsonrpcParams[0] = this.sid))
                  );
                })
              );
            } else return throwError(outerError);
          })
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
        if (
          autologin ||
          e.layer !== 'jsonrpc' ||
          e.code !== JsonrpcErrorCodes.AccessDenied
        )
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
      closeOnNavigation: false,
      panelClass: 'login-dialog',
      maxHeight: '100vh',
      maxWidth: '100vw',
    };

    if (!this._dialogRef) this._dialogRef = this._dialog.open(LoginComponent, opts);

    return this._dialogRef.afterClosed().pipe(
      tap(() => {
        this._dialogRef = undefined;
      })
    );
  }

  login(user: string, password: string): Observable<any> {
    this.sid = ' '; // always call login with reset SID
    return this.call<any>(
      'session',
      'login',
      { username: user, password, timeout: 900 },
      false
    ).pipe(
      map((s) => {
        // save new token on successful login
        if (!s || !s.data) return '';

        this.sid = s.ubus_rpc_session;
        this._appState.userName = s.data.username;
        return this.sid;
      }),
      debug('login')
    );
  }

  logout(): Observable<null> {
    return this.call<null>('session', 'destroy', undefined, false).pipe(
      map(() => {
        this.sid = '';
        window.localStorage.removeItem('ubus-sid');
        this._appState.userName = '';
        return null;
      })
    );
  }

  loadView(glob: string): Observable<any[]> {
    // first try to reuse cache
    const view = this._viewCache.get(glob);
    if (view) return of(view);

    return this.call<{ content?: any[] }>('luci2.file', 'read_json', {
      glob: `/usr/share/rpcd/luci2/views/${glob}`,
    }).pipe(
      map(({ content }) => {
        content = content || [];
        this._viewCache.set(glob, content);
        return content;
      })
    );
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
        result = result.pipe(
          repeatWhen((o) =>
            o.pipe(
              delay(repeatDelay as number),
              switchMap(() =>
                this._appState[GET_OBSERVABLE]('pollState').pipe(
                  filter((s) => s),
                  take(1)
                )
              )
            )
          )
        );
      if (jsPathFilter && typeof jsPathFilter === 'string')
        result = result.pipe(
          map((res) => this._jsPath.query(res, jsPathFilter as string).values)
        );

      return result.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    };
  }
}
