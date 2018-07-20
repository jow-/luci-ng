/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Input, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { IMenuItem } from '../menu/menu.interface';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent implements OnInit {

  @Input() menu: IMenuItem;

  isMediaSmall: boolean;
  constructor(public media: BreakpointObserver, iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, cdr: ChangeDetectorRef)  {
    iconRegistry.addSvgIconSet(sanitizer.bypassSecurityTrustResourceUrl('./../../../assets/mdi.svg'));

    media.observe('(max-width: 599px)').subscribe( isMatched => {
      this.isMediaSmall = isMatched.matches;
      cdr.markForCheck();
    });
  }

  ngOnInit() {
  }

}
