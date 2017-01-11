L2.registerController('NetworkInterfacesController', function($scope, l2uci) {
	l2uci.load('wireless').then(function() {
		angular.element('[ng-view]').html(angular.toJson(l2uci.get('wireless', 'radio0'), true));
	});
});
