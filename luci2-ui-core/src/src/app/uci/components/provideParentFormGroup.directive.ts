/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Directive } from '@angular/core';
import { ControlContainer, NgModelGroup } from '@angular/forms';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[provideParentFormGroup]',
  providers: [{provide: ControlContainer, useExisting: NgModelGroup}]
})
export class ProvideParentFormGroupDirective {}
