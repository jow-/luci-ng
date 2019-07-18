/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'reactive-json-form-ng';

import { WidgetsModule } from '../widgets';

import { LoginComponent } from './login/login.component';
import { MenuService } from './menu/menu.service';
import { NavItemComponent } from './nav-menu/nav-item.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { ShellComponent } from './shell/shell.component';

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
    FormsModule,
    RouterModule,
    WidgetsModule,
    MaterialModule,
    MatSidenavModule,
  ],
  declarations: [ShellComponent, NavMenuComponent, NavItemComponent, LoginComponent],
  exports: [ShellComponent],
  providers: [MenuService],
  entryComponents: [LoginComponent],
})
export class ShellModule {}
