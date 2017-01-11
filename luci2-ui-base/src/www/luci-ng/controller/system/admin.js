L2.registerFactory('l2pubkeys', [function() {
	var _pubkeys = { };
	return angular.extend(_pubkeys, {
		base64Table: {
			'A':  0, 'B':  1, 'C':  2, 'D':  3, 'E':  4, 'F':  5, 'G':  6,
			'H':  7, 'I':  8, 'J':  9, 'K': 10, 'L': 11, 'M': 12, 'N': 13,
			'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19, 'U': 20,
			'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25, 'a': 26, 'b': 27,
			'c': 28, 'd': 29, 'e': 30, 'f': 31, 'g': 32, 'h': 33, 'i': 34,
			'j': 35, 'k': 36, 'l': 37, 'm': 38, 'n': 39, 'o': 40, 'p': 41,
			'q': 42, 'r': 43, 's': 44, 't': 45, 'u': 46, 'v': 47, 'w': 48,
			'x': 49, 'y': 50, 'z': 51, '0': 52, '1': 53, '2': 54, '3': 55,
			'4': 56, '5': 57, '6': 58, '7': 59, '8': 60, '9': 61, '+': 62,
			'/': 63, '=': 64
		},

		base64Decode: function(s) {
			var i = 0;
			var d = '';

			if (s.match(/[^A-Za-z0-9\+\/\=]/))
				return undefined;

			while (i < s.length) {
				var e1 = _pubkeys.base64Table[s.charAt(i++)];
				var e2 = _pubkeys.base64Table[s.charAt(i++)];
				var e3 = _pubkeys.base64Table[s.charAt(i++)];
				var e4 = _pubkeys.base64Table[s.charAt(i++)];

				var c1 = ( e1       << 2) | (e2 >> 4);
				var c2 = ((e2 & 15) << 4) | (e3 >> 2);
				var c3 = ((e3 &  3) << 6) |  e4;

				d += String.fromCharCode(c1);

				if (e3 < 64)
					d += String.fromCharCode(c2);

				if (e4 < 64)
					d += String.fromCharCode(c3);
			}

			return d;
		},

		lengthDecode: function(s, off) {
			var l = (s.charCodeAt(off++) << 24) |
					(s.charCodeAt(off++) << 16) |
					(s.charCodeAt(off++) <<  8) |
					 s.charCodeAt(off++);

			if (l < 0 || (off + l) > s.length)
				return -1;

			return l;
		},

		pubkeyDecode: function(s) {
			var parts = s.split(/\s+/);
			if (parts.length < 2)
				return undefined;

			var key = _pubkeys.base64Decode(parts[1]);
			if (!key)
				return undefined;

			var off, len;

			off = 0;
			len = _pubkeys.lengthDecode(key, off);

			if (len < 0)
				return undefined;

			var type = key.substr(off + 4, len);
			if (type != parts[0])
				return undefined;

			off += 4 + len;

			var len1 = _pubkeys.lengthDecode(key, off);
			if (len1 < 0)
				return undefined;

			off += 4 + len1;

			var len2 = _pubkeys.lengthDecode(key, off);
			if (len2 < 0)
				return undefined;

			if (len1 & 1)
				len1--;

			if (len2 & 1)
				len2--;

			switch (type) {
				case 'ssh-rsa':
					return { type: 'RSA', bits: len2 * 8, comment: parts[2] };

				case 'ssh-dss':
					return { type: 'DSA', bits: len1 * 8, comment: parts[2] };

				default:
					return undefined;
			}
		}
	});
}]);

L2.registerController('SystemAdminController', ['$uibModal', 'l2rpc', 'l2spin', 'l2pubkeys',
	function($modal, l2rpc, l2spin, l2pubkeys) {
		var adminCtrl = this;

		angular.extend(adminCtrl, {
			authorizedKeys: [],

			getSSHKeys: l2rpc.declare({
				object: 'luci2.system',
				method: 'sshkeys_get',
				expect: { keys: [] }
			}),

			setSSHKeys: l2rpc.declare({
				object: 'luci2.system',
				method: 'sshkeys_set',
				params: ['keys']
			}),

			setPassword: l2rpc.declare({
				object: 'luci2.system',
				method: 'password_set',
				params: ['user', 'password']
			}),

			displayPubkey: function(i) {
				$modal.open({
					template: '<div class="modal-body"><pre>' + adminCtrl.authorizedKeys[i].raw +
					          '</pre></div>'
				});
			},

			savePubkeys: function(removeKeyIdx) {
				var newKeys = [];

				for (var i = 0; i < adminCtrl.authorizedKeys.length; i++) {
					if (adminCtrl.authorizedKeys[i].index !== removeKeyIdx)
						newKeys.push(adminCtrl.authorizedKeys[i].raw);
					else
					adminCtrl.authorizedKeys.splice(i--, 1);
				}

				l2spin.open();
				adminCtrl.setSSHKeys(newKeys).then(l2spin.close);
			},

			addPubkeyCtrl: function($scope, $modalInstance) {
				var dialog = this;
				return angular.extend(dialog, {
					isInvalid: false,

					confirm: function() {
						var key = l2pubkeys.pubkeyDecode(dialog.value);

						if (!key) {
							dialog.value = undefined;
							dialog.isInvalid = true;
							return;
						}

						dialog.isInvalid = false;
						$modalInstance.dismiss();

						key.raw = dialog.value;
						key.index = adminCtrl.authorizedKeys.length;

						adminCtrl.authorizedKeys.push(key);
						adminCtrl.savePubkeys(NaN);
					},

					dismiss: function() {
						$modalInstance.dismiss();
					}
				});
			},

			addPubkey: function() {
				$modal.open({
					controller: ['$scope', '$uibModalInstance', adminCtrl.addPubkeyCtrl],
					controllerAs: 'Dialog',
					templateUrl: 'system/admin/addkey.html'
				});
			},

			isPasswordChanged: false,

			changePassword: function() {
				var p1 = adminCtrl.password1;
				var p2 = adminCtrl.password2;

				if (angular.isString(p1) && p1.length > 0 && p1 === p2) {
					l2spin.open();

					delete adminCtrl.password1;
					delete adminCtrl.password2;

					adminCtrl.setPassword('root', p1).then(function(rv) {
						adminCtrl.isPasswordChanged = (rv === 0);
						l2spin.close();
					});
				}
			}
		});

		l2spin.open();
		adminCtrl.getSSHKeys().then(function(keys) {
			for (var i = 0; i < keys.length; i++) {
				var key = l2pubkeys.pubkeyDecode(keys[i]);

				if (!key)
					continue;

				adminCtrl.authorizedKeys.push(angular.extend(key, {
					index: i,
					raw: keys[i]
				}));
			}

			l2spin.close();
		});
	}]);
