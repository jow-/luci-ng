/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { IUciSectionData, IUciSectionSchema } from './section.interface';

/**
 * Config File Schema used by UCI backend
 */

export interface IUciConfigSchema {
  /** Must be `object` */
  type: string;

  /**  title of the UCI config */
  title?: string;
  /** description of the config */
  description?: string;

  /** Sections of the config file */
  properties: { [sectionType: string]: IUciSectionSchema };
}

export interface IUciConfigData {
  [section: string]: IUciSectionData;
}
