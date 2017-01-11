L2.registerController('StatusSyslogController', function($scope, l2rpc, $timeout, l2spin) {
	angular.extend($scope, {
		getSystemLog: l2rpc.declare({
			object: 'luci2.system',
			method: 'syslog',
			expect: { log: '' }
		}),

		getLog: function() {
			return $scope.getSystemLog().then(function(log) {
				var lines = log.split(/\n/);

				if (!/\n$/.test(log))
					lines.pop();

				$scope.log = lines.reverse().join('\n');
				$scope.lines = lines.length;

				$timeout($scope.getLog, 5000);
			});
		}
	});

	l2spin.open();
	$scope.getLog().then(l2spin.close);
});
