/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Option } from './option';
import { IUciOptionSchema, IUciSection, IUciSectionSchema, UciActions } from './uci.interface';

export class Section implements IUciSectionSchema {
  type: string;
  anonymous: boolean;
  name: string;
  oldName: string;
  index: number;
  oldIndex: number;

  // Optional Header section
  title?: string;				    // Title of the section. Defalut: section_type, if annonymus 'section_type #'
  description?: string;			// General description of the section. Default:
  info?: string;  					// Additional info on the section. Default:


  options: Option[] = [];

  action = UciActions.Add;



  constructor(uci: IUciSection, public schema?: IUciSectionSchema) {

    this.type = uci['.type'];
    this.anonymous = uci['.anonymous'];
    this.name = uci['.name'];
    this.oldName = this.name;
    this.index = uci['.index'] || 0;
    this.oldIndex = this.index;

    if (typeof schema === 'object') {
      this.title = schema.title || this.type;
      this.description = schema.description || '';
      this.info = schema.info || '';

      if (!Array.isArray(schema.options)) schema.options = [];

    } else {
      this.title = this.type;
      this.description = '';
      this.info = '';

      schema = <IUciSectionSchema>{ options: [] };
    }

    this.options = Object.keys(uci)
      .filter((key: string) =>
        key.charAt(0) !== '.')
      .map(key =>
        new Option(key, uci[key], schema.options.find((o: IUciOptionSchema) => o.name === key))
      );

    this.action = UciActions.Set;


  }

  getOption(name: string): Option {
    return this.options.find(o => o.name === name);
  }

  delete() {
    this.action = UciActions.Delete;
  }

  getModifiedOptions(): Object {
    const modified = {};
    const filtered = this.options.filter( o => o.isModified );

    if (!filtered.length) return undefined;

    filtered.forEach( o => modified[o.name] = o.value);

    return modified;
  }

  get isRenamed(): boolean {
    return this.name === this.oldName;
  }

  get isMoved(): boolean {
    return this.index === this.oldIndex;
  }
}
