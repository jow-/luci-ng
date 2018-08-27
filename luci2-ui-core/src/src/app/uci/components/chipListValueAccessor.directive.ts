/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Directive } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'mat-chip-list[ngModel]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ChipArrayValueAccessorDirective,
      multi: true,
    },
  ],
  exportAs: 'chipValueAccessor',
})
export class ChipArrayValueAccessorDirective implements ControlValueAccessor {
  // tslint:disable-next-line:no-input-rename
  value: any;

  constructor() {}

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(_obj: any): void {}
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(_isDisabled: boolean): void {}
}
