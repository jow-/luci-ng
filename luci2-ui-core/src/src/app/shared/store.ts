/*!
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { RxObject } from 'espression-rx';

export class RxStore {
  _store = new Map();

  set(store: string, key: string, value: any): void {
    if (!this._store.has(store)) this._store.set(store, RxObject({}));
    this._store.get(store)[key] = value;
  }

  get(store: string, key: string): any {
    return this._store.get(store)[key];
  }

  has(store: string, key: string): boolean {
    return this._store.has(store) && key in this._store.get(store);
  }

  keys(store: string): string[] {
    return Object.keys(this._store.get(store));
  }

  values(store: string): string[] {
    return Object.values(this._store.get(store));
  }

  entries(store: string): Array<[string, any]> {
    return Object.entries(this._store.get(store));
  }

  delete(store: string): void {
    this._store.delete(store);
  }
}
