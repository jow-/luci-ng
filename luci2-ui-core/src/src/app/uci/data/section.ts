/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */
import { IUciAddSectionParam, IUciSetParam } from '../backend/actions.interface';
import { IUciSectionData, IUciSectionSchema } from '../backend/section.interface';
import { SectionSchema } from '../schema/sectionSchema';

import { ConfigData } from './config';
import { OptionData } from './option';

/**
 * SectionData: object that models an `uci section` data.
 * It holds current and old data for section name and order.
 * It controls current sate and validations.
 * It can be constructed manually or from the uci data
 */
export class SectionData {
  schema: SectionSchema;

  oldName: string;
  index: number | undefined;
  oldIndex: number | undefined;

  /** Action to perform -1: delete | 0: set | 1: add */
  action: number;

  options: OptionData[];

  store: IUciSectionData;

  /** Gets current data from store */
  get name(): string {
    return this.store['.name'];
  }
  set name(name: string) {
    this.store['.name'] = name;
  }
  constructor(
    public config: ConfigData,
    data: IUciSectionData,
    schema?: IUciSectionSchema | SectionSchema
  ) {
    this.schema =
      typeof schema === 'undefined'
        ? new SectionSchema(data['.type'], undefined, data)
        : schema instanceof SectionSchema
          ? schema
          : new SectionSchema(data['.type'], schema, data);

    this.store = {
      '.section': this,
      '.type': data['.type'],
      '.name': data['.name'],
      '.index': data['.index'],
      '.anonymous': data['.anonymous'],
    };

    this.oldName = this.name;
    this.oldIndex = data['.index'];

    this.action = 0;

    this.options = Array.from(this.schema.options.keys()).map(
      key => (this.store[key] = new OptionData(this, this.schema.options.get(key)!, data[key]))
    );
  }

  get isRenamed(): boolean {
    return this.name === this.oldName;
  }

  get isMoved(): boolean {
    return this.index === this.oldIndex;
  }

  delete(): void {
    this.action = -1;
    // TODO: remove reference from parent config store;
  }

  getOption(name: string): OptionData | undefined {
    return this.options.find(o => o.schema.name === name);
  }
  getModifiedOptions(): OptionData[] {
    return this.options.filter(o => o.isModified);
  }

  getAddedParams(): IUciAddSectionParam | null {
    if (this.action !== 1) return null;

    const param: IUciAddSectionParam = {
      config: this.config.schema.name,
      type: this.schema.type,
      name: this.name,
    };

    if (this.options.length) {
      param.values = {};

      for (const opt of this.options) {
        param.values[opt.schema.name] = opt.uciValue;
      }
    }

    return param;
  }

  getModifiedParams(): IUciSetParam | null {
    if (this.action !== 0) return null;

    const param: IUciSetParam = {
      config: this.config.schema.name,
      section: this.name,
      values: {},
    };

    if (this.options.length) {
      let values = param.values;
      for (const opt of this.getModifiedOptions()) {
        if (!values) values = {};
        values[opt.schema.name] = opt.uciValue;
      }
      param.values = values;
    }
    return param;
  }
}
