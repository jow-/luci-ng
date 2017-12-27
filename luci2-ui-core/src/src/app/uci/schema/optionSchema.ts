/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { IUciOptionSchema } from '../backend/option.interface';
import { Format } from './format';
import { UbusQueryDef } from 'app/ubus/ubusQuery';
import { UciSelector } from 'app/uci/uciSelector.class';

/**
 * Option: object that models an `uci option` schema information.
 * It holds all its type definition and validation logic.
 * It can be constructed from an explicit `schema` or implicitly from the uci data
 */
export class OptionSchema {

  // General Info Properties
  name: string;
  title: string;
  description: string;
  examples: string;
  type: string;
  required: boolean;
  default: any;

  // validations for "string"
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  format: Format;

  // validations for "number | integer"
  multipleOf: number;
  minimum: number;
  maximum: number;
  exclusiveMinimum: boolean;
  exclusiveMaximum: boolean;

  // validations for enumarations
  enum: any[];
  ubusBinding: UbusQueryDef;
  uciBinding: UciSelector;



  // schema definitions for items of an array
  items: OptionSchema;

  // nested option definitions for "object"
  properties: Map<string, OptionSchema>;

  // dependencies
  dependencies: { [selector: string]: boolean | string[] } = {};

  // last validation state
  isValid: boolean;
  errorMsg: string;

  // public methods

  /** Creates an OptionSchema based on data information */
  constructor(name: string, data: string | string[])
  /** Creates an OptionSchema based on schema information from backend */
  constructor(name: string, data: IUciOptionSchema)
  /** Creates an OptionSchema */
  constructor(name: string, data?: string | string[] | IUciOptionSchema) {
    let schema: IUciOptionSchema;

    this.properties = new Map();

    if (typeof data === 'string') {
      schema = { type: 'string' };
    } else if (Array.isArray(data)) {
      schema = {
        type: 'array',
        items: { type: 'string' }
      };
    } else if (typeof data.type === 'string') {
      schema = data;
    } else if (typeof data === 'boolean') {
      schema = { type: 'boolean' };
    } else {
      schema = { type: 'string' };
    }


    // TODO: case when creating directly from uci data without schema

    this.name = name;
    this.title = schema.title || name;
    this.description = schema.description || '';
    this.examples = schema.examples || '';
    this.default = schema.default;

    this.enum = schema.enum;

    if (schema.enumBinding) {
      if (Array.isArray(schema.enumBinding))
        this.ubusBinding = new UbusQueryDef(schema.enumBinding);
      else if (typeof schema.enumBinding === 'string')
        this.uciBinding = new UciSelector(schema.enumBinding);
    }

    this.required = schema.required === true;
    this.type = schema.type;


    // parse dependencies

    if (Array.isArray(schema.dependencies)) {
      schema.dependencies.map(selector => this.dependencies[selector] = selector.charAt(0) !== '!');
    } else if (typeof schema.dependencies === 'object') {
      for (const key in schema.dependencies) {
        if (!schema.dependencies.hasOwnProperty(key)) continue;

        if (Array.isArray(schema.dependencies[key]) || typeof schema.dependencies[key] === 'boolean')
          this.dependencies[key] = schema.dependencies[key];
      }
    }

    // clear error state
    this._setError();

    switch (schema.type) {
      case 'string':
        this.minLength = schema.minLength >= 0 ? schema.minLength : null;
        this.maxLength = schema.maxLength >= 0 ? schema.maxLength : null;
        if (schema.pattern) this.pattern = new RegExp(schema.pattern);
        this.format = new Format(schema.format);
        break;

      case 'boolean':
        // make sure that `enum` is always a 2 items array
        if (!Array.isArray(this.enum) || !this.enum.length) this.enum = ['1', '0'];
        else if (this.enum.length === 1) this.enum.push('0');
        else if (this.enum.length > 2) this.enum = this.enum.slice(0, 2);
        break;

      case 'integer':
      case 'number':
        if (typeof schema.multipleOf === 'number') this.multipleOf = schema.multipleOf;
        if (typeof schema.minimum === 'number') this.minimum = schema.minimum;
        this.exclusiveMinimum = !!schema.exclusiveMinimum;
        this.exclusiveMaximum = !!schema.exclusiveMaximum;
        break;

      case 'array':
        this.minLength = schema.minLength >= 0 ? schema.minLength : null;
        this.maxLength = schema.maxLength >= 0 ? schema.maxLength : null;

        if (typeof schema.items === 'object') this.items = new OptionSchema(name, schema.items);

        break;

      case 'object':
        for (const key in schema.properties) {
          if (schema.properties.hasOwnProperty(key))
            this.properties.set(key, new OptionSchema(key, schema.properties[key]));
        }
        break;

      default:
        this.type = 'string';
        break;

    }





  }

