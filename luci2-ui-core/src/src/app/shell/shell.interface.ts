/*!
 * Copyright (c) 2017 Adrian Panella <ianchi74@outlook.com>, contributors.
 * Licensed under the MIT license.
 */

export interface IMenuNode {
  title: string; // Label to display on the menu
  tooltip?: string;
  svgIcon?: string; // icon to show on the menu ([namespace:]iconName), it must been previously loaded
  link: string; // Route to activate when clicked. Ignored if the node has children.
  // If empty and childless node, the item will be shown as disabled.
  disabled?: boolean; // disable the item
  open?: boolean; // default state

  childs?: IMenuNode[];
  hideChilds?: boolean;
}
