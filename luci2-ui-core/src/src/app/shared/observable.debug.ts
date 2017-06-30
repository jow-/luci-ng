/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Observable } from 'rxjs/Observable';
import { environment } from './../../environments/environment';



/* Observable Debugger extension */

declare module 'rxjs/Observable' {
// tslint:disable-next-line:naming-convention no-shadowed-variable
interface Observable<T> {
  debug: (label: string) => Observable<T>;
}
}

Observable.prototype.debug = function(title: string): Observable<any> {
  // tslint:disable-next-line: no-invalid-this
  return environment.production ? this : this.do( // don't log in production
    d => console.log(title, 'next', d),
    e => console.log(title, 'error', e),
    () => console.log(title, 'complete')
  );
};
