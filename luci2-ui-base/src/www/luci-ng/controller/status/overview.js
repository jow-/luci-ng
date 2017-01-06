L2.registerController('StatusOverviewController',
['$q', '$scope', 'l2rpc', 'l2system', 'l2network', 'l2wireless', '$timeout', 'l2spin', 'l2oui', 'gettext', function($q, $scope, l2rpc, l2system, l2network, l2wireless, $timeout, l2spin, l2oui, gettext) {
	angular.extend($scope, {
		getConntrackCount: l2rpc.declare({
			object: 'luci2.network',
			method: 'conntrack_count',
			expect: { '': { count: 0, limit: 0 } }
		}),

		getDHCPLeases: l2rpc.declare({
			object: 'luci2.network',
			method: 'dhcp_leases',
			expect: { leases: [ ] }
		}),

		getDHCPv6Leases: l2rpc.declare({
			object: 'luci2.network',
			method: 'dhcp6_leases',
			expect: { leases: [ ] }
		}),

		getARPTable: l2rpc.declare({
			object: 'luci2.network',
			method: 'arp_table',
			expect: { entries: [ ] }
		}),

		getStatus: function() {
			return $q.all([
				$scope.getConntrackCount().then(function(ct) {
					ct.percent = (100 / ct.limit * ct.count).toFixed(0);
					$scope.conntrack = ct;
				}),
				l2system.getInfo().then(function(sys) {
					sys.localtime = (new Date(sys.localtime * 1000)).toString();
					sys.uptime = '%t'.format(sys.uptime);
					sys.load = '%.2f %.2f %.2f'.format(
						sys.load[0] / 65535.0,
						sys.load[1] / 65535.0,
						sys.load[2] / 65535.0
					);

					sys.memory.pc_total    = (100 / sys.memory.total * (sys.memory.free + sys.memory.buffered)).toFixed(0);
					sys.memory.pc_free     = (100 / sys.memory.total * sys.memory.free).toFixed(0);
					sys.memory.pc_shared   = (100 / sys.memory.total * sys.memory.shared).toFixed(0);
					sys.memory.pc_buffered = (100 / sys.memory.total * sys.memory.buffered).toFixed(0);

					sys.swap.pc_free       = (100 / sys.swap.total * sys.swap.free).toFixed(0);

					sys.root.pc_used       = (100 / sys.root.total * sys.root.used).toFixed(0);
					sys.tmp.pc_used        = (100 / sys.tmp.total * sys.tmp.used).toFixed(0);

					$scope.system = sys;
				}),
				l2network.load().then(function() {
					$scope.wan  = l2network.findWAN();
					$scope.wan6 = l2network.findWAN6();

					if ($scope.wan) {
						$scope.wan.dev = l2network.resolveAlias($scope.wan.getDevice());
					}

					if ($scope.wan6) {
						$scope.wan6.dev = l2network.resolveAlias($scope.wan6.getDevice());
					}
				}),
				l2wireless.getWirelessStatus().then(function(radios) {
					$scope.wireless = radios;
				}),
				l2wireless.getAssocLists().then(function(assocs) {
					$scope.assocs = assocs;
				}),
				$scope.getDHCPLeases().then(function(leases) {
					$scope.leases = leases;
				}),
				$scope.getDHCPv6Leases().then(function(leases6) {
					$scope.leases6 = leases6;
				}),
				$scope.getARPTable().then(function(entries) {
					$scope.arptable = entries;
				})
			]).then(function() {
				$scope.$timeout = $timeout($scope.getStatus, 5000);
			});
		},

		getMACFromDUID: function(duid)
		{
			if (duid.substring(0, 8) !== '00010001' || duid.length !== 28)
				return undefined;

			return duid.substring(16).replace(/(..)(?=..)/g, '$1:');
		},

		getHostInfo: function(mac)
		{
			var host = {
				mac: mac.toUpperCase(),
				vendor: gettext('Loading…')
			};

			l2oui.lookup(mac).then(function(vendor) {
				if (vendor)
					host.vendor = vendor;
				else
					/// unknown vendor
					host.vendor = gettext('Unknown');
			});

			if ($scope.leases)
				for (var i = 0, lease; lease = $scope.leases[i]; i++)
					if (lease.macaddr.toUpperCase() === host.mac) {
						host.name = lease.hostname;
						host.ipaddr = lease.ipaddr;
						break;
					}

			if ($scope.leases6)
				for (var i = 0, lease; lease = $scope.leases6[i]; i++) {
					if (lease.duid.substring(0, 8) !== '00010001' ||
					    lease.duid.length !== 28)
						continue;

					var lease_mac = lease.duid.substring(16)
										.replace(/(..)(?=..)/g, '$1:')
										.toUpperCase();

					if (lease_mac === host.mac) {
						host.name = host.name || lease.hostname;
						host.ip6addr = lease.ip6addr;
						break;
					}
				}

			if ($scope.arptable)
				for (var i = 0, entry; entry = $scope.arptable[i]; i++)
					if (entry.macaddr.toUpperCase() === host.mac) {
						host.ipaddr = host.ipaddr || entry.ipaddr;
						host.device = entry.device;
						break;
					}

			return host;
		}
	});

	l2spin.open();
	$scope.getStatus().then(l2spin.close);

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.$timeout);
	});
}]);
