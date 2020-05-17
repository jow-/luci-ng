/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';
import {
  BaseSettingsModule,
  CommonWidgetsModule,
  ESpression,
  Expressions,
  FormFieldWidgetsModule,
  MaterialModule,
  SettingsWidgetsModule,
  WidgetsCoreModule,
} from 'rx-json-ui';

import { ChartsWidgetsModule } from './charts/charts.module';
import { PopupDialogComponent } from './popup/popup.component';
import { SetPopupFileWidgetComponent } from './popup_file/popup_file.component';
import { rootContextProvider } from './rootContext';

export { SetPopupFileWidgetComponent } from './popup_file/popup_file.component';

/** Module containing all Widget components */
@NgModule({
  imports: [
    MaterialModule,
    ChartsWidgetsModule,
    CommonWidgetsModule,
    FormFieldWidgetsModule,
    SettingsWidgetsModule,
    BaseSettingsModule,
    WidgetsCoreModule.forRoot({
      widgets: [{ type: 'set-popup-file', component: SetPopupFileWidgetComponent }],
    }),
  ],
  declarations: [PopupDialogComponent, SetPopupFileWidgetComponent],
  exports: [WidgetsCoreModule, MaterialModule, SetPopupFileWidgetComponent],
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
