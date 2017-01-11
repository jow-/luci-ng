L2.registerController('NetworkDiagnosticsController', function($scope, l2rpc, l2spin) {
	angular.extend($scope, {
		rpcPingIPv4: l2rpc.declare({
			object: 'luci2.network',
			method: 'ping',
			params: ['data']
		}),

		rpcPingIPv6: l2rpc.declare({
			object: 'luci2.network',
			method: 'ping6',
			params: ['data']
		}),

		rpcTracerouteIPv4: l2rpc.declare({
			object: 'luci2.network',
			method: 'traceroute',
			params: ['data']
		}),

		rpcTracerouteIPv6: l2rpc.declare({
			object: 'luci2.network',
			method: 'traceroute6',
			params: ['data']
		}),

		rpcNslookup: l2rpc.declare({
			object: 'luci2.network',
			method: 'nslookup',
			params: ['data']
		}),

		trim: function(text) {
			if (typeof(text) === 'string')
				return text.replace(/^\s+|\s+$/g, '');

			return '';
		},

		ping: function(proto, url) {
			var rpcCall = (proto == 'IPv6')
				? $scope.rpcPingIPv6 : $scope.rpcPingIPv4;

			l2spin.open();
			rpcCall(url).then(function(result) {
				l2spin.close();
				$scope.result = result;
			});
		},

		traceroute: function(proto, url) {
			var rpcCall = (proto === 'IPv6')
				? $scope.rpcTracerouteIPv6 : $scope.rpcTracerouteIPv4;

			l2spin.open();
			rpcCall(url).then(function(result) {
				l2spin.close();
				$scope.result = result;
			});
		},

		nslookup: function(ip) {
			l2spin.open();
			$scope.rpcNslookup(ip).then(function(result) {
				l2spin.close();
				$scope.result = result;
			 });
		}
	});

	$scope.protos = ['IPv4', 'IPv6'];
	$scope.ping.url = 'www.lede-project.org';
	$scope.ping.proto = $scope.protos[0];
	$scope.traceroute.url = 'www.lede-project.org';
	$scope.traceroute.proto = $scope.protos[0];
	$scope.nslookup.url = 'www.lede-project.org';
});
