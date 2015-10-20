L2.invoke(['l2network', 'gettext', function(l2network, gettext) {
	l2network.registerProtocolHandler({
		protocol:    '6rd',
		description: gettext('IPv6-over-IPv4 (6rd)'),
		tunnel:      true,
		virtual:     true
	});
}]);
