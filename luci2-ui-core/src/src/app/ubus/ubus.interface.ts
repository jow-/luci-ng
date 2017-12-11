/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */


 /** Defines a query to get data from an UBUS service and transformation/filter to apply to the result */
export interface IUbusQuery {

  /** ubus `service, method, params` to call */
  call: [ string, string, {[param: string]: any}];

  /** Selects a specific member from the returned object. If empty or not preset the whole return object is selected.
   * The itemSelector syntax is like normal object syntax in code:
   * `<propertyName>.<propertyName>.<propertyName>`
   *
   * `<propertyName>[<itemNumber>].<prpertyName>`
   *
   * `[<itemNumber>]` (it's an exception when the returned data is directly an array instead of an object)
   */
  item?: string;

  /** Transforms selected item, extracting specific data from each of its members (array items or property values).
   * The submember is in the same `itemSelector` syntax.
   */
  subItem?: string;

  /** If `true` and subItem is an object/array, concatenate all subItems in one array */
  concat?: boolean;
  /** Transforms `Objects` into `Arrays`, keeping the `key` or the `value`.
   * defaults to value
   */
  toArray?: string;

  /** Subitem of each item/prop of the listItem to use as base for testing the filter  */
  filterBy?: string;
  /** RegExp patter to use to test filter */
  pattern?: string;

  /** If present, sets the autoupdate interval of the query. In milliseconds */
  autoupdate?: number;

}
