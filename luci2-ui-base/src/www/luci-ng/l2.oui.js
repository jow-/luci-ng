angular.module('LuCI2').factory('l2oui', function($http) {
	var _oui = { };
	return angular.extend(_oui, {
		_load: function(res) {
			if (angular.isObject(res) && angular.isArray(res.data) &&
			    (res.data.length % 3) === 0 && res.data.length > 0)
				_oui._database = res.data;
			else
				_oui._database = [ ];
		},

		load: function() {
			if (!_oui._database)
				return $http.get('https://raw.githubusercontent.com/jow-/oui-database/master/oui.json')
					.then(_oui._load, _oui._load);

			return angular.deferrable();
		},

		_lookup: function(mac) {
			var m, l = 0, r = _oui._database.length / 3 - 1;
			var mac1 = parseInt(mac.replace(/[^a-fA-F0-9]/g, ''), 16);

			while (l <= r) {
				m = l + Math.floor((r - l) / 2);

				var mask = (0xffffffffffff -
							(Math.pow(2, 48 - _oui._database[m * 3 + 1]) - 1));

				var mac1_hi = ((mac1 / 0x10000) & (mask / 0x10000)) >>> 0;
				var mac1_lo = ((mac1 &  0xffff) & (mask &  0xffff)) >>> 0;

				var mac2 = parseInt(_oui._database[m * 3], 16);
				var mac2_hi = (mac2 / 0x10000) >>> 0;
				var mac2_lo = (mac2 &  0xffff) >>> 0;

				if (mac1_hi === mac2_hi && mac1_lo === mac2_lo)
					return _oui._database[m * 3 + 2];

				if (mac2_hi > mac1_hi ||
					(mac2_hi === mac1_hi && mac2_lo > mac1_lo))
					r = m - 1;
				else
					l = m + 1;
			}

			return undefined;
		},

		lookup: function(mac) {
			return _oui.load().then(function() {
				return _oui._lookup(mac);
			}, function() {
				return undefined;
			});
		}
	});
});
