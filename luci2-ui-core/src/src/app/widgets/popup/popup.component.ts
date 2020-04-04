/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface IPopupDialogData {
  message: string;
  okLabel: string;
  cancelLabel?: string;
}

@Component({
  selector: 'dyn-popup-dialog',
  templateUrl: 'popup.component.html',
})
export class PopupDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PopupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IPopupDialogData
  ) {}
}
