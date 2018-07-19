/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { SectionData } from './section';
import { BehaviorSubject, Observable } from 'rxjs';
import { OptionSchema } from '../schema/optionSchema';


export class OptionData {

  schema: OptionSchema;

  oldValue: string | string[] | boolean;

  /** Action to perform -1: delete | 0: set | 1: add */
  action: number;


  // validation
  errorMsg: string;

  // emmiting changes

  set value(value: string | string[] | boolean) {
    // if it changed emmit the new value
    if (this.action === -1) throw new Error('Can\'t change the value of a deleted option');
    if (value !== this._value) this._subject.next(value);
    this._value = value;
  }
  get value() { return this._value; }
  private _value: string | string[] | boolean;
  private _subject: BehaviorSubject<string | string[] | boolean>;

  constructor(public section: SectionData, schema: OptionSchema, initData: string | string[]) {

    this.schema = schema;

    if (typeof initData === 'undefined') {
      this.action = 1;
      if (schema.default) {
        if (schema.type === 'boolean')
          initData = schema.default === true || schema.default === this.schema.enum[0] ? this.schema.enum[0] : this.schema.enum[1];
        else initData = schema.default;
      }
    } else
      this.action = 0;

    if (schema.type === 'array' && !Array.isArray(initData)) this._value = [initData];
    else if (schema.type === 'boolean') this._value = initData === this.schema.enum[0];
    else this._value = initData;

    if (Array.isArray(initData)) {
      if (schema.type !== 'array') throw new Error('Array data can only be set on a list');
      this.oldValue = initData.slice(0);
    } else if (typeof initData === 'object') {
      throw new Error('Option can only be assigned primitives or array');
    } else {
      this.oldValue = initData;
    }

    // initializes emmiter
    this._subject = new BehaviorSubject<string | string[] | boolean>(this._value);
  }

  asObservable(): Observable<string | string[] | boolean> { return this._subject.asObservable(); }
  delete() {
    this.action = -1;

    this._subject.complete();
  }

  get isModified(): boolean {
    if (this.action !== 0) return false;

    if (Array.isArray(this.value) && Array.isArray(this.oldValue))
      return (this.value.length !== this.oldValue.length) ||
        !this.value.every((element, index) => element === this.oldValue[index]);
    return this.uciValue !== this.oldValue;
  }

  validate(): boolean {
    const valid = this.schema.validate(this.value);
    this.errorMsg = this.schema.errorMsg;
    return valid;
  }

  /** Converts the value to UCI compliant format */
  get uciValue(): string | string[] {
    if (Array.isArray(this.value) || typeof this.value === 'string') return this.value;
    if (this.schema.type === 'boolean') {
      return this.value ? this.schema.enum[0] : this.schema.enum[1];
    }
    return this.value.toString();
  }
}
