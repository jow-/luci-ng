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
import { MaterialModule } from './material.module';
import { JsonrpcService } from './shared/jsonrpc.service';
import { ViewsResolverService } from './shared/viewsresolver.service';
import { MenuService } from './shell/menu/menu.service';
import { MenuGuardService } from './shell/menu/menuguard.service';
import { ShellModule } from './shell/shell.module';
import { UbusService } from './shared/ubus.service';
import { WidgetsModule } from './widgets';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ShellModule,
    RouterModule.forRoot([
      {
        path: '*',
        component: RoutedWidgetComponent,
        resolve: ViewsResolverService,
        canActivate: [MenuGuardService],
      },
    ]),
    WidgetsModule,

    UciModule,
    MaterialModule,
  ],
  providers: [JsonrpcService, UbusService, MenuService],
  entryComponents: [RoutedWidgetComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
