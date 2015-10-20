L2.registerController('StatusDmesgController',
['$scope', 'l2rpc', '$timeout', 'l2spin', function($scope, l2rpc, $timeout, l2spin) {
	angular.extend($scope, {
		getKernelLog: l2rpc.declare({
			object: 'luci2.system',
			method: 'dmesg',
			expect: { log: '' }
		}),

		getLog: function() {
			return $scope.getKernelLog().then(function(log) {
				var lines = log.split(/\n/);

				lines.pop();

				$scope.log = lines.reverse().join('\n');
				$scope.lines = lines.length;

				$timeout($scope.getLog, 5000);
			});
		}
	});

	l2spin.open();
	$scope.getLog().then(l2spin.close);
}]);
