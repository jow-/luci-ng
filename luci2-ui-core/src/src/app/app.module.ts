/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { RoutedWidgetComponent } from 'reactive-json-form-ng';

import { AppComponent } from './app.component';
import { JsonrpcService } from './shared/jsonrpc.service';
import { UbusService } from './shared/ubus.service';
import { ViewsResolverService } from './shared/viewsresolver.service';
import { MenuService } from './shell/menu/menu.service';
import { MenuGuardService } from './shell/menu/menuguard.service';
import { ShellModule } from './shell/shell.module';
import { WidgetsModule } from './widgets';

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
      { enableTracing: false, useHash: true }
    ),
    WidgetsModule,
  ],
  providers: [JsonrpcService, UbusService, MenuService],
  entryComponents: [RoutedWidgetComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
