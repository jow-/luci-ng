/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { ConfigData } from '../../data/config';

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'uci-config',
  templateUrl: './uciConfig.component.html',
  styleUrls: ['./uciConfig.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UciConfigComponent implements OnInit {

  @Input() config: ConfigData;

  constructor() { }

  ngOnInit() {
  }

}
