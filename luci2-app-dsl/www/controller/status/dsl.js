L2.registerController('StatusDslController',
['$q', '$scope', 'l2rpc', '$timeout', 'l2spin', function($q, $scope, l2rpc, $timeout, l2spin) {
	angular.extend($scope, {
		getDslStatus: l2rpc.declare({
			object: 'status.dsl',
			method: 'getDslStatus'
		}),
		
		loadDslStatus: function() {
			return $scope.getDslStatus().then(function(status) {
					$scope.dsl = status;
					$scope.$timeout = $timeout($scope.loadDslStatus, 5000);
			});
		}
	});

	l2spin.open();
	$scope.loadDslStatus().then(l2spin.close);
	
	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.$timeout);
	});
}]);
