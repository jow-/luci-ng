/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface IPopupDialogData {
  icon?: string;
  message: string;
  okLabel?: string;
  cancelLabel?: string;
  spinner?: boolean;
}

export const APP_POPUP_OPTS = {
  maxWidth: '100vw',
  maxHeight: '100vh',
  panelClass: 'app-popup-panel',
};

@Component({
  selector: 'app-popup-dialog',
  templateUrl: 'popup.component.html',
  styleUrls: ['popup.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PopupDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PopupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPopupDialogData
  ) {}

  setMessage(message: string): void {
    this.data.message = message ?? '';
  }
  setSpinner(state: boolean): void {
    this.data.spinner = state;
  }
  setIcon(icon: string): void {
    this.data.icon = icon;
  }

  setData(data: Partial<IPopupDialogData>): void {
    this.data = { ...this.data, ...data };
  }
}
