/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { IUciOptionSchema, UciActions } from './uci.interface';


/**
 * Option: object that models an `uci option` with its schema information.
 * It keeps tracks of the changes so it can later inform a service that updates the backend
 */
export class Option implements IUciOptionSchema {
  static types = {
    bool: 'checkbox',
    integer: 'text',
    uinteger: 'text',
    float: 'text',
    ufloat: 'text',
    string: 'text',
    ipaddr: 'text',
    ip4addr: 'text',
    ip6addr: 'text',
    netmask4: 'text',
    netmask6: 'text',
    cidr4: 'text',
    cidr6: 'text',
    ipmask4: 'text',
    ipmask6: 'text',
    port: 'text',
    portrange: 'text',
    macaddr: 'text',
    host: 'text',
    hostname: 'text',
    wpakey: 'text',
    wepkey: 'text',
    device: 'cbiDeviceList',
    network: 'cbiNetworkList'
  };

  oldValue: string | string[];
  action = UciActions.Add;

  title: string;
  description: string;

  type = 'string';
  isList = false;
  required = false;
  validation: string;
  values: string[];


  constructor(public name: string, public value: string | string[], public schema?: IUciOptionSchema) {


    if (typeof schema === 'object') {
      this.type = schema.type || 'string';
      this.required = !!schema.required;
      this.validation = schema.validation;
      this.title = schema.title || name;
      this.description = schema.description;
      if (schema.isList && !Array.isArray(value)) value = [value];
      if (Array.isArray(schema.values)) this.values = schema.values;
    } else {
      this.title = name;
    }

    if (Array.isArray(value)) {
      this.isList = true;
      this.oldValue = value.slice(0);
    } else if (typeof value === 'object') {
      throw new Error('Option can only be assigned primitives or array');
    } else {
      this.oldValue = value;
    }
  }

  delete() {
    this.action = UciActions.Delete;
  }

  get isModified(): boolean {
    if (this.action === UciActions.Delete) return false;
    if (this.action === UciActions.Add) return true;

    if (typeof this.value !== 'string' && this.isList)
      return (this.value.length === this.oldValue.length) &&
        this.value.every((element, index) => element === this.oldValue[index]);
    return this.value === this.oldValue;
  }

  get inputType(): string {
    return Option.types[this.type] || 'text';
  }
}
