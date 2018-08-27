/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Input, ViewEncapsulation } from '@angular/core';

import { ConfigData } from '../../data/config';

@Component({
  selector: 'uci-config',
  templateUrl: './uciConfig.component.html',
  styleUrls: ['./uciConfig.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class UciConfigComponent {
  @Input()
  config!: ConfigData;

  constructor() {}
}
