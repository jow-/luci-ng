/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';

import { ConfigData } from '../../data/config';
import { UciModelService } from '../../uciModel.service';

@Component({
  selector: 'uci-form',
  templateUrl: './uciForm.component.html',
  styleUrls: ['./uciForm.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class UciFormComponent implements OnInit, OnChanges {
  @Input()
  configName!: string;

  isLoaded = false;
  config: ConfigData | undefined;

  constructor(public uciModel: UciModelService) {}

  ngOnInit(): void {
    this.load();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.configName.firstChange) this.load();
  }

  load(): void {
    this.isLoaded = false;
    if (this.configName) {
      this.uciModel.loadConfig(this.configName).subscribe(c => {
        this.isLoaded = true;
        this.config = c;
      });
    }
  }

  save(): void {
    this.uciModel.save();
  }
}
