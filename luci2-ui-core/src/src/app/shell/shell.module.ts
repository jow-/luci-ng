/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { MenuService } from './menu/menu.service';
import { LoginComponent } from './login/login.component';
import { NavItemComponent } from './nav-menu/nav-item.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { ShellComponent } from './shell/shell.component';
import { MaterialModule } from '../material.module';
import { UciModule } from '../uci/module';
import { WidgetsModule } from '../widgets';


/**
 * ShellModule
 *
 * This module groups all components and services used to build the application's shell:
 * Menu navigation - Breadcrumbs - Top buttons bar - Log in services, etc
 * It is intended to be agnostic of a specific application and serve as a generic template
 *
*/
@NgModule({
  imports: [
    RouterModule,
    BrowserAnimationsModule,
    RouterModule,

    WidgetsModule,

    MaterialModule,
    UciModule
  ],
  declarations: [
    ShellComponent,
    NavMenuComponent,
    NavItemComponent,
    LoginComponent
  ],
  exports: [
    ShellComponent,
  ],
  providers: [
    MenuService
  ],
  entryComponents: [LoginComponent]
})
export class ShellModule {
}

