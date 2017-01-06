L2.invoke(['l2network', 'gettext', function(l2network, gettext) {
	l2network.registerProtocolHandler({
		protocol:    'dslite',
		description: gettext('Dual-Stack Lite (RFC6333)'),
		tunnel:      true,
		virtual:     true
	});
}]);
