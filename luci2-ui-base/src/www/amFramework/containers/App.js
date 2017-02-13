'use strict';

angular
	.module('amFramework')
	.component('amfApp', {
		templateUrl: 'amFramework/containers/App.tmpl.html',
		controller: AppController,
		bindings: {
			sideMenu: '<',
			toolbar: '<',
			onClick: '&'
		},
		transclude: {
			title: '?amfAppTitle',
			content: '?amfAppContent',
			footer: '?amfAppFooter'
		}
	});

function AppController($mdSidenav, $timeout) {
	this.openMenu = function() {
		$timeout(function() {
			$mdSidenav('left').open();
		});
	};
}
