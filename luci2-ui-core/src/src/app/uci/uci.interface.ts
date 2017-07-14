
/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */



export interface IUciSection {
  '.anonymous': boolean;
  '.type': string;
  '.name': string;
  '.index'?: number;
  [options: string]: string | string[] | any;
}

export interface IUciConfig {
  [section: string]: IUciSection
}


export interface IUciOptionSchema {
  name: string;
  title: string;
  description: string;

  type: string;
  isList: boolean;
  required: boolean;
  validation: string;

  values: string[];
}

export interface IUciSectionSchema {
  type: string;
  anonymous: boolean;

  // Optional Header section
  title?: string;				    // Title of the section. Defalut: section_type
  description?: string;			// General description of the section. Default:
  info?: string;  					// Additional info on the section. Default:

  options: IUciOptionSchema[];

}

export interface IUciConfigSchema {

  // Optional Header section
  title?: string;				    // Title of the config file. Defalut: config file name
  description?: string;			// General description of the config file. Default: ""
  info?: string;  					// Additional info on the config. Default: ""

  sections: IUciSectionSchema[]; // Only one definition per section type

}


export enum UciActions {
  Set,
  Add,
  Delete
}
