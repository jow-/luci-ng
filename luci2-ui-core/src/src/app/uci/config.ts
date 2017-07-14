/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { IUciConfig, IUciConfigSchema } from './uci.interface';
import { Section } from './section';

export class Config {
  title: string;
  description: string;
  info?: string;

  types: [string, Section[]][] = [];


  constructor(public name: string, uci: IUciConfig, public schema?: IUciConfigSchema) {
    let sections: Section[];

    if (typeof schema === 'object') {
      this.title = schema.title || name;
      this.description = schema.description || '';
      this.info = schema.info || '';
      if (!Array.isArray(schema.sections)) schema.sections = [];
    } else
      schema = <IUciConfigSchema> { sections: []};

    for (const sec of Object.keys(uci)) {
      sections = this.getSections(uci[sec]['.type']);
      if (!sections) {
        sections = [];
        this.types.push([uci[sec]['.type'], sections]); }


      sections.push(new Section(uci[sec], schema.sections.find( s => s.type === uci[sec]['.type'])));
    }
  }

  getSections(type: string): Section[] {
    const sections = this.types.find(e => e[0] === type);
    return sections && sections[1] || null;
  }

  getTypes() {
    return this.types;
  }

}
