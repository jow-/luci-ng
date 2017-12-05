/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { NgModule } from '@angular/core';
import { UciService } from 'app/uci/backend/uci.service';
import { UciModelService } from 'app/uci/uciModel.service';
import { UciFormComponent } from 'app/uci/components/uciForm/uciForm.component';
import { UciConfigComponent } from 'app/uci/components/uciConfig/uciConfig.component';
import { UciSectionComponent } from 'app/uci/components/uciSection/uciSection.component';
import { UciOptionComponent } from 'app/uci/components/uciOption/uciOption.component';
import { MaterialModule } from 'app/material.module';


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
  imports: [
    MaterialModule
  ],
  declarations: [
    UciOptionComponent,
    UciSectionComponent,
    UciConfigComponent,
    UciFormComponent,
  ],
  providers: [UciService, UciModelService],
  exports: [
    UciOptionComponent,
    UciSectionComponent,
    UciConfigComponent,
    UciFormComponent
  ],
})
export class UciModule { }
