/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { BehaviorSubject, Subscription } from 'rxjs';
import { OptionData } from '../data/option';

/** Emmits boolean each time a dependant value changes, stating the new status of the dependency */
export class UciDependency {
  private _state: boolean;
  private _orCondition: string[];
  private _andCondition: string[];
  private _setCondition: boolean;
  private _subject: BehaviorSubject<boolean>;
  private _subscription: Subscription;
  constructor(public option: OptionData, condition: string[] | boolean) {

    if (typeof condition === 'boolean') this._setCondition = condition;
    else if (Array.isArray(condition)) {
      this._andCondition = condition.filter(d => d.charAt(0) === '!').map(d => d.slice(1));
      this._orCondition = condition.filter(d => d.charAt(0) !== '!').map(d => d.replace(/^\\!/, '!'));

      if (!this._andCondition.length) this._andCondition = null;
      if (!this._orCondition.length) this._orCondition = null;
    }


    // creates emmiter initialized to current state
    this._subject = new BehaviorSubject<boolean>(this.check(option.value));

    // listens to changes in the dependant value
    this._subscription = option.asObservable().subscribe(
      value => this.check(value)
    );
  }

  check(value): boolean {
    let state = true;
    // only check prescence
    if (!this._andCondition && !this._orCondition) state = !!value === this._setCondition;

    if (this._orCondition)
      state = this._orCondition.some(d => d === value);
    if (this._andCondition)
      state = state && this._andCondition.every(d => d !== value);

    if (!this._subject) return this._state = state;
    if (this._state !== state)
      this._subject.next(this._state = state);

    return state;
  }

  asObservable() {
    return this._subject.asObservable();
  }

  unsubscribe() {
    this._subject.complete();

    this._subscription.unsubscribe();
    this._subscription = null;
  }
}
