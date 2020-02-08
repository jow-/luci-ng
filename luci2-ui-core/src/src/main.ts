/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { enableProdMode } from '@angular/core';
import { platformBrowser } from '@angular/platform-browser';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// check if the browser supports 'Proxy'

if (typeof Proxy !== 'function') {
  const app = document.querySelector('#approot') as HTMLDivElement;
  if (app) app.style.display = 'none';

  const legacy = document.querySelector('#legacy') as HTMLDivElement;
  if (legacy) legacy.style.display = 'block';
} else {
  platformBrowser().bootstrapModule(AppModule);
}
