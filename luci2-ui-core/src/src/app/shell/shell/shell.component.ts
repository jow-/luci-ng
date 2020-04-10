/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { UbusService } from '../../shared/ubus.service';
import { UciModel2 } from '../../uci/uci';
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
    public ubus: UbusService
  ) {
    iconRegistry.addSvgIconSet(
      sanitizer.bypassSecurityTrustResourceUrl('assets/icons/default.svg')
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
}
