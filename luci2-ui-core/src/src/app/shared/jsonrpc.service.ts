/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import './observable.debug';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/catch';

import { Injectable } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { IJsonrpcRequest, IJsonrpcResponse } from './jsonrpc.interface';


export class JsonrpcRequest implements IJsonrpcRequest {
  private static _id = 0;

  jsonrpc = '2.0';
  id: number;

  constructor(public method: string, public params?: Array<any> | object) {
    this.id = ++JsonrpcRequest._id;
  }
}

/**
 * Service to handle raw jsonrpc calls
 * It is a thin wrapp over http calls handling the request/response formatting
 * It adds retry interceptors for http errors and jsonrpc errors
 */
@Injectable()
export class JsonrpcService {
  private static _headers = new Headers({ 'Accept': 'application/json', 'Content-Type': 'application/json' });

  private _url = '';
  private _retrayDelay = 2500;
  private _retryCount = 3;


  constructor(private _http: Http) { }

  setUrl(url: string) { this._url = url; }
  getUrl() { return this._url; }

  request(method: string, params?: Array<any> | Object): Observable<any> {

    return this._post(new JsonrpcRequest(method, params));
  }

  /**
	 * Wrapper arround Http post, to:
	 * + set options
	 * + add retry behaviour on http errors
	 * + convert jsonrpc errors to rejections
	 *
	 * TODO: batch jsonrpc calls are not supported
	 *
	 */
  private _post(reqData: any): Observable<IJsonrpcResponse> {

    if (!this._url) throw new Error('Jsonrpc: url not initialized');


    return this._http.post(this._url, reqData, { headers: JsonrpcService._headers })

      // retry on http errors a maximun of {_retryCount} times waiting {_retrayDelay} milliseconds
      .retryWhen(o => o
        .scan((acc, e) => {
          if (acc >= this._retryCount) throw e;
          return ++acc;
        }, 0)
        .delay(this._retrayDelay)
      )

      // rethrow http errors wrapped in IJsonrpcError format, to unify response
      .catch((e: Response) => {
        throw { code: e.status, message: e.statusText, data: e.text(), layer: 'http' };
      })

      // check if there is an inner jsonrpc error to rethrow; if not emit result
      .map((r: Response) => {
        const respData = r.json() || {};

        if (respData.error) throw { ...respData.error, layer: 'jsonrpc' };
        return respData.result;
      })

      .debug('jsonrpc');

  }

}
