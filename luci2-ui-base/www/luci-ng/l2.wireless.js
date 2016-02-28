L2.registerFilter('wifiSignalRange', function() {
	return function(obj) {
		if (!angular.isObject(obj) ||
		    !angular.isNumber(obj.signal) ||
		    !angular.isNumber(obj.noise))
			return 'none';

		var q = (-1 * (obj.noise - obj.signal)) / 5;
		if (q < 1)
			return '0';
		else if (q < 2)
			return '0-25';
		else if (q < 3)
			return '25-50';
		else if (q < 4)
			return '50-75';
		else
			return '75-100';
	}
});

L2.registerFilter('wifiEncryption', ['l2wireless', function(l2wireless) {
	return l2wireless.formatEncryption;
}]);

L2.registerFactory('l2wireless', ['l2rpc', 'l2uci', 'gettext', function(l2rpc, l2uci, gettext) {
	var _wireless = { };
	return angular.extend(_wireless, {

		listDeviceNames: l2rpc.declare({
			object: 'iwinfo',
			method: 'devices',
			expect: { 'devices': [ ] },
			filter: function(data) {
				data.sort();
				return data;
			}
		}),

		getEAPSupportStatus: l2rpc.declare({
			object: 'luci2.network',
			method: 'eap_support'
		}),

		getPhyName: l2rpc.declare({
			object: 'iwinfo',
			method: 'phyname',
			params: [ 'section' ],
			expect: { 'phyname': '' }
		}),

		getNetworkWirelessStatus: l2rpc.declare({
			object: 'network.wireless',
			method: 'status'
		}),

		getDeviceStatus: l2rpc.declare({
			object: 'iwinfo',
			method: 'info',
			params: [ 'device' ],
			expect: { '': { } },
			filter: function(data, params) {
				if (!angular.isEmptyObject(data))
				{
					data['device'] = params['device'];
					return data;
				}
				return undefined;
			}
		}),

		getAssocList: l2rpc.declare({
			object: 'iwinfo',
			method: 'assoclist',
			params: [ 'device' ],
			expect: { results: [ ] },
			filter: function(data, params) {
				for (var i = 0; i < data.length; i++)
					data[i]['device'] = params['device'];

				data.sort(function(a, b) {
					if (a.bssid < b.bssid)
						return -1;
					else if (a.bssid > b.bssid)
						return 1;
					else
						return 0;
				});

				return data;
			}
		}),

		getWirelessFreqList: l2rpc.declare({
			object: 'iwinfo',
			method: 'freqlist',
			params: [ 'device' ],
			expect: { results: [ ] }
		}),

		getWirelessStatus: function() {
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

			var stat = { };

			return _wireless.getEAPSupportStatus().then(function(eapSupport) {
				_wireless.eapSupport = eapSupport;
				return l2uci.load('wireless');
			}).then(_wireless.getNetworkWirelessStatus).then(function(uciStat) {
				angular.extend(stat, uciStat);

				l2rpc.batch();

				for (var radioName in uciStat)
				{
					_wireless.getPhyName(radioName);
					_wireless.getWirelessFreqList(radioName);

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

						_wireless.getDeviceStatus(uciIfname);
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
						uciIface.mode = _wireless.uciParseMode(uciIface.config.mode);

					if (!uciIface.encryption)
						uciIface.encryption =
							_wireless.uciParseEncryption(uciIface.config.encryption);

					uciIface.encryptionName =
						_wireless.formatEncryption(uciIface.encryption);
				}

				return stat;
			});
		},

		getAssocLists: function()
		{
			return _wireless.listDeviceNames().then(function(names) {
				l2rpc.batch();

				for (var i = 0; i < names.length; i++)
					_wireless.getAssocList(names[i]);

				return l2rpc.flush();
			}).then(function(assoclists) {
				var rv = [ ];

				for (var i = 0; i < assoclists.length; i++)
					for (var j = 0; j < assoclists[i].length; j++)
						if (!/^wlan\d+\.sta\d+$/.test(assoclists[i][j].device))
							rv.push(assoclists[i][j]);

				return rv;
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

		formatEncryption: function(enc, condensed)
		{
			var format_list = function(l, s)
			{
				var rv = [ ];
				for (var i = 0; i < l.length; i++)
					rv.push(l[i].toUpperCase());
				return rv.join(s ? s : ', ');
			}

			if (!enc || !enc.enabled)
				return gettext('None');

			if (enc.wep)
			{
				if (condensed)
					return gettext('WEP');
				else if (enc.wep.length == 2)
					return gettext('WEP Open/Shared') + ' (%s)'.format(format_list(enc.ciphers, ', '));
				else if (enc.wep[0] == 'shared')
					return gettext('WEP Shared Auth') + ' (%s)'.format(format_list(enc.ciphers, ', '));
				else
					return gettext('WEP Open System') + ' (%s)'.format(format_list(enc.ciphers, ', '));
			}
			else if (enc.wpa)
			{
				if (condensed && enc.wpa.length == 2)
					return gettext('WPA mixed');
				else if (condensed)
					return (enc.wpa[0] == 2) ? gettext('WPA2') : gettext('WPA');
				else if (enc.wpa.length == 2)
					return gettext('mixed WPA/WPA2') + ' %s (%s)'.format(
						format_list(enc.authentication, '/'),
						format_list(enc.ciphers, ', ')
					);
				else if (enc.wpa[0] == 2)
					return '%s %s (%s)'.format(
						gettext('WPA2'),
						format_list(enc.authentication, '/'),
						format_list(enc.ciphers, ', ')
					);
				else
					return '%s %s (%s)'.format(
						gettext('WPA'),
						format_list(enc.authentication, '/'),
						format_list(enc.ciphers, ', ')
					);
			}

			/// unknown encryption mode
			return gettext('Unknown');
		}
	});
}]);
