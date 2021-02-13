/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { IUciOptionSchema } from './option.interface';

/**
 * Option Schema used by UCI backend
 */
export interface IUciSectionSchema {
  /**
   * Sections are always `object` jsonschema type
   * The actual `uci` section type is defined by the property name holding this object
   */
  type: string;

  title?: string;
  description?: string;

  // Section Name Rules

  /** Indicates if it has a name */
  anonymous?: boolean;
  /** RegEx pattern for name validation on non anonymous sections */
  pattern?: string;

  /** Name template for new section (an ordinal is appended at the end) */
  default?: string;
  /** the name cannot be repeated within this section type */
  unique?: boolean;

  // Validations

  /** Number of sections of this type must/can be present */
  minLength?: number;
  maxLength?: number;

  /** Sections of this type cannot be added/deleted */
  freezed?: boolean;
  // Child Options

  properties: IUciPropertiesSchema;
}

export interface IUciPropertiesSchema {
  [property: string]: IUciOptionSchema;
}

export interface IUciSectionData {
  [options: string]: string | string[] | any;
  '.anonymous': boolean;
  '.type': string;
  '.name': string;
  '.index'?: number;
}
