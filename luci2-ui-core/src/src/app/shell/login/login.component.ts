/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { IJsonrpcError } from '../../shared/jsonrpc.interface';

import { ILogin } from './ILogin.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent {
  user = '';
  password = '';
  errorMessage: string | undefined;

  constructor(
    private _dialogRef: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) private _loginService: ILogin
  ) {}

  login(): void {
    this._loginService.login(this.user, this.password).subscribe(
      s => this._dialogRef.close(s),
      (e: IJsonrpcError) => {
        this.errorMessage =
          e.layer === 'ubus' && e.code === 6
            ? 'Invalid username/password'
            : `${e.layer} error ${e.code}: ${e.message}`;
      }
    );
  }
}
