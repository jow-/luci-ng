/**
 * @ngdoc directive
 * @name amfSideMenuItem
 * @module amFramework
 *
 * @restrict E
 *
 * @description
 * `<amf-side-menu-item>` Internal directive representing a specific item of a amfSideMenu.
 * It is not intended to be used directly
 *
 * @param nodes {!Array<Object>=} Array of nodes with menu data that have the
 *      following properties:
 *      - `node` - `{!Object=}`: Object with node information
 *      - `level` - `{integer=}`: Level of the node in the tree. Root elements have `0` level
 *      and each child level increases by one. It will set a class `.amf-menu-item-<level>`
 *      that can be used to customize specific level appearence.
 *
 */
angular.module('amFramework')
	.component('amfSideMenuItem', {
		transclude: false,
		bindings: {
			level: '@',
			node: '<'
		},
		templateUrl: 'amFramework/components/sideMenuItem.tmpl.html',
		require: {
			menu: '^^amfSideMenu',
			sidenav: '?^^mdSidenav'
		},
		controller: SideMenuItemCtrl
	});


function SideMenuItemCtrl() {
    // Private data
	var self = this;

    // Public Methods & Event Handlers
	this.click = click;

    // Construction

    // Implementation
	function click() {
		self.node.isOpen = !self.node.isOpen;
		if ((!self.node.childs || !self.node.childs.length) && self.node.sref && self.sidenav)
			self.sidenav.close();

		if (typeof self.menu.onClick == 'function')
			self.menu.onClick(self.node);
	}
}
