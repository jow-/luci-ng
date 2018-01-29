/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { PropertyAccessor } from '../shared/propertyAccessor.class';
import { UbusService } from 'app/ubus/ubus.service';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { OptionData } from 'app/uci/data/option';
import * as jsonpath from 'jsonpath';

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
  jsonPath: string;

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
    this.jsonPath = def.length > 3 ? def[3].trim() : null;

  }



  /** Applies transformations to the input data */
  transform(data: Object | Array<any>): any {

    if (typeof data !== 'object' || !this.jsonPath) return data;

    return jsonpath.query(data, this.jsonPath);
  }

}


/**
 * Executes a UbusQueryDef in a context (to perform parameter expansion)
 */
export class UbusQuery {


  get observable() { return this._observable; }

  private _queryDef: UbusQueryDef;
  private _context: OptionData;
  private _observable: Observable<any>;
  private _subject = new BehaviorSubject<UbusQueryDef>(null);
  private _subscription: Subscription;

  constructor(private _ubus: UbusService) {

    this._observable = this._subject.asObservable();


  }

  bind(queryDef: UbusQueryDef) {

    this._queryDef = queryDef;

    // TODO: will need to change to implement parameter expansion.
    // add context and emmit on bound data change

    this._subject.next(queryDef);

    return this.observable;

  }

  /** subscribes to the inner observable (ubus call) */
  private _subscribe() {


    this._unsuscribe();

    this._subscription = this._ubus.query(this._queryDef)
      .repeatWhen(
      o =>
        this._queryDef.autoupdate ? o.delay(this._queryDef.autoupdate) : Observable.empty())
      .retryWhen(
      o =>
        this._queryDef.autoupdate ? o.delay(this._queryDef.autoupdate) : Observable.throw(o))

      .subscribe(
      data => this._subject.next(this._queryDef.transform(data)),
      error => this._subject.error(error),

      // swallows completion event
      () => null);



  }

  private _unsuscribe() {
    if (!this._subscription) return;

    this._subscription.unsubscribe();
    this._subscription = null;
  }

}
