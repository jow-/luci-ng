/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { Routes } from '@angular/router/router';

import { AppComponent } from './app.component';
import { StatusComponent } from './plugins/status/status.component';
import { UbusViewerComponent } from './plugins/ubusViewer/ubusViewer.component';
import { UciEditorComponent } from './plugins/uciEditor/uciEditor.component';
import { JsonrpcService } from './shared/jsonrpc.service';
import { MenuService } from './shell/menu/menu.service';
import { ShellModule } from './shell/shell.module';
import { UbusDirective } from './ubus/ubus.directive';
import { UbusService } from './ubus/ubus.service';
import { StatsComponent } from './widgets/stats/stats.component';
import { UciModule } from 'app/uci/module';
import { MaterialModule } from './material.module';

const routes: Routes = [
  { path: 'status', component: StatusComponent },
  { path: 'system', component: UbusViewerComponent },
  { path: 'network', component: UciEditorComponent },
  { path: '', redirectTo: '/status', pathMatch: 'full' },
];

@NgModule({
  declarations: [
    AppComponent,
    UbusDirective,

    StatusComponent,
    UbusViewerComponent,
    StatsComponent,
    UciEditorComponent


  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ShellModule,
    RouterModule.forRoot(routes),

    UciModule,
    MaterialModule
  ],
  providers: [JsonrpcService, UbusService, MenuService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
