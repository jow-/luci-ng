/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */


export class UciSelector {

  /**
   * Matchs an `option` selector in the form
   *
   * ((config.)section.)option
   *
   * (config.)@type[match].option
   * @field 1: config
   * @field 2: sectionName
   * @field 3: sectionType
   * @field 4: match
   * @field 5: option
   */
  private static _reOption = /^(?:(?:([\w]+)\.)?(?:([\w]+)|(?:@([\w]+)\[(.*)\]))\.)?([\w]+)$/;
  /**
 * Matchs a `section name` selector in the form
 *
 * (config.)@type[match]
 * @field 1: config
 * @field 2: sectionType
 * @field 3: match
 */
  private static _reType = /^(?:([\w]+)\.)?(?:@([\w]+)\[(.*)\])$/;

  config: string;
  sectionName: string;
  sectionType: string;
  match: string;
  option: string;

  invalid = false;

  jsonPath: string;

  constructor(public text: string) {
    let match;

    // check for option selector
    if (match = UciSelector._reOption.exec(text)) {
      this.config = match[1];
      this.sectionName = match[2];
      this.sectionType = match[3];
      this.match = match[4];
      this.option = match[5];

    } else if (match = UciSelector._reType.exec(text)) {
      this.config = match[1];
      this.sectionType = match[2];
      this.match = match[3];

    } else this.invalid = true;

    this.jsonPath = '$';
    if (this.config) this.jsonPath += `.${this.config}`;
    if (this.sectionType) this.jsonPath += `['@${this.sectionType}'][${this.match}]`;
    else if(this.sectionName) this.jsonPath += `.${this.sectionName}`;
    if (this.option) this.jsonPath += `.${this.option}`;
    else this.jsonPath += `['.name']`;


  }
}
