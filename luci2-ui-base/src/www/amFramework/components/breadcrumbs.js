/**
 * @ngdoc directive
 * @name amfBreadcrumbs
 * @module amFramework
 *
 * @restrict E
 *
 * @description
 * `<amf-breadcrumbs>` Generates a breadcrumbs navigations showing the state hierarchy of ui.router
 *
 * @param labelProperty {string=} Property in the `data` state's property to use as dislplay string
 * for the breadcrumb. If not supplied it will default to the state's name
 * @param limitTo {integer=} Only show the last n leveles of the state hierarchy
 * @param limitToXs {integer=} Media aware level limit
 * @param limitToGtXs {integer=} Media aware level limit
 * @param limitToSm {integer=} Media aware level limit
 * @param limitToGtSm {integer=} Media aware level limit
 * @param limitToMd {integer=} Media aware level limit
 * @param limitToGtMd {integer=} Media aware level limit
 * @param limitToLg {integer=} Media aware level limit
 * @param limitToGtLg {integer=} Media aware level limit
 * @param limitToXl {integer=} Media aware level limit
 *
 */

angular.module('amFramework')
	.component('amfBreadcrumbs', {
		restrict: 'E',
		transclude: false,
		bindings: {
			labelProperty: '@',
			limitTo: '@',

			limitToXs: '@',
			limitToGtXs: '@',
			limitToSm: '@',
			limitToGtSm: '@',
			limitToMd: '@',
			limitToGtMd: '@',
			limitToLg: '@',
			limitToGtLg: '@',
			limitToXl: '@'
		},
		templateUrl: 'amFramework/components/breadcrumbs.tmpl.html',
		controller: BreadcrumbsCtrl
	});

function BreadcrumbsCtrl($transitions, $state) {
    // Private data
	var self = this;
	var mediaStyles = {
		limitTo: 'hide',
		limitToXs: 'hide-xs',
		limitToGtXs: 'hide-gt-xs',
		limitToSm: 'hide-sm',
		limitToGtSm: 'hide-gt-sm',
		limitToMd: 'hide-md',
		limitToGtMd: 'hide-gt-md',
		limitToLg: 'hide-lg',
		limitToGtLg: 'hide-gt-lg',
		limitToXl: 'hide-xl'
	};

    // Public Methods & Event Handlers
	this.$onInit = $onInit;
	this.hideClass = hideClass;

    // Construction
	$transitions.onStart({}, _onTransition);

    // Implementation
	function $onInit() {
		self.dest = $state.$current;

		if (!self.labelProperty) self.labelProperty = 'name';
	}

	function hideClass(index) {
		var style = {};
		var depth = self.dest.path.length - 1 - index;

		for (var prop in mediaStyles)
			if (depth > self[prop]) style[mediaStyles[prop]] = true;

		return style;
	}

	function _onTransition(trans) {
		self.dest = trans.$to();
	}
}
