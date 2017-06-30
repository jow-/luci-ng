/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'wdg-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StatsComponent implements OnInit {

  @Input() svgIcon: string;
  @Input() value: number;
  @Input() title: string;

  constructor() { }

  ngOnInit() {
  }

}
