/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { JsonrpcService } from './shared/jsonrpc.service';
import { MenuService } from './shell/menu/menu.service';
import { ShellModule } from './shell/shell.module';
import { UbusService } from './ubus/ubus.service';
import { UciModule } from './uci/module';
import { MaterialModule } from './material.module';
import { WidgetsModule, RoutedWidgetComponent } from './widgets';
import { ViewsResolverService } from './shared/viewsresolver.service';
import { MenuGuardService } from './shell/menu/menuguard.service';


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ShellModule,
    RouterModule.forRoot([{
      path: '*', component: RoutedWidgetComponent, resolve: ViewsResolverService,
      canActivate: [MenuGuardService]
    }]),
    WidgetsModule,

    UciModule,
    MaterialModule
  ],
  providers: [JsonrpcService, UbusService, MenuService],
  entryComponents: [ RoutedWidgetComponent ],
  bootstrap: [AppComponent]
})
export class AppModule { }
