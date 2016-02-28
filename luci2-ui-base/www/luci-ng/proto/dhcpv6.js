L2.invoke(['l2network', 'gettext', function(l2network, gettext) {
	l2network.registerProtocolHandler({
		protocol:    'dhcpv6',
		description: gettext('DHCPv6 client / IPv6 autoconfig'),
		tunnel:      false,
		virtual:     false
	});
}]);
