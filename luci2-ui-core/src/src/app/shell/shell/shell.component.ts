/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AppState, APP_STATE } from '../../app.service';
import { ReconnectService } from '../../shared/reconnect.service';
import { UbusService } from '../../shared/ubus.service';
import { UciModel2 } from '../../uci/uci';
import {
  APP_POPUP_OPTS,
  PopupDialogComponent,
} from '../../widgets/popup/popup.component';
import { IMenuItem } from '../menu/menu.interface';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  @Input()
  menu: IMenuItem | undefined;

  saving = false;

  isMediaSmall = false;
  constructor(
    public media: BreakpointObserver,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    public cdr: ChangeDetectorRef,
    public uci: UciModel2,
    public ubus: UbusService,
    public dialog: MatDialog,
    public reconnect: ReconnectService,
    @Inject(APP_STATE) public appState: AppState
  ) {
    iconRegistry.addSvgIconSet(
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/default.svg')
    );

    // OpenWrt brand icons (logo & wordmark)
    iconRegistry.addSvgIconSetInNamespace(
      'openwrt',
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/openwrt.svg')
    );

    media.observe('(max-width: 599px)').subscribe((isMatched) => {
      this.isMediaSmall = isMatched.matches;
      cdr.markForCheck();
    });
  }

  saveUCI(): void {
    this.saving = true;
    this.uci
      .save()
      .subscribe({ complete: () => ((this.saving = false), this.cdr.markForCheck()) });
  }

  logout(): void {
    this.ubus.logout().subscribe();
  }

  reboot(): void {
    this.dialog
      .open(PopupDialogComponent, {
        ...APP_POPUP_OPTS,
        data: {
          message: 'Are you sure you want to restart the device?',
          okLabel: 'OK',
          cancelLabel: 'Cancel',
        },
      })
      .afterClosed()
      .pipe(
        switchMap((res) =>
          res
            ? this.ubus
                .call('system', 'reboot')
                .pipe(
                  switchMap(() => this.reconnect.reconnect([window.location.host], false))
                )
            : of(false)
        )
      )
      .subscribe();
  }
}
