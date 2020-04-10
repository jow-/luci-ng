/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import * as Chartist from 'chartist';
import { BaseWidget, MainSlotContentDef } from 'rx-json-ui';

export interface SetChartWidgetOptions {
  value: number;
  total: number;
  icon: string;
  unit: string;
  title: string;
  noGraph: boolean;
  format: string;

  expanded: boolean;
  noExpand: boolean;

  maxSpan: number;
  initData: Array<{ x: number; y: number }>;
}

@Component({
  selector: 'set-chart', // tslint:disable-line: component-selector
  templateUrl: './setChart.component.html',
  styleUrls: ['./setChart.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'set-row' },
})
export class SetChartWidgetComponent
  extends BaseWidget<SetChartWidgetOptions, MainSlotContentDef>
  implements OnDestroy {
  @ViewChild('rowChart') chartElement: ElementRef | undefined;

  chartData: Array<{ x: number; y: number }> | undefined;

  chartOpt: Chartist.ILineChartOptions = {
    showArea: true,
    showLine: true,
    showPoint: false,
    fullWidth: true,
    axisX: {
      showGrid: false,
      showLabel: false,
      type: Chartist.FixedScaleAxis,
      offset: 0,
    },
    axisY: { showGrid: false, showLabel: false, offset: 0 },
  };
  expanded = false;
  private chart: Chartist.IChartistLineChart | undefined;

  dynOnAfterBind(): void {
    this.map('expanded', (e) => (this.expanded = !!e));

    this.map('value', (v) => {
      if (!this.chartData) return;
      this.chartData.push({ x: Date.now(), y: v });
    });
  }
  toggle(): void {
    this.expanded = !this.expanded;
  }

  dynOnChange(): void {
    if (!this.chartData)
      this.chartData = Array.isArray(this.options.initData)
        ? [...this.options.initData]
        : [];

    if (this.options.maxSpan && this.chartData.length > 2) {
      const last = this.chartData[this.chartData.length - 1].x;
      const min = last - this.options.maxSpan;

      const first = this.chartData.findIndex((p) => p.x > min);
      this.chartData.splice(0, first - 1);
      (this.chartOpt.axisX as any).highLow = { low: min, high: last };
    }

    if (this.chartElement) {
      if (!this.chart)
        this.chart = new Chartist.Line(
          this.chartElement.nativeElement,
          { series: [{ name: 'value', data: this.chartData }] },
          this.chartOpt
        );
      else
        this.chart.update(
          { series: [{ name: 'value', data: this.chartData }] },
          this.chartOpt
        );
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();

    if (this.chart) {
      this.chart.detach();
      this.chart = undefined;
    }
  }
}