  validate(value: any): boolean {

    if (this.required && (typeof value === 'undefined' || value === 'null')) return this._setError('Required');

    switch (this.type) {
      case 'string':
        if (typeof value !== 'string') return this._setError('Value must be a string');
        if (this.required && !value) return this._setError('Required');
        if (this.minLength && value.length < this.minLength) return this._setError(`Minimun length is ${this.minLength}`);
        if (this.maxLength && value.length > this.maxLength) return this._setError(`Minimun length is ${this.maxLength}`);
        if (this.pattern && !this.pattern.test(value)) return this._setError('Invalid pattern');

        if (this.format) {
          if (this.format.validate(value)) return this._setError();
          return this._setError(`Not in valid "${this.format}" format`);
        }
        return this._setError();

      case 'boolean':
        if (typeof value === 'boolean') return this._setError();
        return this._setError(this.enum.includes(value) ? '' : 'Not a valid boolean string');

      case 'integer':
        value = parseFloat(value);
        if (!Number.isInteger(value)) return this._setError('Value must be integer');

      // tslint:disable-next-line:no-switch-case-fall-through
      case 'number':
        value = parseFloat(value);
        if (isNaN(value)) return this._setError('Value must be a number');
        if (this.maximum != null && (value > this.maximum || !this.exclusiveMaximum && value >= this.maximum))
          return this._setError(`Must be lower than ${this.exclusiveMaximum ? '' : 'or equeal to '}${this.maximum}`);
        if (this.minimum != null && (value < this.minimum || !this.exclusiveMinimum && value <= this.minimum))
          return this._setError(`Must be greater than ${this.exclusiveMaximum ? '' : 'or equeal to '}${this.minimum}`);
        if (this.multipleOf && value % this.multipleOf !== 0)
          return this._setError(`Must be multiple of ${this.multipleOf}`);

        return this._setError();

      case 'array':
        if (!this.items) return this._setError('Value must be a number');
        if (!Array.isArray(value)) return this._setError('Value must be a array');

        if (this.minLength != null && value.length < this.minLength)
          return this._setError(`List must have at least ${this.minLength} items`);

        if (this.maxLength != null && value.length > this.maxLength)
          return this._setError(`List must have a maximum of ${this.maxLength} items`);

        for (let i = 0; i < value.length; i++) {
          if (!this.items.validate(value[i])) return this._setError(this.items.errorMsg);
        }

        return this._setError();

      case 'object':
        let result = true;
        if (typeof value !== 'object') return false;

        this.properties.forEach((prop, key) => result = result && prop.validate(value[key]));

        return result;


      default:
        return false;
    }
  }

  inputType(): string {
    switch (this.type) {
      case 'integer':
      case 'number':
        return 'number';

      case 'boolean':
        return 'checkbox';
    }

    return 'text';
  }

  private _setError(msg?: string): boolean {
    if (msg) {
      this.isValid = false;
      this.errorMsg = msg;
    } else {
      this.isValid = true;
      this.errorMsg = '';
    }

    return this.isValid;
  }
}

