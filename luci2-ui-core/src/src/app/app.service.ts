/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { InjectionToken } from '@angular/core';
import { IRxProperties } from 'espression-rx';

export interface AppState extends IRxProperties<AppState> {
  pollState: boolean;
  userName: string;
}
export const APP_STATE = new InjectionToken<AppState>('AppSate');
