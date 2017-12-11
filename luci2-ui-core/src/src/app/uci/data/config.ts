/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { SectionData } from './section';
import { ConfigSchema } from '../schema/configSchema';
import { IUciConfigData, IUciConfigSchema } from '../backend/config.interface';
export class ConfigData {
  schema: ConfigSchema;

  sectionTypes: [string, SectionData[]][] = [];

  constructor(name: string, data: IUciConfigData, schema?: IUciConfigSchema) {

    if (typeof schema === 'object' && schema.type === 'object') this.schema = new ConfigSchema(name, schema, data);
    else this.schema = new ConfigSchema(name, undefined, data);


    for (const key in data)
      if (data.hasOwnProperty(key)) {
        const type = data[key]['.type'];
        const sec = this.getSections(type);

        if (sec) {
          sec.push(new SectionData(this, data[key], this.schema.sections.get(type)));
        } else {
          this.sectionTypes.push([type, [new SectionData(this, data[key], this.schema.sections.get(type))]]);
        }
      }
  }

  getSections(type: string): SectionData[] {
    const sections = this.sectionTypes.find(e => e[0] === type);
    return sections && sections[1] || null;
  }

  getTypes() {
    return this.sectionTypes;
  }
}
