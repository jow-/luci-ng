/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { OptionData } from '../../data/option';

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';

import {ENTER, COMMA} from '@angular/cdk/keycodes';

/**
 * uciOption: renders an uci Option object using the correct input control
 */
@Component({
  selector: 'uci-option',
  templateUrl: './uciOption.component.html',
  styleUrls: ['./uciOption.component.scss'],
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class UciOptionComponent implements OnInit {

  @Input() option: OptionData;

  separatorKeysCodes = [ENTER, COMMA];

  listInput = '';

  ngOnInit() {
  }

  addChip(event: MatChipInputEvent, valueAccessor: any): void {
    const input = event.input;
    const value = event.value;

    if (!Array.isArray(this.option.value)) return;
    // Add data to the model
    if ((value || '').trim()) {
      this.option.value = this.option.value.concat(value.trim());
      valueAccessor.onChange(this.option.value);
      valueAccessor.onTouched();
    }

    // Reset the input value
    if (input) {
      this.listInput = input.value = '';
    }

  }

  removeChip(index: number, valueAccessor: any): void {
    if (!Array.isArray(this.option.value)) return;
    if (index >= 0) {
      this.option.value.splice(index, 1);
      this.option.value = this.option.value.slice();
      valueAccessor.onChange(this.option.value);
      valueAccessor.onTouched();
    }
  }

}
