/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Observable } from 'rxjs';

export interface ILogin {
  login(username: string, password: string): Observable<any>;
}
