/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

export interface IJsonrpcRequest {
  jsonrpc: string;
  method: string;
  params?: any[] | object;
  id?: string | number | null;
}

export interface IJsonrpcError {
  layer: 'http' | 'jsonrpc' | 'ubus';
  code: number;
  message: string;
  data: any;
}

export interface IJsonrpcResponse {
  jsonrpc: string;
  result?: any;
  error?: IJsonrpcError;
  id: string | number | null;
}

export enum JsonrpcErrorCodes {
  ParseError = -32700,
  InvalidRequest = -32600,
  NotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  AccessDenied = -32002,
  ServerErrorStart = -32099,
  ServerErrorEnd = -32000,
}
