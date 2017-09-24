/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { IJsonrpcError } from '../../shared/jsonrpc.interface';
import { ILogin } from './ILogin.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {

  user: string;
  password: string;
  errorMessage: string;


  constructor(private _dialogRef: MatDialogRef<LoginComponent>, @Inject(MAT_DIALOG_DATA) private _loginService: ILogin) { }

  login() {

    this._loginService.login(this.user, this.password)
      .subscribe(
        s => this._dialogRef.close(s),
        (e: IJsonrpcError) => {
          if (e.layer === 'ubus' && e.code === 6)
            this.errorMessage = 'Invalid username/password';
          else
            this.errorMessage = `${e.layer} error ${e.code}: ${e.message}`;

        });
  }
}
