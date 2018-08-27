/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { IUciConfigData, IUciConfigSchema } from '../backend/config.interface';

import { SectionSchema } from './sectionSchema';

/**
 * Config: object that models an `uci config file` schema information.
 * It can be constructed from an explicit `schema` or implicitly from the uci data
 */
export class ConfigSchema {
  name: string;
  title: string;
  description = '';

  sections: Map<string, SectionSchema>;

  constructor(name: string, schema?: IUciConfigSchema, data?: IUciConfigData) {
    this.sections = new Map<string, SectionSchema>();
    this.name = this.title = name;
    if (typeof schema === 'object' && schema.type === 'object') {
      this.title = schema.title || name;
      this.description = schema.description || '';

      for (const sec in schema.properties)
        if (schema.properties.hasOwnProperty(sec)) {
          this.sections.set(sec, new SectionSchema(sec, schema.properties[sec]));
        }
    }
    if (data) this.updateFromData(data);
  }

  updateFromData(data: IUciConfigData): void {
    if (typeof data === 'object') {
      for (const sec in data)
        if (data.hasOwnProperty(sec) && data[sec]['.type']) {
          if (this.sections.has(data[sec]['.type']))
            this.sections.get(data[sec]['.type'])!.updateFromData(data[sec]);
          else this.sections.set(sec, new SectionSchema(sec, undefined, data[sec]));
        }
    }
  }
}
