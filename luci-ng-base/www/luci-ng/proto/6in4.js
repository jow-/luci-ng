L2.invoke(['l2network', 'gettext', function(l2network, gettext) {
	l2network.registerProtocolHandler({
		protocol:    '6in4',
		description: gettext('IPv6-in-IPv4 (RFC4213)'),
		tunnel:      true,
		virtual:     true
	});
}]);
