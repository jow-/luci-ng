/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */


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
  enumBinding?: object;

  default?: any;

  items?: IUciOptionSchema;

  properties?: { [propName: string]: IUciOptionSchema }
}
