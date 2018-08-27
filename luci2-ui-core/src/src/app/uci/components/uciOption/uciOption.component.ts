/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';

import { UbusService } from '../../../ubus/ubus.service';
import { OptionData } from '../../data/option';
import { UciDependency } from '../../schema/dependency';
import { UciModelService } from '../../uciModel.service';

/**
 * uciOption: renders an uci Option object using the correct input control
 */
@Component({
  selector: 'uci-option',
  templateUrl: './uciOption.component.html',
  styleUrls: ['./uciOption.component.scss'],
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
})
export class UciOptionComponent implements OnInit {
  @Input()
  option!: OptionData;

  separatorKeysCodes = [ENTER, COMMA];

  listInput = '';

  listEnum: string[] | undefined;

  acOptions: string[] | undefined;

  dependencies: Array<[UciDependency, boolean]> | undefined;
  dependenciesState = false;

  constructor(
    private _ubus: UbusService,
    private _model: UciModelService,
    private _ref: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.option.schema.ubusBinding) {
      this.listEnum = this.acOptions = [];
      this.option.schema.ubusBinding.bind(this.option, this._model, this._ubus).subscribe(data => {
        this.listEnum = this.acOptions = (this.option.schema.enum || []).concat(
          Array.isArray(data) ? data : []
        );
        this._ref.markForCheck();
      });
    } else if (this.option.schema.uciBinding) {
      this.listEnum = this.acOptions = [];

      this._model.bindSelector(this.option.schema.uciBinding, this.option, true).subscribe(data => {
        this.listEnum = this.acOptions = (this.option.schema.enum || []).concat(
          Array.isArray(data) ? data : []
        );
        this._ref.markForCheck();
      });
    } else if (this.option.schema.enum) this.listEnum = this.acOptions = this.option.schema.enum;

    this.setupDependencies();
  }

  setupDependencies(): void {
    let depData: OptionData | undefined;

    if (!this.option.schema.dependencies) {
      this.dependenciesState = true;
      return;
    }

    this.dependencies = [];

    for (const key in this.option.schema.dependencies) {
      if (!this.option.schema.dependencies.hasOwnProperty(key)) continue;

      depData = this.option.section.getOption(key);

      if (depData) {
        const dependency: [UciDependency, boolean] = [
          new UciDependency(depData, this.option.schema.dependencies[key]),
          false,
        ];
        dependency[0].asObservable().subscribe(state => {
          let global: boolean;
          if (state !== dependency[1]) {
            dependency[1] = state;
            global = this.dependencies!.reduce((acum, val) => acum && val[1], true);
            if (this.dependenciesState !== global) {
              this.dependenciesState = global;
              this._ref.markForCheck();
            }
          }
        });

        this.dependencies.push(dependency);
      }
    }

    this.dependenciesState = this.dependencies.reduce((acum, val) => acum && val[1], true);
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

  filterAutocomplete(text: string): void {
    this.acOptions =
      (this.listEnum && this.listEnum.filter(data => data.toLowerCase().indexOf(text) >= 0)) || [];
  }
}
