/**
 * @ngdoc directive
 * @name amfToolbarButtons
 * @module amFramework
 *
 * @restrict E
 *
 * @description
 * `<amf-toolbar-buttons>` Generates a toolbar icon menu which opens popup menues with actions
 *
 * @param buttons {!Array<Object>=} Array of button definition with the following properties:
 *      - `icon` - `{string=}`: Icon to display on the menu. It must be a named SVG already loaded.
 *      - `lagel` - `{string=}`: Label to display on the menu.
 *		- `badge` - `{string=}`: Badge to display over the icon button.
 * 		- `onClick` -  `{function()=}`: Function that is called when an item is clicked.
 *      - `menu` - `{!Array<Object>=}`: Array of children nodes, with the same structure
 *
 */
angular.module('amFramework')
	.component('amfToolbarButtons', {
		replace: false,
		transclude: false,
		bindings: { buttons: '<' },
		templateUrl: 'amFramework/components/toolbarButtons.tmpl.html'
	});
