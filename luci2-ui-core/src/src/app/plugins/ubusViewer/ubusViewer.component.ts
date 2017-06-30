/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-ubus-viewer',
  templateUrl: './ubusViewer.component.html',
  styleUrls: ['./ubusViewer.component.css']
})
export class UbusViewerComponent implements OnInit {

  ubusObject: string;
  ubusMethod: string;
  ubusParam: string;
  ubusResponse: Observable<any>;
  ubus: any[];

  constructor() { }

  ngOnInit() {
  }

  callUbus() {
    this.ubus = [this.ubusObject, this.ubusMethod, JSON.parse(this.ubusParam || '{}')];
  }

}
