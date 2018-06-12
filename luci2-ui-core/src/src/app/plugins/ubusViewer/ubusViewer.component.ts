/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, OnInit } from '@angular/core';
import { UbusService } from 'app/ubus/ubus.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-ubus-viewer',
  templateUrl: './ubusViewer.component.html',
  styleUrls: ['./ubusViewer.component.css']
})
export class UbusViewerComponent implements OnInit {

  ubusObject: string;
  ubusMethod: string;
  ubusParam: string;

  jsonPath: string;
  autoupdate = false;

  ubusResponse: Observable<any>;
  query: Array<any>;
  ready = true;

  ubusList: Array<string>;

  fObject: Array<string>;

  methodList: {};
  fMethod: any;

  paramsHint = '';
  constructor(private _ubus: UbusService) { }

  ngOnInit() {
    this._ubus.list(undefined)
      .subscribe(data => {
        this.ready = true;
        this.ubusList = this.fObject = data;
      });


  }



  callUbus() {
    this.query = [this.ubusObject, this.ubusMethod, JSON.parse(this.ubusParam || '{}'), this.jsonPath || '' ];
  }

  filterObjects(text) {
    this.fObject = this.ubusList.filter(data => data.toLowerCase().indexOf(text) >= 0);

  }

  updateMethods(event) {
    this._ubus.list([event.option.value])
      .subscribe(data => {
        console.log(data);
        this.methodList = data[event.option.value];

        this.fMethod = Object.keys(this.methodList);
      });

  }

  filterMethods(text) {
    this.fMethod = Object.keys(this.methodList).filter(data => data.toLowerCase().indexOf(text) >= 0);
  }
  updateParams(event) {
    this.paramsHint = JSON.stringify(this.methodList[event.option.value]);
  }

}
