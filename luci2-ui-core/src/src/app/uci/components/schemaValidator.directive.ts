/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator } from '@angular/forms';

import { OptionSchema } from '../schema/optionSchema';

@Directive({
  selector: '[uciSchema]',
  providers: [{ provide: NG_VALIDATORS, useExisting: SchemaValidatorDirective, multi: true }],
})
export class SchemaValidatorDirective implements Validator {
  @Input()
  uciSchema!: OptionSchema;
  constructor() {}

  validate(control: AbstractControl): { [key: string]: any } | null {
    const valid = this.uciSchema.validate(control.value);
    const errorMsg = this.uciSchema.errorMsg;

    return valid ? null : { uciSchema: { errorMsg } };
  }
}
