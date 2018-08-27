/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule, WidgetsCoreModule } from 'reactive-json-form-ng';

import { UciModule } from '../../uci/module';

import { ConfigComponent } from './config/config.component';
import { UciSectionComponent } from './section/section.component';

@NgModule({
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    UciModule,

    WidgetsCoreModule.forRoot({
      widgets: [
        { type: 'uci-config', component: ConfigComponent },
        { type: 'uci-section', component: UciSectionComponent },
      ],
    }),
  ],
  declarations: [ConfigComponent, UciSectionComponent],
  exports: [],
})
export class UciWidgetsModule {}
