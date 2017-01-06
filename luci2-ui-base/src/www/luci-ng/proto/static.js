L2.invoke(['l2network', 'gettext', function(l2network, gettext) {
	l2network.registerProtocolHandler({
		protocol:    'static',
		description: gettext('Static address'),
		tunnel:      false,
		virtual:     false
	});
}]);
