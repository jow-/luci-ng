/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { UbusService } from 'app/ubus/ubus.service';
import { OptionData } from 'app/uci/data/option';
import { ParameterExpansion } from 'app/uci/data/parameterExpansion';
import { UciModelService } from 'app/uci/uciModel.service';
import { jsonPathFactory } from 'espression';
import { combineLatest, empty, throwError } from 'rxjs';
import { delay, repeatWhen, retryWhen } from 'rxjs/operators';



const jsonpath = jsonPathFactory();

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
        .pipe(
          repeatWhen(o =>
            this.autoupdate ? o.pipe(delay(this.autoupdate)) : empty()),
          retryWhen(o =>
            this.autoupdate ? o.pipe(delay(this.autoupdate)) : throwError(o))),

      this.jsonPath.bind(context, _model),

      (data, path) => (typeof data !== 'object' || !path) ? data : jsonpath.jsonPath(data, path).values
    );
  }
}
