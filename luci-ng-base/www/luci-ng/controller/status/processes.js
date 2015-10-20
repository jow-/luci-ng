L2.registerController('StatusProcessesController',
['$q', '$scope', 'l2rpc', 'l2system', '$timeout', 'l2spin', 'gettext', function($q, $scope, l2rpc, l2system, $timeout, l2spin, gettext) {
	angular.extend($scope, {
		getProcessList: l2rpc.declare({
			object: 'luci2.system',
			method: 'process_list',
			expect: { processes: [ ] }
		}),

		sendSignal: l2rpc.declare({
			object: 'luci2.system',
			method: 'process_signal',
			params: [ 'pid', 'signal' ],
			filter: function(data) {
				return (data == 0);
			}
		}),

		getStatus: function() {
			return $scope.getProcessList().then(function(processes) {
				$scope.processes = processes;
				$scope.$timeout = $timeout($scope.getStatus, 5000);
			});
		}
	});

	l2spin.open();
	$scope.getStatus().then(l2spin.close);

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.$timeout);
	});
}]);
