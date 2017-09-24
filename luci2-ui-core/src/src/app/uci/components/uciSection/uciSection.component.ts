/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Section } from '../../section';

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'uci-section',
  templateUrl: './uciSection.component.html',
  styleUrls: ['./uciSection.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UciSectionComponent implements OnInit {

  @Input() section: Section;

  constructor() { }

  ngOnInit() {
  }

}
