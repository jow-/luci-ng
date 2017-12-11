/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { SectionData } from '../../data/section';

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'uci-section',
  templateUrl: './uciSection.component.html',
  styleUrls: ['./uciSection.component.scss'],
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class UciSectionComponent implements OnInit {

  @Input() section: SectionData;

  constructor() { }

  ngOnInit() {
  }

}
