/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Option } from '../../option';

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';



/**
 * uciOption: renders an uci Option object using the correct input control
 */
@Component({
  selector: 'uci-option',
  templateUrl: './uciOption.component.html',
  styleUrls: ['./uciOption.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class UciOptionComponent implements OnInit {

  @Input() option: Option;


  constructor() { }

  ngOnInit() {
  }

}
