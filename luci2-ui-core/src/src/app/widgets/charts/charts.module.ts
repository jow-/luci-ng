/**
 * Copyright (c) 2020 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { NgModule } from '@angular/core';
import { BaseSettingsModule, MaterialModule, WidgetsCoreModule } from 'rx-json-ui';

import { SetChartWidgetComponent } from './set-chart/setChart.component';

export { SetChartWidgetComponent } from './set-chart/setChart.component';

@NgModule({
  imports: [
    MaterialModule,
    BaseSettingsModule,

    WidgetsCoreModule.forRoot({
      widgets: [{ type: 'set-chart', component: SetChartWidgetComponent }],
    }),
  ],
  declarations: [SetChartWidgetComponent],
  exports: [SetChartWidgetComponent],
})
export class ChartsWidgetsModule {}
