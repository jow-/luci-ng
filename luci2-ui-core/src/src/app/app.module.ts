/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { RxObject } from 'espression-rx';
import { RoutedWidgetComponent } from 'rx-json-ui';

import { AppComponent } from './app.component';
import { APP_STATE } from './app.service';
import { ViewsResolverService } from './shared/viewsresolver.service';
import { MenuGuardService } from './shell/menu/menuguard.service';
import { ShellModule } from './shell/shell.module';
import { WidgetsModule } from './widgets';

const appState = RxObject({});

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ShellModule,
    RouterModule.forRoot(
      [
        {
          path: '**', // initial wildcard route, will be replaced on menu load
          component: RoutedWidgetComponent,
          resolve: ViewsResolverService,
          canActivate: [MenuGuardService],
        },
      ],
      { enableTracing: false, useHash: false }
    ),
    WidgetsModule,
  ],
  providers: [
    {
      provide: APP_STATE,
      useValue: appState,
    },
  ],
  entryComponents: [RoutedWidgetComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
