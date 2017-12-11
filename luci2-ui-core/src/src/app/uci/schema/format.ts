/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */


/**
 * Helper Class to validate named formats
 *
 *
 * A format can be defined directly by its `regex` or as an array of string of other primitive formats,
 * which means that it can be any of those formats
 */
export class Format {


  /** List of named formats */
  private static _formats = {
    ipaddr: ['ipv4', 'ipv6'],
    ipv4: /^(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
    // tslint:disable-next-line:max-line-length
    ipv6: /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/,
    // tslint:disable-next-line:max-line-length
    netmask4: /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/,
    // tslint:disable-next-line:max-line-length
    netmask6: /^([fF]{4}:){7}([fF]{3}[fFeEcC80]|[fF]{2}[fFeEcC80]0|[fF][fFeEcC80]00|[fFeEcC8]000|:)|([fF]{4}:){1-6}([fF]{3}[fFeEcC80]:|[fF]{2}[fFeEcC80]0:|[fF][fFeEcC80]00:|[fFeEcC8]000:)?:$/,
    // tslint:disable-next-line:max-line-length
    cidr4: /^(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\/([0-9]|[1-2][0-9]|3[0-2]))$/,
    // tslint:disable-next-line:max-line-length
    cidr6: /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(\/([0-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8]))?$/,
    ipmask4: [/^([^\/]*)\/(.*)$/, 'ipv4', 'netmask4'],
    ipmask6: [/^([^\/]*)\/(.*)$/, 'ipv6', 'netmask6'],
    macaddr: /^(?:[a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/,
    host: ['hostname', 'ipv4', 'ipv6'],
    hostname: /^(?:(?:[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*(?:[A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
    wpakey: /^[a-zA-Z0-9]{8,63}|[a-fA-F0-9]{64}$/,
    wepkey: /^[a-zA-Z0-9]{5}|[a-zA-Z0-9]{13}|[a-fA-F0-9]{10}|[a-fA-F0-9]{26}$/,
    uci_value: /^[\t\n\r\x20-\x7E]*$/,
    uci_name: /^[\w_]*$/,
    uci_type: /^[\x20-\x7E]*$/
  };

  format: string;

  /** Creates a validator instance for the specified named `format` */
  constructor(format: string) {
    if (format in Format._formats) {
      this.format = format;
    } else this.format = null;
  }

  /** Validates `value` against the registered format.
   * Inexistent named format allways validate to true
   */
  validate(value: string): boolean {
    if (!this.format) return true;
    return this._validateItem(Format._formats[this.format], value);

  }

  toString(): string {
    return this.format;
  }

  private _validateItem(item: Array<string | RegExp> | string | RegExp, value: string): boolean {
    let result = false;

    if (Array.isArray(item)) {
      for (const subitem of item) {
        result = result || this._validateItem(subitem, value);
        if (result) break;
      }
    } else if (typeof item === 'string') {
      result = this._validateItem(Format._formats[item], value);
    } else if (item instanceof RegExp) {
      result = item.test(value);
    }

    return result;
  }
}
