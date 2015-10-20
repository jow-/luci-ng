L2.registerController('NetworkWirelessController',
['$scope', 'l2uci', 'l2rpc', 'l2wireless', '$timeout', 'l2spin', 'gettext', function($scope, l2uci, l2rpc, l2wireless, $timeout, l2spin, gettext) {

	//l2uci.load('wireless').then(function() {
	//	angular.element('[ng-view]').html(angular.toJson(l2uci.get('wireless', 'radio0'), true));
	//});

	angular.extend($scope, {

		getNetworkWirelessStatus: l2rpc.declare({
			object: 'network.wireless',
			method: 'status'
		}),

		getWirelessScanResults: l2rpc.declare({
			object: 'iwinfo',
			method: 'scan',
			params: [ 'device' ],
			expect: { results: [ ] }
		}),

		getWirelessFreqList: l2rpc.declare({
			object: 'iwinfo',
			method: 'freqlist',
			params: [ 'device' ],
			expect: { results: [ ] }
		}),

		getEAPSupportStatus: l2rpc.declare({
			object: 'luci2.network',
			method: 'eap_support'
		}),

		callNetworkReload: l2rpc.declare({
			object: 'network',
			method: 'reload'
		}),

		enableDisableNetwork: function(enable, radioSection, ifaceSection)
		{
			var self = this;

			L.ui.loading(true);

			l2rpc.batch();
			l2uci.callDelete('wireless', radioSection, [ 'disabled' ]);

			if (enable)
				l2uci.callDelete('wireless', ifaceSection, [ 'disabled' ]);
			else
				l2uci.callSet('wireless', ifaceSection, { disabled: 1 });

			l2uci.callCommit('wireless');
			self.callNetworkReload();

			return l2rpc.flush().then(function() {
				$('#radiostate-%s'.format(radioSection))
					.html('<em>%s</em>'.format(
						enable ? gettext('Radio interface is starting…')
							   : gettext('Radio interface is shutting down…')));

				L.ui.loading(false);
			});
		},

		uciParseMode: function(v) {
			switch (v)
			{
			case 'ap':		return 'Master';
			case 'adhoc':	return 'Ad-Hoc';
			case 'mesh':    return 'Mesh Point';
			case 'sta':     return 'Client';
			case 'monitor': return 'Monitor';
			default:		return gettext('Unknown');
			}
		},

		uciParseEncryption: function(v, k) {
			var e = { };

			if (v.match(/wep/))
			{
				if (v.match(/shared/))
					e.wep = [ 'shared' ];
				else if (v.match(/mixed/))
					e.wep = [ 'open', 'shared' ];
				else
					e.wep = [ 'open' ];

				e.enabled = true;
				e.ciphers = [ (k && k.length == 13) ? 'WEP-104' : 'WEP-40' ];

				return e;
			}

			if (v.match(/^wpa2|psk2/))
				e.wpa = [ 2 ];
			else if (v.match(/^wpa|psk/))
				e.wpa = [ 1 ];
			else if (v.match(/mixed/))
				e.wpa = [ 1, 2 ];

			if (e.wpa)
			{
				if (v.match(/tkip\+aes|tkip\+ccmp|aes\+tkip|ccmp\+tkip/))
					e.ciphers = [ 'ccmp', 'tkip' ];
				else if (v.match(/tkip/))
					e.ciphers = [ 'tkip' ];
				else
					e.ciphers = [ 'ccmp' ];

				if (v.match(/^wpa|8021x/))
					e.authentication = [ '802.1x' ];
				else
					e.authentication = [ 'psk' ];

				e.enabled = true;
			}

			return e;
		},

		scanWireless: function(radio) {
			L.ui.dialog(
				gettext('Scanning wireless networks'),
				gettext('Waiting for scan results …'),
				{ style: 'wait' }
			);

			this.getWirelessScanResults(radio).then(function(results) {
				var resTable = new L.ui.grid({
					condensed: true,
					columns: [ {
						caption:  gettext('Signal'),
						width:    2,
						width_sm: 3,
						format:  function(v, n) {
							var res = results[n];
							var ico = 'signal-none';
							var qlt = (5 / res.quality_max) * res.quality;

							if (qlt < 1)
								ico = 'signal-0';
							else if (qlt < 2)
								ico = 'signal-0-25';
							else if (qlt < 3)
								ico = 'signal-25-50';
							else if (qlt < 4)
								ico = 'signal-50-75';
							else
								ico = 'signal-75-100';

							return $('<span />')
								.addClass('badge')
								.append(L.ui.icon(ico))
								.append(' %d dB'.format(res.signal));
						}
					}, {
						caption:  L.trc('Wireless channel abbreviation', 'Ch.'),
						width:    1,
						width_sm: 0,
						key:      'channel',
						format:   '%d'
					}, {
						caption: gettext('SSID'),
						width:   4,
						nowrap:  true,
						key:     'ssid',
						format:  function(v) {
							return (typeof(v) === 'string' && v !== '')
								? '%h'.format(v)
								: '<em>%s</em>'.format(gettext('Hidden network'));
						}
					}, {
						caption: gettext('Encryption'),
						width:   3,
						nowrap:  true,
						key:     'encryption',
						format:  function(v) {
							return l2wireless.formatEncryption(v, true);
						}
					}, {
						width:   2,
						align:   'right',
						format:  function(v) {
							return $('<button />')
								.attr('disabled', false)
								.addClass('btn btn-xs btn-success')
								.text(L.trc('Radio device action', 'Connect…'));
						}
					} ]
				});

				resTable.rows(results);

				L.ui.dialog(
					gettext('Wireless scan results'),
					resTable.render(),
					{ style: 'close' }
				);
			});
		},

		addSSID: function(radio) {
			L.ui.loading(true);
			L.system.getBoardInfo().then(function(info) {
				var sid = l2uci.add('wireless', 'wifi-iface');
				l2uci.set('wireless', sid, 'device', radio);
				l2uci.set('wireless', sid, 'mode', 'ap');
				l2uci.set('wireless', sid, 'ssid', info.hostname || 'Wireless Network');
				l2uci.set('wireless', sid, 'encryption', 'none');
				return L.views.NetworkWireless.renderWirelessMap(radio, sid).show();
			}).then(function() {
				L.ui.loading(false);
			});
		},

		deleteSSID: function(sid) {
			L.ui.dialog(
				gettext('Remove wireless network'),
				$('<p />')
					.text(gettext('Really remove the wireless network "%s" ?').format(l2uci.get('wireless', sid, 'ssid') || '?'))
					.add($('<p />')
						.addClass('alert alert-danger')
						.text(gettext('The deletion cannot be undone!'))),
				{
					style: 'confirm',
					confirm: function() {
						L.ui.dialog(false);
						L.ui.loading(true);
						l2uci.remove('wireless', sid);
						l2uci.save();

						var v = L.views.NetworkWireless;
						v.updateStatus();
					}
				}
			)
		},

		getWirelessStatus: function()
		{
			var phyMap = { },
				freqMap = { },
				radioNames = [ ],
				networkRefs = [ ];

			var phy_attrs = [
				'country', 'channel', 'frequency', 'frequency_offset',
				'txpower', 'txpower_offset', 'hwmodes', 'hardware', 'phy'
			];

			var net_attrs = [
				'ssid', 'bssid', 'mode', 'quality', 'quality_max',
				'signal', 'noise', 'bitrate', 'encryption'
			];

			//self.wifiStatus = self.wifiStatus || (self.wifiStatus = { });
			var stat = { };

			return $scope.getEAPSupportStatus().then(function(eapSupport) {
				$scope.eapSupport = eapSupport;
				return l2uci.load('wireless');
			}).then(function() {
				return $scope.getNetworkWirelessStatus();
			}).then(function(uciStat) {
				angular.extend(stat, uciStat);

				l2rpc.batch();

				for (var radioName in uciStat)
				{
					l2wireless.getPhyName(radioName);
					$scope.getWirelessFreqList(radioName);
					radioNames.push(radioName);
				}

				return l2rpc.flush();
			}).then(function(iwResults) {
				for (var i = 0; i < iwResults.length; i += 2)
				{
					phyMap[radioNames[i/2]] = iwResults[i];
					freqMap[radioNames[i/2]] = iwResults[i+1];
				}

				l2rpc.batch();

				for (var radioName in stat)
				{
					var uciRadio = stat[radioName];
					var uciIfaces = l2uci.sections('wireless', 'wifi-iface');
					var cfgIfaces = [ ];

					for (var i = 0, n = 0; i < uciIfaces.length; i++)
					{
						if (uciIfaces[i].device != radioName)
							continue;

						var uciIface = undefined;
						var cmpSection = '@wifi-iface[%d]'.format(i);

						/* lookup wifi-iface in netifd state info */
						for (var j = 0; j < uciRadio.interfaces.length; j++)
							if (uciRadio.interfaces[j].section === cmpSection)
								uciIface = uciRadio.interfaces[j];

						/* wifi-iface not present in netifd state, merge uci info */
						if (!uciIface)
							uciIface = {
								up: false,
								config: {
									mode: uciIfaces[i].mode || 'ap',
									ssid: uciIfaces[i].ssid,
									encryption: uciIfaces[i].encryption || 'none',
									key: uciIfaces[i].key,
									wds: uciIfaces[i].wds,
									ifname: uciIfaces[i].ifname,
									network: angular.toArray(uciIfaces[i].network)
								}
							};
						else
							uciIface.up = uciRadio.up;

						var uciIfname = uciIface.ifname ||
							phyMap[radioName] || radioName;

						uciRadio.radio = radioName;
						uciIface.radio = radioName;
						uciIface.index = n++;
						uciIface.section = uciIfaces[i]['.name'];
						networkRefs.push(uciIface);

						l2wireless.getDeviceStatus(uciIfname);
						cfgIfaces.push(uciIface);
					}

					uciRadio.interfaces = cfgIfaces;
					uciRadio.frequencies = freqMap[radioName] || [ ];
				}

				return l2rpc.flush();
			}).then(function(iwStats) {
				for (var i = 0; i < iwStats.length; i++)
				{
					var uciIface = networkRefs[i];
					var uciRadio = stat[uciIface.radio];

					for (var j = 0; j < phy_attrs.length; j++)
						uciRadio[phy_attrs[j]] = iwStats[i][phy_attrs[j]];

					for (var j = 0; j < net_attrs.length; j++)
						uciIface[net_attrs[j]] = iwStats[i][net_attrs[j]];

					if (!uciRadio.hardwareName)
						uciRadio.hardwareName = uciRadio.hardware
							? '%s 802.11%s (%s)'.format(
								uciRadio.hardware.name,
								uciRadio.hwmodes ? uciRadio.hwmodes.join('') : '',
								uciIface.radio)
							: '802.11%s %s (%s)'.format(
								uciRadio.hwmodes ? uciRadio.hwmodes.join('') : '',
								gettext('Wifi Device'),
								uciIface.radio);

					if (!uciIface.ifname)
					{
						if (!uciIface.config.ifname)
						{
							var phyIndex = (uciRadio.phy || uciIface.radio || '')
								.replace(/^[^0-9]+/, '');

							var netIndex = (uciIface.index > 0)
								? '-%d'.format(uciIface.index) : '';

							uciIface.ifname = 'wlan%d%s'.format(phyIndex, netIndex);
						}
						else
						{
							uciIface.ifname = uciIface.config.ifname;
						}
					}

					if (!uciIface.ssid)
						uciIface.ssid = uciIface.config.ssid;

					if (!uciIface.mode)
						uciIface.mode = $scope.uciParseMode(uciIface.config.mode);

					if (!uciIface.encryption)
						uciIface.encryption =
							$scope.uciParseEncryption(uciIface.config.encryption);

					uciIface.encryptionName =
						l2wireless.formatEncryption(uciIface.encryption);
				}

				$scope.wifiStatus = stat;
				$scope.$timeout = $timeout($scope.getWirelessStatus, 5000);
			});
		}
	});

	l2spin.open();
	$scope.getWirelessStatus().then(l2spin.close);

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.$timeout);
	});
}]);
