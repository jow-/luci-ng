/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { MatIconRegistry } from '@angular/material';
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

  constructor(public media: ObservableMedia, iconRegistry: MatIconRegistry, sanitizer: DomSanitizer)  {
    iconRegistry.addSvgIconSet(sanitizer.bypassSecurityTrustResourceUrl('./../../../assets/mdi.svg'));

  }

  ngOnInit() {
  }

}
