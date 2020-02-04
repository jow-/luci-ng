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
} from 'rx-json-ui';

import { PopupDialogComponent } from './popup/popup.component';
import { rootContextProvider } from './rootContext';

/** Module containing all Widget components */
@NgModule({
  imports: [
    MaterialModule,
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
