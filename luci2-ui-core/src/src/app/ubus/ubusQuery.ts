/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { IUbusQuery } from './ubus.interface';
import { PropertyAccessor } from '../shared/propertyAccessor.class';
import { UbusService } from 'app/ubus/ubus.service';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { OptionData } from 'app/uci/data/option';

/**
 * UbusQueryDef
 * Stores a 'preparsed' definition of an ubus call and transformations/filters to apply.
 * The binding is resolved by UbusQueryEmmiter
 * The actual excecution is implemented by UbusQuery
 */
export class UbusQueryDef {

  /** ubus method and params to use in the call */
  call: [string, string, { [param: string]: any }];

  item: PropertyAccessor;
  subItem: PropertyAccessor;

  filterBy: PropertyAccessor;

  pattern: RegExp;

  concat: boolean;
  toArray: string;
  autoupdate = 0;



  /** Parses the definition to create to initialize the query */
  constructor(def: IUbusQuery | [string, string, { [param: string]: any }]) {
    let query: IUbusQuery;

    if (Array.isArray(def)) query = { call: def };
    else query = def;

    if (Array.isArray(query.call) && query.call.length >= 2 &&
      typeof query.call[0] === 'string' && typeof query.call[1] === 'string' &&
      (typeof query.call[2] === 'object' || query.call.length === 2))
      this.call = query.call;
    else this.call = null;


    // only process non empty strings
    if (typeof query.item === 'string' && query.item.trim())
      this.item = new PropertyAccessor(query.item);
    else this.item = null;

    if (typeof query.subItem === 'string' && query.subItem.trim())
      this.subItem = new PropertyAccessor(query.subItem);
    else this.subItem = null;

    if (typeof query.filterBy === 'string' && query.filterBy.trim())
      this.filterBy = new PropertyAccessor(query.filterBy);
    else this.filterBy = null;

    if (typeof query.pattern === 'string' && query.pattern.trim())
      this.pattern = new RegExp(query.pattern);
    else this.pattern = null;

    this.concat = !!query.concat;

    if (typeof query.toArray === 'string' && query.toArray.trim())
      this.toArray = query.toArray === 'key' ? 'key' : 'value';

  }



  /** Applies transformations to the input data */
  transform(data: Object | Array<any>): any {
    const resultObject = {};
    let resultArray = [];

    if (typeof data !== 'object') return data;


    // select data member
    if (this.item) data = this.item.get(data);



    // Check if additional Filter and transform value are needed (can only transform array or object)
    if (!this.subItem && !this.pattern) return data;


    // transform array items
    if (Array.isArray(data)) {

      if (this.pattern)
        data = data.filter(value => {
          if (typeof value === 'object') {
            if (this.filterBy) value = this.filterBy.get(value);
            else if (this.subItem) value = this.subItem.get(value);
          }

          if (typeof value !== 'string') return false;

          return this.pattern.test(value);
        });
      if (Array.isArray(data))
        data = data.map(value => {
          if (this.subItem)
            value = this.subItem.get(value);
          if (this.concat)
            resultArray = resultArray.concat(this._toArray(value));
          else if (this.toArray)
            resultArray.push(this._toArray(value));

        });

      return resultArray;
    }

    // tranform object properties


    for (const key in data) {
      if (!data.hasOwnProperty(key)) continue;
      let value = data[key], filter: any;

      if (typeof value === 'object') {
        if (this.subItem) value = this.subItem.get(value);

        if (this.filterBy) filter = this.filterBy.get(value);
        else filter = value;
      }

      if (this.pattern && typeof filter === 'string' && this.pattern.test(filter) || !this.pattern) {
        if (this.concat)
          resultArray = resultArray.concat(this._toArray(value));
        else if (this.toArray)
          resultArray.push(this._toArray(value));
        else resultObject[key] = value;
      }
    }

    return (this.toArray || this.concat) ? resultArray : resultObject;
  }

  private _toArray(obj: Object): Array<any> {
    const result = [];

    if (Array.isArray(obj)) return obj;
    if (typeof obj !== 'object') return [obj];
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      if (this.toArray === 'key')
        result.push(key);
      else result.push(obj[key]);
    }

    return result;
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
