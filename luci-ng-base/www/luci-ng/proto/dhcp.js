L2.invoke(['l2network', 'gettext', function(l2network, gettext) {
	l2network.registerProtocolHandler({
		protocol:    'dhcp',
		description: gettext('DHCP client'),
		tunnel:      false,
		virtual:     false
	});
}]);
