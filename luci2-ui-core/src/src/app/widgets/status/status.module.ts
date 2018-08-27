/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { NgModule } from '@angular/core';
import { MaterialModule, WidgetsCoreModule } from 'reactive-json-form-ng';

import { ExpansionComponent } from './expansion/expansion.component';
import { LevelComponent } from './level/level.component';

@NgModule({
  imports: [
    MaterialModule,

    WidgetsCoreModule.forRoot({
      widgets: [
        { type: 'stat-level', component: LevelComponent },
        { type: 'stat-expand', component: ExpansionComponent },
      ],
    }),
  ],
  declarations: [LevelComponent, ExpansionComponent],
})
export class StatusModule {}
