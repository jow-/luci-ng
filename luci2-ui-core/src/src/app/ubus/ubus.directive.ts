/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import 'rxjs/add/operator/repeatWhen';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/do';

import {
  ChangeDetectorRef,
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { UbusService } from './ubus.service';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';


export class UbusContext {
  result: any;
  error: any;
  $implicit: any;
  count: number;
  keys: string[];
}

@Directive({
  selector: '[appUbus]',
})
export class UbusDirective implements OnChanges, OnDestroy {
  repeatInterval = 0;
  service: string;
  method: string;
  params: Object;

  private _context: UbusContext = new UbusContext;
  private _hasView: boolean;
  private _subscription: Subscription;

  @Input() set appUbusRepeat(milliseconds: number) {
    console.log('set appUbusRepeat', milliseconds);
    milliseconds = typeof (milliseconds) === 'number' && milliseconds >= 0 ? milliseconds : 0;
    this.repeatInterval = milliseconds;
  }

  @Input() set appUbus(args: any) {
    console.log('set appUbus', args);
    this.service = null;
    if (typeof(args) === 'undefined')
      return;
    if (!Array.isArray(args) || typeof (args[0]) !== 'string' || typeof (args[1]) !== 'string')
      throw new Error('appUbus: input value must be [service: string, method: string, params?: Object|Array]');

    this.service = args[0];
    this.method = args[1];
    this.params = args[2];
  }

  constructor(private _templateRef: TemplateRef<UbusContext>, private _viewContainer: ViewContainerRef,
              private _changeDetector: ChangeDetectorRef, private _ubus: UbusService) { }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('onChange', changes);
    if (changes.appUbus && this.service) {
      this._unsubscribe();
      this._subscribe();
    }
    if (changes.appUbusRepeat && this.repeatInterval && this.service &&
      (!this._subscription || this._subscription.closed))
      this._subscribe();
  }

  ngOnDestroy() {
    this._unsubscribe();
  }


  private _subscribe(): void {
    this._unsubscribe();

    if (this.service && this.method) {
      this._context.count = 0;
      this._subscription = this._ubus.call(this.service, this.method, this.params)
        .repeatWhen(
        o =>
          this.repeatInterval ? o.delay(this.repeatInterval).do( d => this._context.count++) : Observable.empty())
        .retryWhen(
        o =>
          this.repeatInterval ? o.delay(this.repeatInterval).do( d => this._context.count++) : Observable.throw(o))
        .subscribe(
        r => {
          this._context.result = this._context.$implicit = r;
          this._context.keys = Object.keys(r);
          if (!this._hasView) {
            this._viewContainer.createEmbeddedView(this._templateRef, this._context);
            this._hasView = true;
          }
          this._changeDetector.markForCheck();
        },
        e => {
          this._context.error = this._context.$implicit = e;
          this._context.result = null;
          if (this._hasView) this._viewContainer.clear();
          this._hasView = false;
          this._subscription = null;
          this._changeDetector.markForCheck();
        },
        () => {
          this._subscription = null; });
    }

  }

  private _unsubscribe() {
    if (this._subscription) {
      this._subscription.unsubscribe();
      this._subscription = null;
    }
  }
}
