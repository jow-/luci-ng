/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Directive } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[provideParentForm]',
  providers: [{provide: ControlContainer, useExisting: NgForm}]
})
export class ProvideParentFormDirective {}
