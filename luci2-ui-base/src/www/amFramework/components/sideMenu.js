/**
 * @ngdoc directive
 * @name amfSideMenu
 * @module amFramework
 *
 * @restrict E
 *
 * @description
 * `<amf-side-menu>` Generates a navigation menu with unlimited nested items.
 * If it is inside a mdSidenav, it will automatically close on click.
 *
 * Style can be customized by level using the `.amf-menu-item-<level>` class. Where root items
 * have a level of `00`.
 *
 * @param nodes {!Array<Object>=} Array of nodes with menu data that have the
 *      following properties:
 *      - `title` - `{string=}`: Label to display on the menu
 *      - `sref` - `{string=}`: State to activate when clicked. Ignored if the node has children.
 *      If a node doesn't have children and sref is empty, the item will be shown as disabled.
 *      - `isOpen` - `{boolean=}`: Get/sets if a node with children is currently open.
 *      - `childs` - `{!Array<Object>=}`: Array of children nodes, with the same structure
 * @param onClick {function(!node)=} Function that is called when an item is clicked.
 * It recives the current node object as a parameter.
 *
 */
angular.module('amFramework')
	.component('amfSideMenu', {
		transclude: false,
		bindings: {
			nodes: '<',
			onClick: '&'
		},
		templateUrl: 'amFramework/components/sideMenu.tmpl.html'
	});
