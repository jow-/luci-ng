/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { SectionSchema } from '../schema/sectionSchema';
import { OptionData } from './option';

import { IUciSectionSchema, IUciSectionData } from 'app/uci/backend/section.interface';
import { ConfigData } from 'app/uci/data/config';

/**
 * SectionData: object that models an `uci section` data.
 * It holds current and old data for section name and order.
 * It controls current sate and validations.
 * It can be constructed manually or from the uci data
 */
export class SectionData {
  schema: SectionSchema;

  name: string;
  oldName: string;
  index: number;
  oldIndex: number;

  anonymous: boolean;

  /** Action to perform -1: delete | 0: set | 1: add */
  action: number;

  options: OptionData[];

  constructor(public config: ConfigData, data: IUciSectionData, schema?: IUciSectionSchema | SectionSchema) {


    if (typeof schema === 'undefined') this.schema = new SectionSchema(data['.type'], undefined, data);
    else if (schema instanceof SectionSchema) this.schema = schema;
    else this.schema = new SectionSchema(data['.type'], schema, data);

    this.name = data['.name'];
    this.oldName = this.name;
    this.index = data['.index'] || 0;
    this.oldIndex = this.index;
    this.anonymous = !!data['.anonymous'];

    this.action = 0;

    this.options = Object.keys(data)
      .filter((key: string) =>
        key.charAt(0) !== '.' && this.schema.options.has(key))
      .map(key =>
        new OptionData(this, this.schema.options.get(key), data[key])
      );
  }

  get isRenamed(): boolean {
    return this.name === this.oldName;
  }

  get isMoved(): boolean {
    return this.index === this.oldIndex;
  }

  delete() {
    this.action = -1;
  }

  getOption(name: string): OptionData {
    return this.options.find(o => o.schema.name === name);
  }
  getModifiedOptions(): OptionData[] {
    return this.options.filter(o => o.isModified);
  }

}
