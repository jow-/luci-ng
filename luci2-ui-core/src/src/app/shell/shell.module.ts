/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MediaQueriesModule } from '@angular/flex-layout/media-query/_module';
import { FormsModule } from '@angular/forms';
import {
  MdButtonModule,
  MdDialogModule,
  MdIconModule,
  MdInputModule,
  MdListModule,
  MdSidenavModule,
  MdCardModule,
  MdToolbarModule,
  MdProgressBarModule,
  MdExpansionModule,
  MdSelectModule,
  MdTabsModule,
  MdSnackBarModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { MenuService } from './menu/menu.service';
import { LoginComponent } from './login/login.component';
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
    CommonModule,
    RouterModule,
    FormsModule,
    BrowserAnimationsModule,
    MediaQueriesModule,
    MdSidenavModule,
    MdButtonModule,

    MdIconModule,
    MdListModule,
    MdInputModule,
    MdDialogModule,
    MdToolbarModule,
    MdProgressBarModule,
    MdExpansionModule,
    MdSelectModule,
    MdTabsModule,
    MdSnackBarModule
  ],
  declarations: [
    ShellComponent,
    NavMenuComponent,
    NavItemComponent,
    LoginComponent
  ],
  exports: [
    ShellComponent,

    MdSidenavModule,
    MdButtonModule,

    MdIconModule,
    MdListModule,
    MdInputModule,
    MdDialogModule,
    MdCardModule,
    MdToolbarModule,
    MdProgressBarModule,
    MdExpansionModule,
    MdSelectModule,
    MdTabsModule


  ],
  providers: [MenuService],
  entryComponents: [LoginComponent]
})
export class ShellModule {
}
