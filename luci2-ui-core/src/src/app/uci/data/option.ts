/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { OptionSchema } from '../schema/optionSchema';
import { SectionData } from 'app/uci/data/section';


export class OptionData {

  schema: OptionSchema;

  value: string | string[] | boolean;
  oldValue: string | string[] | boolean;

  /** Action to perform -1: delete | 0: set | 1: add */
  action: number;


  // validation
  errorMsg: string;
  constructor(public section: SectionData, schema: OptionSchema, initData: string | string[]) {

    this.schema = schema;

    if (typeof initData === 'undefined') {
      this.action = 1;
      return;
    }

    this.action = 0;

    if (schema.type === 'array' && !Array.isArray(initData)) this.value = [initData];
    else if (schema.type === 'boolean') this.value = initData === this.schema.enum[0];
    else this.value = initData;

    if (Array.isArray(initData)) {
      if (schema.type !== 'array') throw new Error('Array data can only be set on a list');
      this.oldValue = initData.slice(0);
    } else if (typeof initData === 'object') {
      throw new Error('Option can only be assigned primitives or array');
    } else {
      this.oldValue = initData;
    }

  }

  delete() {
    this.action = -1;
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
