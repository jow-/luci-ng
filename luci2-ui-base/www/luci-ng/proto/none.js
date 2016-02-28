L2.invoke(['l2network', 'gettext', function(l2network, gettext) {
	l2network.registerProtocolHandler({
		protocol:    'none',
		description: gettext('Unmanaged'),
		tunnel:      false,
		virtual:     false
	});
}]);
