/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';

/* Observable Debugger extension */

export function debug<T>(title: string): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) =>
    environment.production
      ? source
      : source.pipe(
          tap(
            // don't log in production
            d => console.log(title, 'next', d),
            e => console.log(title, 'error', e),
            () => console.log(title, 'complete')
          )
        );
}
