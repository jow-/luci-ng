/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';
import {
  MaterialModule, WidgetsCoreModule, FormFieldWidgetsModule, CommonWidgetsModule,
  ESpression, Expressions
} from 'reactive-json-form-ng';
import { rootContextProvider } from './rootContext';
import { StatusModule } from './status/status.module';
import { UciWidgetsModule } from './uci/uci.module';

/** Module containing all Widget components */
@NgModule({
  imports: [
    MaterialModule,
    StatusModule,
    CommonWidgetsModule,
    FormFieldWidgetsModule,
    UciWidgetsModule,
  ],
  declarations: [
  ],
  exports: [
    WidgetsCoreModule,
  ],

  providers: [
    {
      provide: Expressions,
      useClass: ESpression
    },
    rootContextProvider
  ]
})
export class WidgetsModule { }
