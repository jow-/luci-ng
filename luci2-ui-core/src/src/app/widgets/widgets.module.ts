/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';
import {
  CommonWidgetsModule,
  ESpression,
  Expressions,
  FormFieldWidgetsModule,
  MaterialModule,
  SettingsWidgetsModule,
  WidgetsCoreModule,
} from 'reactive-json-form-ng';

import { PopupDialogComponent } from './popup/popup.component';
import { rootContextProvider } from './rootContext';
import { StatusModule } from './status/status.module';

/** Module containing all Widget components */
@NgModule({
  imports: [
    MaterialModule,
    StatusModule,
    CommonWidgetsModule,
    FormFieldWidgetsModule,
    SettingsWidgetsModule,
  ],
  declarations: [PopupDialogComponent],
  exports: [WidgetsCoreModule, MaterialModule],
  entryComponents: [PopupDialogComponent],

  providers: [
    {
      provide: Expressions,
      useClass: ESpression,
    },
    rootContextProvider,
  ],
})
export class WidgetsModule {}
