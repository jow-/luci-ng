L2.invoke(['l2network', 'gettext', function(l2network, gettext) {
	l2network.registerProtocolHandler({
		protocol:    '6to4',
		description: gettext('IPv6-over-IPv4 (6to4)'),
		tunnel:      true,
		virtual:     true
	});
}]);
