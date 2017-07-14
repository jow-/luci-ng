/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Config } from '../../config';
import { UciModelService } from '../../uciModel.service';

import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'uci-form',
  templateUrl: './uciForm.component.html',
  styleUrls: ['./uciForm.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UciFormComponent implements OnInit, OnChanges {
  @Input() configName: string;

  public isLoaded = false;
  public config: Config;

  constructor(public uciModel: UciModelService) { }

  ngOnInit() {
    this.load();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (!changes.configName.firstChange)
      this.load();
  }

  load() {
    if (this.configName) {
      this.uciModel.loadConfig(this.configName)
        .subscribe(c => { this.isLoaded = true; this.config = c; });

    }

  }

}
