/**
 * @ngdoc directive
 * @name amfNavTabs
 * @module amFramework
 *
 * @restrict E
 *
 * @description
 * `<amf-nav-tabs>` Combines a Tabbed navigation with an ui-view routing.
 * It provides sync of url/tabs and and embeded view content, integrated with ui-router.
 * It is intended to be used directly in the 'component' attribute of a parent state.
 * In a way it's similar to mdNavBar but it provides the bar pagination needed for scrolling in small devices,
 * but only allows dynamic creation from an object data, and no explicit markup definition of tabs.
 *
 * @param tabs {!Array<Object>=} Array of tabs with title and sref data
 *      following properties:
 *      - `title` - `{string=}`: String to show on the tab
 *      - `sref` - `{string=}`: State name to link this tab to
 *      - `disabled` - `{bool=}`: True if the tab is disabled (not clickable)
 *
 */

angular.module('amFramework')
	.component('amfNavTabs', {
		transclude: false,
		bindings: { tabs: '<' },
		templateUrl: 'amFramework/components/navTabs.tmpl.html',
		controller: NavTabsCtrl
	});


function NavTabsCtrl($transitions, $state) {
	var self = this;
    // Private data
	self.selectedIndex = 0;

	self.$onDestroy = $transitions.onSuccess({ to: $state.$current.name + '.**' }, transHook);

	self.syncSref = function(tab) {
		$state.go(tab.sref);
	};

	function transHook(transition) {
		var toSref = transition.$to().name;
		for (var i=0; i<self.tabs.length; i++)
			if ( toSref == self.tabs[i].sref) {
				self.selectedIndex = i;
				break;
			}
	}
}
