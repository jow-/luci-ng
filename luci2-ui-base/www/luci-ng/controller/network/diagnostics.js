L2.registerController('NetworkDiagnosticsController',['$scope', 'l2rpc', 'l2spin', function($scope, l2rpc, l2spin) {
	angular.extend($scope, {
		rpcPingIpv4: l2rpc.declare({
			object: 'luci2.network',
			method: 'ping',
			params: [ 'data' ]
		}),

		rpcPingIpv6: l2rpc.declare({
			object: 'luci2.network',
			method: 'ping6',
			params: [ 'data' ]
		}),

		rpcTracerouteIpv4: l2rpc.declare({
			object: 'luci2.network',
			method: 'traceroute',
			params: [ 'data' ]
		}),

		rpcTracerouteIpv6: l2rpc.declare({
			object: 'luci2.network',
			method: 'traceroute6',
			params: [ 'data' ]
		}),

		rpcNslookup: l2rpc.declare({
			object: 'luci2.network',
			method: 'nslookup',
			params: [ 'data' ]
		}),

		ping: function(proto, url) {
			l2spin.open();
			if ( proto == "Ipv6" ) {
				$scope.rpcPingIpv6(url).then(function(result){
					l2spin.close();
					$scope.result=result;
				});
			}
			else {
				$scope.rpcPingIpv4(url).then(function(result){
					l2spin.close();
					$scope.result=result;
				});
			}
		},

		traceroute: function(proto, url) {
			l2spin.open();
			if ( proto == "Ipv6" ) {
				$scope.rpcTracerouteIpv6(url).then(function(result){
					l2spin.close();
					$scope.result=result;
				 });
			}
			else {
				$scope.rpcTracerouteIpv4(url).then(function(result){
					l2spin.close();
					$scope.result=result;
				});
			}
		},

		nslookup: function(ip) {
			l2spin.open();
			$scope.rpcNslookup(ip).then(function(result){
				l2spin.close();
				$scope.result=result;
			 });
		}
	});
	$scope.protos = [ "Ipv4", "Ipv6" ];
	$scope.ping.url = "www.lede-project.org";
	$scope.traceroute.url = "www.lede-project.org";
	$scope.nslookup.url = "www.lede-project.org";
}])

