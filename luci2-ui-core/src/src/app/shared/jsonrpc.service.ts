/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, delay, map, retryWhen, scan } from 'rxjs/operators';

import { IJsonrpcRequest, IJsonrpcResponse } from './jsonrpc.interface';
import { debug } from './observable.debug';

export class JsonrpcRequest implements IJsonrpcRequest {
  private static _id = 0;

  jsonrpc = '2.0';
  id: number;

  constructor(public method: string, public params?: any[] | object) {
    this.id = ++JsonrpcRequest._id;
  }
}

/**
 * Service to handle raw jsonrpc calls
 * It is a thin wrapp over http calls handling the request/response formatting
 * It adds retry interceptors for http errors and jsonrpc errors
 */
// tslint:disable-next-line:max-classes-per-file
@Injectable({
  providedIn: 'root',
})
export class JsonrpcService {
  private static _headers = new HttpHeaders({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  private _url = '';
  private _retrayDelay = 2500;
  private _retryCount = 3;

  constructor(private _http: HttpClient) {}

  setUrl(url: string): void {
    this._url = url;
  }
  getUrl(): string {
    return this._url;
  }

  request(method: string, params?: any[] | object): Observable<any> {
    return this._post(new JsonrpcRequest(method, params));
  }
  /**
   * 	 * Wrapper arround Http post, to:
   * + set options
   * + add retry behaviour on http errors
   * + convert jsonrpc errors to rejections
   *
   * TODO: batch jsonrpc calls are not supported
   */
  private _post(reqData: any): Observable<IJsonrpcResponse> {
    if (!this._url) throw new Error('Jsonrpc: url not initialized');

    return (
      this._http
        .post<IJsonrpcResponse>(this._url, reqData, {
          headers: JsonrpcService._headers,
        })

        // retry on http errors a maximun of {_retryCount} times waiting {_retrayDelay} milliseconds
        .pipe(
          retryWhen(o =>
            o.pipe(
              scan((acc, e) => {
                if (acc >= this._retryCount) throw e;
                return ++acc;
              }, 0),
              delay(this._retrayDelay)
            )
          ),

          // rethrow http errors wrapped in IJsonrpcError format, to unify response
          catchError((e: HttpErrorResponse) => {
            throw {
              code: e.status,
              message: e.statusText,
              data: e.error,
              layer: 'http',
            };
          }),

          // check if there is an inner jsonrpc error to rethrow; if not emit result
          map((r: IJsonrpcResponse) => {
            if (r.error) throw { ...r.error, layer: 'jsonrpc' };
            return r.result;
          }),

          debug('jsonrpc')
        )
    );
  }
}
