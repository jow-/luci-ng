/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { IUciConfigData, IUciConfigSchema } from '../backend/config.interface';
import { ConfigSchema } from '../schema/configSchema';

import { SectionData } from './section';

export class ConfigData {
  schema: ConfigSchema;

  sectionTypes: Array<[string, SectionData[]]> = [];

  /** Stores local UCI data in a plain object that can be queried with jsonPath */
  store: IUciConfigData;

  constructor(name: string, data: IUciConfigData, schema?: IUciConfigSchema) {
    this.schema =
      typeof schema === 'object' && schema.type === 'object'
        ? new ConfigSchema(name, schema, data)
        : new ConfigSchema(name, undefined, data);

    this.store = { '.config': this };

    for (const key in data)
      if (data.hasOwnProperty(key)) {
        const type = data[key]['.type'];
        const section = new SectionData(this, data[key], this.schema.sections.get(type));
        const typeStore = this.store[`@${type}`] || (this.store[`@${type}`] = []);
        const typeData = this.getSections(type);

        // Add to data
        if (!typeData) this.sectionTypes.push([type, [section]]);
        else typeData.push(section);

        // Add to store by type and by name
        typeStore.push(section.store);
        this.store[key] = section.store;
      }
  }

  getSection(name: string): SectionData {
    return this.store[name] && this.store[name]['.section'];
  }
  getSections(type: string): SectionData[] {
    const sections = this.sectionTypes.find(e => e[0] === type);
    return (sections && sections[1]) || [];
  }

  getSectionsByAction(action: number): SectionData[] {
    const sections = [];

    for (const type of this.sectionTypes)
      for (const sec of type[1]) if (sec.action === action) sections.push(sec);

    return sections;
  }

  getTypes(): Array<[string, SectionData[]]> {
    return this.sectionTypes;
  }
}
