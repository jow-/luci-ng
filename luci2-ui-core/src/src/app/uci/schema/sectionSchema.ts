/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { OptionSchema } from './optionSchema';
import { IUciSectionSchema, IUciSectionData } from '../backend/section.interface';

/**
 * SectionSchema: object that models an `uci section` schema information.
 * It holds all its option definition and name validation logic.
 * It can be constructed from an explicit `schema` or implicitly from the uci data
 */
export class SectionSchema {

  // General Info Properties
  type: string;
  title: string;
  description = '';

  // Name Rules

  anonymous = false;
  pattern: string;
  unique: boolean;
  default: string;

  // Validations

  minLength = 0;
  maxLength: number;
  freezed = false;

  options: Map<string, OptionSchema>;


  constructor(type: string, schema: IUciSectionSchema, data?: IUciSectionData) {
    this.type = type;
    this.options = new Map<string, OptionSchema>();

    // if we have a backend schema info use it to construct the object
    if (typeof schema === 'object') {

      this.title = schema.title || type;
      this.description = schema.description || '';

      this.anonymous = !!schema.anonymous;
      this.pattern = schema.pattern;
      this.default = schema.default || type;

      this.minLength = schema.minLength || 0;
      this.maxLength = schema.maxLength;

      /** Indicates if properties outside of the schema are allowed */
      this.freezed = !!schema.freezed;


      for (const prop in schema.properties) {
        if (schema.properties.hasOwnProperty(prop)) {
          this.options.set(prop, new OptionSchema(prop, schema.properties[prop]));
        }
      }
    } else if (typeof data === 'object' && data['.type']) {
      this.title = type;

      this.anonymous = data['.anonymous'];
      this.default = type;

    }

    // if data has additional properties add them to the schema
    this.updateFromData(data);
  }


  updateFromData(data: IUciSectionData) {
    if (typeof data === 'object' && data['.type'] && !this.freezed) {
      for (const prop in data) {
        if (data.hasOwnProperty(prop) && prop.charAt(0) !== '.' && !this.options.has(prop)) {
          this.options.set(prop, new OptionSchema(prop, data[prop]));
        }
      }
    }
  }

  validate(name: string): boolean {
    return true;
  }
}
