/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';

import { MaterialModule } from '../material.module';

import { UciService } from './backend/uci.service';
import { ChipArrayValueAccessorDirective } from './components/chipListValueAccessor.directive';
import { ProvideParentFormDirective } from './components/provideParentForm.directive';
import { ProvideParentFormGroupDirective } from './components/provideParentFormGroup.directive';
import { SchemaValidatorDirective } from './components/schemaValidator.directive';
import { UciConfigComponent } from './components/uciConfig/uciConfig.component';
import { UciFormComponent } from './components/uciForm/uciForm.component';
import { UciOptionComponent } from './components/uciOption/uciOption.component';
import { UciSectionComponent } from './components/uciSection/uciSection.component';
import { UciModelService } from './uciModel.service';

/**
 * UciModel handles all UCI related code
 *
 * It divides the task handling the three main UCI entinties (config file, section, option) modeled into three
 * different aspects:
 *  - components: to handle the visual UI
 *  - schema: to handle type definition and validation logic
 *  - data: to hold the data of a specific instance
 *
 * Additionally it handles all interaction with the backend thru a service and describes all backend returned
 * objects with interfaces
 *
 */

@NgModule({
  imports: [MaterialModule],
  declarations: [
    UciOptionComponent,
    UciSectionComponent,
    UciConfigComponent,
    UciFormComponent,

    SchemaValidatorDirective,
    ChipArrayValueAccessorDirective,
    ProvideParentFormDirective,
    ProvideParentFormGroupDirective,
  ],
  providers: [UciService, UciModelService],
  exports: [UciOptionComponent, UciSectionComponent, UciConfigComponent, UciFormComponent],
})
export class UciModule {}
