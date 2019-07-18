/*!
 * Copyright (c) 2019 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { UbusService } from './ubus.service';

@Injectable({
  providedIn: 'root',
})
export class CgiService {
  private a: HTMLAnchorElement = document.createElement('a');

  constructor(
    private http: HttpClient,
    private ubus: UbusService,
    private snackbar: MatSnackBar
  ) {
    this.a.style.display = 'none';
    document.body.appendChild(this.a);
  }

  private save(data: Blob, name: string): void {
    this.a.href = window.URL.createObjectURL(data);
    this.a.download = name;
    this.a.click();
    this.a.href = '';
  }

  upload(path: string, mode: string, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('sessionid', this.ubus.sid);
    fd.append('filename', path);
    fd.append('filemode', mode);
    fd.append('filedata', file);

    return this.http.post('/cgi-bin/luci-upload', fd).pipe(
      catchError((e: HttpErrorResponse) => {
        this.snackbar.open('Error uploading file', 'close', {
          duration: 5000,
        });
        console.log(e);
        return of(undefined);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  backup(): Observable<any> {
    return this.http
      .post('/cgi-bin/luci-backup', `sessionid=${this.ubus.sid}`, {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        observe: 'body',
        responseType: 'blob',
      })
      .pipe(
        map(file => this.save(file, 'backup.tar.gz')),
        catchError((e: HttpErrorResponse) => {
          this.snackbar.open('Error downloading backup', 'close', {
            duration: 5000,
          });
          console.log(e);
          return of(undefined);
        })
      );
  }
}
