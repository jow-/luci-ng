/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { UbusService } from 'app/ubus/ubus.service';

import { Observable } from 'rxjs/Observable';
import { OptionData } from 'app/uci/data/option';
import * as jsonpath from 'jsonpath';
import { ParameterExpansion } from 'app/uci/data/parameterExpansion';
import { UciModelService } from 'app/uci/uciModel.service';
import { combineLatest } from 'rxjs/observable/combineLatest';

/**
 * UbusQueryDef
 * Stores a 'preparsed' definition of an ubus call and transformations/filters to apply.
 * The binding is resolved by UbusQueryEmmiter
 * The actual excecution is implemented by UbusQuery
 */
export class UbusQueryDef {

  /** ubus method and params to use in the call */
  call: [string, string, { [param: string]: any }];
  service: string;
  method: string;
  params: Object;
  jsonPath: ParameterExpansion;

  autoupdate = 0;



  /** Parses the definition to create to initialize the query */
  constructor(def: [string, string, { [param: string]: any }, string]) {

    if (!Array.isArray(def) || def.length < 2 ||
      typeof def[0] !== 'string' || typeof def[1] !== 'string' ||
      (def.length >= 2 && def[2] && typeof def[2] !== 'object') ||
      (def.length >= 3 && typeof def[3] !== 'string'))
      throw new Error('Ubus Query must be ["service", "method", {params}?, "jsonPathTransform?"]');

    this.service = def[0];
    this.method = def[1];
    this.params = def.length > 2 ? def[2] : {};
    this.jsonPath = new ParameterExpansion(def.length > 3 && def[3].trim() || '');

  }



  /** Applies transformations to the input data */

  bind(context: OptionData, _model: UciModelService, _ubus: UbusService) {

    // TODO: make parameters expandable, and requery on change

    return combineLatest(
      _ubus.call(this.service, this.method, this.params)
        .repeatWhen(o =>
          this.autoupdate ? o.delay(this.autoupdate) : Observable.empty())
        .retryWhen(o =>
          this.autoupdate ? o.delay(this.autoupdate) : Observable.throw(o)),

      this.jsonPath.bind(context, _model),

      (data, path) => (typeof data !== 'object' || !path) ? data : jsonpath.query(data, path)
    );
  }
}
