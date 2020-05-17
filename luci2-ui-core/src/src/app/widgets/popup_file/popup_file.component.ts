/**
 * Copyright (c) 2018 Adrian Panella <ianchi74@outlook.com>
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  IterableDiffers,
  KeyValueDiffers,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  BaseSetOption,
  BaseWidget,
  CommonEventsDef,
  Expressions,
  multilineExpr,
  PopupComponent,
} from 'rx-json-ui';

export interface PopupFileWidgetOptions extends BaseSetOption {
  popupTitle: string;
  popupDescription: string;
  path: string;
  create: boolean;
  readonly: boolean;

  disabled: boolean;
}

export interface PopupFileEventDef extends CommonEventsDef {
  /** Validate the file content before saving */
  onValidate?: multilineExpr;

  /** Executed AFTER the file has been successfully saved */
  onSave?: multilineExpr;
}

@Component({
  selector: 'app-popup-file',
  templateUrl: './popup_file.component.html',
  styleUrls: ['./popup_file.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'set-row' },
})
export class SetPopupFileWidgetComponent extends BaseWidget<
  PopupFileWidgetOptions,
  undefined,
  PopupFileEventDef
> {
  constructor(
    cdr: ChangeDetectorRef,
    expr: Expressions,
    iterableDiffers: IterableDiffers,
    keyValueDiffers: KeyValueDiffers,
    ngElement: ElementRef,
    renderer: Renderer2,
    public dialog: MatDialog
  ) {
    super(cdr, expr, iterableDiffers, keyValueDiffers, ngElement, renderer);
  }

  openPopup(): void {
    if (!this.options.path) return;

    this.dialog.open(PopupComponent, {
      data: {
        content: {
          main: [
            {
              widget: 'textarea',
              bind: '$.file',
              if: `file = ubus('file', 'read', { path: '${this.options.path}' }, ${
                this.options.create ? `{4: '' }` : 'undefined'
              }), true`,
              options: { readonly: this.options.readonly },
              events: {
                onSetup: '$.file = file.data ?? ""',
                onValidate: this.widgetDef?.events?.onValidate,
              },
            },
          ],
          actions: [
            {
              widget: 'button',
              options: { title: this.options.readonly ? 'OK' : 'Cancel' },
              events: { onClick: '$dlg.close()' },
            },
            ...(this.options.readonly
              ? []
              : [
                  {
                    widget: 'button',
                    options: {
                      title: 'Save',
                      'disabled=': '!$form.valid',
                    },
                    events: {
                      onClick: `ubus('file', 'write', {path: '${
                        this.options.path
                      }', data: $.file.replace(/\\r\\n/g, '\\n') }) === null 
                              && $dlg.close()
                              && snackbar('Changes saved')
                              ${
                                this.widgetDef?.events?.onSave
                                  ? `&& (${this.widgetDef?.events?.onSave})`
                                  : ''
                              }`,
                    },
                  },
                ]),
          ],
        },
        title: this.options.popupTitle ?? this.options.title,
        context: this.context,
      },

      maxHeight: '100vh',
      maxWidth: '100vw',
      panelClass: 'wdg-popup-panel',
    });
  }
}
