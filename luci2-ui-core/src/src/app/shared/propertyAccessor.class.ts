/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

/**
* PropertyAccessor: helper Class to parse a `propertyAccessor` string and to evaluate an object/array
* to extract the corresponding property's data from it.
*
* If the property accessor string is any valid javastring notation, either dot or bracket or array.
*/
export class PropertyAccessor {


  // cache regular expression for reuse
  /**
   * RegExp to validate a property accessor/array item, it can be in either `dot notation` or `bracket notation` or `array index`
   *
   * @group1 property in dot notation
   * @group2 quote character (for bracket notation)
   * @group3 property in bracket notation
   * @group4 4array index
   */
  private static _re = /^(?:([$_A-Za-z][$_\w]*)|\[\s*(["'])((?:\\.|(?!\2).)*)\2\s*\]|\[\s*(\d+)\s*\])(?:\.|(?=\[)|$)/g;

  selector: string;

  private _parsed: (string | number)[];

  constructor(selector: string) {

    this.selector = selector;

    let match: string[] = [], property: string, len = selector.length;
    const parsed = [];

    if (/^\s*$/.test(selector)) return;

    PropertyAccessor._re.lastIndex = 0;

    while ((match = PropertyAccessor._re.exec(selector)) && match[0]) {

      property = match[1] || match[3] || match[4];

      // if in bracket notation, unescape quotes
      if (match[2])
        property = property.replace('\\' + match[2], match[2]);

      // tslint:disable-next-line:radix
      parsed.push(match[4] ? parseInt(property) : property);

      selector = selector.slice(PropertyAccessor._re.lastIndex);
      len -= PropertyAccessor._re.lastIndex;
      PropertyAccessor._re.lastIndex = 0;
    }


    if (len > 0) return;

    this._parsed = parsed;

  }

  /** Extract the property pointed by the accessor from the object/array
   * In any invalid case (bad data type or invalid accessor) it returns `undefined`
   */
  get(data: Object | any[]): any {
    if (!this._parsed || (!Array.isArray(data) && typeof data !== 'object')) return undefined;

    let current = data;

    for (const key of this._parsed) {
      if (!Array.isArray(current) && typeof current !== 'object') return undefined;
      current = current[key];
    }

    return current;
  }
}


