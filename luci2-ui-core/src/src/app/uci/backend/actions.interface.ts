/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

/**
 * Params used to call `UCI ADD` to add a section (and its options) to a config
 * The call returns an  IUciAddSectionRet` object
 */
export interface IUciAddSectionParam {
  config: string;
  type: string;
  name?: string;
  values?: { [option: string]: string | string[] };
}

/**
 * Return object of call to `UCI ADD`
 * The name assigned to this section
 */
export interface IUciAddSectionRet {
  section: string;
}

/**
 * Params used to call `UCI DELETE` to delete a section (or its options)
 * The call doesn't return any object
 */
export interface IUciDeleteParam {
  config: string;
  /**
   * Specific section to delete from
   * If not specified a `type` and `match` filter must be provided
   */
  section?: string;
  /** Filters sections by type */
  type?: string;
  /** Filters sections by options value */
  match?: { [option: string]: string | string[] };
  /**
   * Array of options to remove from the section.
   * If present it takes precedence over `option`
   * If no option/options is present, delete entire section
   */
  options?: string[];
  option?: string;
}

/**
 * Params used to call `UCI SET` to modify/add a section's options
 * The call doesn't return any object
 */
export interface IUciSetParam {
  config: string;
  /**
   * Specific section to delete from
   * If not specified a `type` and `match` filter must be provided
   */
  section?: string;
  /** Filters sections by type */
  type?: string;
  /** Filters sections by options value */
  match?: { [option: string]: string | string[] };
  /** Array of options to modify/add in the section. */
  values: { [option: string]: string | string[] };
}
