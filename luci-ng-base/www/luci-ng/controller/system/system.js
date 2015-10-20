L2.registerController('SystemSystemController',
['$q', '$scope', 'l2rpc', 'l2uci', 'l2network', 'gettext', function($q, $scope, l2rpc, l2uci, l2network, gettext) {
	angular.extend($scope, {
		getRoutes: l2rpc.declare({
			object: 'luci2.network',
			method: 'routes',
			expect: { routes: [ ] }
		}),

		getIPv6Routes: l2rpc.declare({
			object: 'luci2.network',
			method: 'routes6',
			expect: { routes: [ ] }
		}),

		getARPTable: l2rpc.declare({
			object: 'luci2.network',
			method: 'arp_table',
			expect: { entries: [ ] }
		}),

		getStatus: function() {
			return $q.all([
				$scope.getRoutes().then(function(routes) {
					$scope.routes = routes;
				}),
				$scope.getIPv6Routes().then(function(routes6) {
					$scope.routes6 = routes6;
				}),
				$scope.getARPTable().then(function(arptable) {
					$scope.arptable = { };

					arptable.sort(function(a, b) {
						var ip1 = a.ipaddr.split('.');
						var ip2 = b.ipaddr.split('.');
						a.id = '%02x%02x%02x%02x'.format(ip1[0], ip1[1], ip1[2], ip1[3]);
						b.id = '%02x%02x%02x%02x'.format(ip2[0], ip2[1], ip2[2], ip2[3]);

						if (a.id < b.id)
							return -1;
						else if (a.id > b.id)
							return 1;

						return 0;
					});

					for (var i = 0, e; e = arptable[i]; i++) {
						if (e.macaddr === '00:00:00:00:00:00')
							continue;

						var entries = $scope.arptable[e.macaddr] ||
							($scope.arptable[e.macaddr] = [ ]);

						entries.push(e);
					}
				})
			]);
		},

		getVendor: function(mac) {
			var info = {
				vendor: gettext('Loading…')
			};

			l2uci.lookup(mac).then(function(vendor) {
				info.vendor = vendor;
			});

			return info;
		}
	});

	var self = this;

	self.load = function() {
		console.debug('View load hook');
		return l2network.load().then(function() {
			self.protocols = l2network.getProtocols();
		});
	};

	self.addNetwork = function(uciSectionName) {
		l2uci.set('network', uciSectionName, 'proto', 'none');
	};

	self.isNonVirtualProtocol = function(name) {
		var proto = l2network.protocolHandlers[name];
		return (proto && !proto.virtual);
	};

	$scope.addWifiIface = this.addWifiIface = function(x) {
		l2uci.set('wireless', x, 'type', 'meh');
	};

	$scope.removeWifiIface = this.removeWifiIface = function(x) {
		console.debug('Remove ' + x);
	};

	$scope.test = this.test = function() {
		console.debug('Test!!');
		return 'xxx';
	};

	//$scope.getStatus();
}]);
