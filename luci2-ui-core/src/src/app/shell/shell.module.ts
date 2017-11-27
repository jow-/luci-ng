/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LayoutModule } from '@angular/cdk/layout';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';

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
    LayoutModule,
    MatSidenavModule,
    MatButtonModule,

    MatIconModule,
    MatListModule,
    MatInputModule,
    MatDialogModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  declarations: [
    ShellComponent,
    NavMenuComponent,
    NavItemComponent,
    LoginComponent
  ],
  exports: [
    ShellComponent,

    MatSidenavModule,
    MatButtonModule,

    MatIconModule,
    MatListModule,
    MatInputModule,
    MatDialogModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatSelectModule,
    MatTabsModule


  ],
  providers: [MenuService],
  entryComponents: [LoginComponent]
})
export class ShellModule {
}
