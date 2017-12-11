/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { IUbusQuery } from 'app/ubus/ubus.interface';



/**
 * Option Schema used by UCI backend
 */
export interface IUciOptionSchema {
  // General Info Properties
  title?: string;
  description?: string;
  examples?: string;

  type: string;
  required?: boolean;

  // validations for "string"
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // validations for "number | integer"
  multipleOf?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;

  // validations for enumarations
  enum?: any[];

  /**
   * Binding to get the list of valid entries from.
   *
   * To bind to UBUS calls use one of the following
   * @property [ "ubusObject", "ubusMethod", { params }] : to bind to the direct response from ubus
   * @property  { IUbusQuery } : to define transformations/filtering to apply to the ubus response
   *
   * To bind to other UCI data:
   * @property "uciSelector" direct binding
   * @property "uciSelector | /regexPattern/" filtered binding
   */
  enumBinding?: IUbusQuery | [string, string, { [param: string]: any }] | string;


  default?: any;

  items?: IUciOptionSchema;

  /**
   * Defines dependencies to other UCI options (in the same section).
   * If any dependency is unmet the option is disabled
   *
   * They can be specified as:
   * @property [ "selector", "selector2", "!selector3" ] : only check that options are present and not empty (can be negated)
   * @property { selector: [ "value1", "value2", "!value3"] } each option included as a property is compared against an
   * array of valid values
   * To satisfy it must match any of the positive values AND ALL negatives
   */
  dependencies?: string[] | { [selector: string]: string[] };

  properties?: { [propName: string]: IUciOptionSchema }
}
