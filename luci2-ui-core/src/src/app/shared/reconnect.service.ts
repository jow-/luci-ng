/*!
 * Copyright (c) 2020 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, retryWhen, switchMap } from 'rxjs/operators';

import { AppState, APP_STATE } from '../app.service';
import {
  APP_POPUP_OPTS,
  IPopupDialogData,
  PopupDialogComponent,
} from '../widgets/popup/popup.component';

@Injectable({
  providedIn: 'root',
})
/** Service to reconnect  */
export class ReconnectService {
  defaultLocations = ['192.168.1.1', 'openwrt.lan'];
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    @Inject(APP_STATE) private appState: AppState
  ) {}

  reconnect(
    tryLocations?: string[],
    useDefault: boolean = true,
    delay: number = 15000
  ): Observable<boolean> {
    tryLocations = [
      ...(tryLocations ?? []),
      ...(useDefault ? this.defaultLocations : []),
    ];

    if (!tryLocations.length) tryLocations = this.defaultLocations;

    let idx = 0;

    // stop polling
    this.appState.pollState = false;

    const dlg = this.dialog.open(PopupDialogComponent, {
      ...APP_POPUP_OPTS,
      disableClose: true,

      data: {
        message: 'Waiting to reconnect...',
        spinner: true,
        icon: 'information-outline',
      } as IPopupDialogData,
    });

    // give an initial time for the device to come up
    return timer(delay).pipe(
      // use new call on retry to reevaluate URL parameter
      switchMap(() =>
        this.http.get<HttpResponse<any>>(
          `http://${tryLocations![idx % tryLocations!.length]}`,
          {
            observe: 'response',
            headers: new HttpHeaders({ timeout: '' }),
          }
        )
      ),

      // retry if not a server error --> couldn't reach it
      retryWhen((o: Observable<HttpErrorResponse>) =>
        o.pipe(
          map((e: HttpErrorResponse) => {
            if (e.error instanceof ProgressEvent && ++idx < 2 * tryLocations!.length) {
              dlg.componentInstance.setData({
                message: `Couldn't reach device! Still retrying (${idx})...`,
                icon: 'alert-circle-outline',
              });
              return of(null);
            }
            throw e;
          })
        )
      ),

      // if we have received an error response from target, it means it is up
      catchError((e: HttpErrorResponse) => {
        if (e.error instanceof ProgressEvent) return of(false);
        return of({ url: e.url });
      }),

      // navigate to location if successful
      map((res: any) => {
        if (res?.url) window.location = res.url;
        else
          dlg.componentInstance.setData({
            message: 'Device unreachable.',
            spinner: false,
            icon: 'alert-outline',
          });
        return !!res.url;
      })
    );
  }
}
