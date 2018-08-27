/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Input, ViewEncapsulation } from '@angular/core';

import { SectionData } from '../../data/section';

@Component({
  selector: 'uci-section',
  templateUrl: './uciSection.component.html',
  styleUrls: ['./uciSection.component.scss'],
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
})
export class UciSectionComponent {
  @Input()
  section!: SectionData;
}
