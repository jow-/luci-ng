/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

import { IMenuItem } from '../menu/menu.interface';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ShellComponent implements OnInit {

  @Input() menu: IMenuItem;

  constructor(public media: BreakpointObserver, iconRegistry: MatIconRegistry, sanitizer: DomSanitizer)  {
    iconRegistry.addSvgIconSet(sanitizer.bypassSecurityTrustResourceUrl('./../../../assets/mdi.svg'));

  }

  ngOnInit() {
  }

}
