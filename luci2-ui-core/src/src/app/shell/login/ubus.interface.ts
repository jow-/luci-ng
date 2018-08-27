/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

export interface IUbusAcls {
  'access-group': { group: string[] };
}

export interface IUbusSession {
  acls: IUbusAcls;
  data: { username: string };
  expires: number;
  timeout: number;
  ubus_rpc_session: string;
}
