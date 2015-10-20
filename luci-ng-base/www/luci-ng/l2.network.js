L2.registerFactory('l2ip', [function() {
	var _ip = { };
	return angular.extend(_ip, {
		parseIPv4: function(str)
		{
			if ((typeof(str) != 'string' && !(str instanceof String)) ||
				!str.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/))
				return undefined;

			var num = [ ];
			var parts = str.split(/\./);

			for (var i = 0; i < parts.length; i++)
			{
				var n = parseInt(parts[i], 10);
				if (isNaN(n) || n > 255)
					return undefined;

				num.push(n);
			}

			return num;
		},

		parseIPv6: function(str)
		{
			if ((typeof(str) != 'string' && !(str instanceof String)) ||
				!str.match(/^[a-fA-F0-9:]+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?$/))
				return undefined;

			var parts = str.split(/::/);
			if (parts.length == 0 || parts.length > 2)
				return undefined;

			var lnum = [ ];
			if (parts[0].length > 0)
			{
				var left = parts[0].split(/:/);
				for (var i = 0; i < left.length; i++)
				{
					var n = parseInt(left[i], 16);
					if (isNaN(n))
						return undefined;

					lnum.push((n / 256) >> 0);
					lnum.push(n % 256);
				}
			}

			var rnum = [ ];
			if (parts.length > 1 && parts[1].length > 0)
			{
				var right = parts[1].split(/:/);

				for (var i = 0; i < right.length; i++)
				{
					if (right[i].indexOf('.') > 0)
					{
						var addr = _ip.parseIPv4(right[i]);
						if (!addr)
							return undefined;

						rnum.push.apply(rnum, addr);
						continue;
					}

					var n = parseInt(right[i], 16);
					if (isNaN(n))
						return undefined;

					rnum.push((n / 256) >> 0);
					rnum.push(n % 256);
				}
			}

			if (rnum.length > 0 && (lnum.length + rnum.length) > 15)
				return undefined;

			var num = [ ];

			num.push.apply(num, lnum);

			for (var i = 0; i < (16 - lnum.length - rnum.length); i++)
				num.push(0);

			num.push.apply(num, rnum);

			if (num.length > 16)
				return undefined;

			return num;
		},

		bitsToNetmask: function(bits)
		{
			if (bits === 0)
				return '0.0.0.0';

			if (bits <= 32)
			{
				var mask = ~((1 << (32 - bits)) - 1);
				return '%d.%d.%d.%d'.format(
					(mask >>> 24) & 0xFF,
					(mask >>> 16) & 0xFF,
					(mask >>>  8) & 0xFF,
					(mask >>>  0) & 0xFF
				);
			}

			return undefined;
		},

		netmaskToBits: function(mask)
		{
			var map = {
				'0':   0,
				'128': 1,
				'192': 2,
				'224': 3,
				'240': 4,
				'248': 5,
				'252': 6,
				'254': 7,
				'255': 8
			};

			if (/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.test(mask))
			{
				var a = map[RegExp.$1], b = map[RegExp.$2],
					c = map[RegExp.$3], d = map[RegExp.$4];

				if ((a === 8 && b === 8 && c === 8 && !isNaN(d)) ||
					(a === 8 && b === 8 && !isNaN(c) && d === 0) ||
					(a === 8 && !isNaN(b) && c === 0 && d === 0) ||
					(!isNaN(a) && b === 0 && c === 0 && d === 0))
				{
					return (a + b + c + d);
				}
			}

			return undefined;
		},

		parseCIDR4: function(cidr)
		{
			var addr = undefined,
				bits = undefined;

			if (/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/.test(cidr))
				addr = RegExp.$1, bits = parseInt(RegExp.$2, 10);
			else if (/^(\d+\.\d+\.\d+\.\d+)\/(\d+\.\d+\.\d+\.\d+)$/.test(cidr))
				addr = RegExp.$1, bits = _ip.netmaskToBits(RegExp.$2);
			else if (/^(\d+\.\d+\.\d+\.\d+)$/.test(cidr))
				addr = RegExp.$1, bits = 32;

			if (isNaN(bits) || bits < 0 || bits > 32)
				bits = undefined;

			if (!_ip.parseIPv4(addr) || typeof(bits) === 'undefined')
				return undefined;

			return [ addr, bits ];
		},

		isNetmask: function(addr)
		{
			if (!angular.isArray(addr))
				return false;

			var c;

			for (c = 0; (c < addr.length) && (addr[c] == 255); c++);

			if (c == addr.length)
				return true;

			if ((addr[c] == 254) || (addr[c] == 252) || (addr[c] == 248) ||
				(addr[c] == 240) || (addr[c] == 224) || (addr[c] == 192) ||
				(addr[c] == 128) || (addr[c] == 0))
			{
				for (c++; (c < addr.length) && (addr[c] == 0); c++);

				if (c == addr.length)
					return true;
			}

			return false;
		}
	});
}]);

L2.registerFactory('l2network', ['l2class', 'l2use', 'l2rpc', 'l2uci', '$injector', '$q', 'gettext', function(l2class, l2use, l2rpc, l2uci, $injector, $q, gettext) {
	var _network = { };

	angular.extend(_network, {
		deviceBlacklist: [
			/^gre[0-9]+$/,
			/^gretap[0-9]+$/,
			/^ifb[0-9]+$/,
			/^ip6tnl[0-9]+$/,
			/^sit[0-9]+$/,
			/^wlan[0-9]+\.sta[0-9]+$/,
			/^tunl[0-9]+$/,
			/^ip6gre[0-9]+$/
		],

		rpcCacheFunctions: [
			'protolist', 0, l2rpc.declare({
				object: 'network',
				method: 'get_proto_handlers',
				expect: { '': { } }
			}),
			'ifstate', 1, l2rpc.declare({
				object: 'network.interface',
				method: 'dump',
				expect: { 'interface': [ ] }
			}),
			'devstate', 2, l2rpc.declare({
				object: 'network.device',
				method: 'status',
				expect: { '': { } }
			}),
			'wifistate', 0, l2rpc.declare({
				object: 'network.wireless',
				method: 'status',
				expect: { '': { } }
			}),
			'bwstate', 2, l2rpc.declare({
				object: 'luci2.network.bwmon',
				method: 'statistics',
				expect: { 'statistics': { } }
			}),
			'devlist', 2, l2rpc.declare({
				object: 'luci2.network',
				method: 'device_list',
				expect: { 'devices': [ ] }
			}),
			'swlist', 0, l2rpc.declare({
				object: 'luci2.network',
				method: 'switch_list',
				expect: { 'switches': [ ] }
			})
		],

		registerProtocolHandler: function(proto)
		{
			var pr = _network.Protocol.extend(proto);
			_network.protocolHandlers[proto.protocol] = new pr();
		},

		loadProtocolHandler: function(proto)
		{
			return l2use.load('/luci-ng/proto/' + proto + '.js')
				.catch(angular.noop);
		},

		loadProtocolHandlers: function()
		{
			var deferreds = [
				_network.loadProtocolHandler('none')
			];

			for (var proto in _network.rpcCache.protolist)
				deferreds.push(_network.loadProtocolHandler(proto));

			return $q.all(deferreds);
		},

		callSwitchInfo: l2rpc.declare({
			object: 'luci2.network',
			method: 'switch_info',
			params: [ 'switch' ],
			expect: { 'info': { } }
		}),

		callSwitchInfoCallback: function(responses) {
			var swlist = _network.rpcCache.swlist;
			var swstate = _network.rpcCache.swstate = { };

			for (var i = 0; i < responses.length; i++)
				swstate[swlist[i]] = responses[i];
		},

		loadCacheCallback: function(level)
		{
			var name = '_fetch_cache_cb_' + level;

			return _network[name] || (
				_network[name] = function(responses)
				{
					for (var i = 0; i < _network.rpcCacheFunctions.length; i += 3)
						if (!level || _network.rpcCacheFunctions[i + 1] == level)
							_network.rpcCache[_network.rpcCacheFunctions[i]] = responses.shift();

					if (!level && _network.rpcCache.swlist)
					{
						l2rpc.batch();

						for (var i = 0; i < _network.rpcCache.swlist.length; i++)
							_network.callSwitchInfo(_network.rpcCache.swlist[i]);

						return l2rpc.flush().then(_network.callSwitchInfoCallback);
					}

					return angular.deferrable();
				}
			);
		},

		loadCache: function(level)
		{
			return l2uci.load(['network', 'wireless']).then(function() {
				l2rpc.batch();

				for (var i = 0; i < _network.rpcCacheFunctions.length; i += 3)
					if (!level || _network.rpcCacheFunctions[i + 1] == level)
						_network.rpcCacheFunctions[i + 2]();

				return l2rpc.flush().then(_network.loadCacheCallback(level || 0));
			});
		},

		isBlacklistedDevice: function(dev)
		{
			for (var i = 0; i < _network.deviceBlacklist.length; i++)
				if (dev.match(_network.deviceBlacklist[i]))
					return true;

			return false;
		},

		sortDevicesCallback: function(a, b)
		{
			if (a.options.kind < b.options.kind)
				return -1;
			else if (a.options.kind > b.options.kind)
				return 1;

			if (a.options.ifname < b.options.ifname)
				return -1;
			else if (a.options.ifname > b.options.ifname)
				return 1;

			return 0;
		},

		getDeviceObject: function(ifname)
		{
			var alias = (ifname.charAt(0) == '@');
			return _network.deviceObjects[ifname] || (
				_network.deviceObjects[ifname] = {
					ifname:  ifname,
					kind:    alias ? 'alias' : 'ethernet',
					type:    alias ? 0 : 1,
					up:      false,
					changed: { }
				}
			);
		},

		getInterfaceObject: function(name)
		{
			return _network.interfaceObjects[name] || (
				_network.interfaceObjects[name] = {
					name:    name,
					proto:   _network.protocolHandlers.none,
					changed: { }
				}
			);
		},

		loadDevicesCallback: function()
		{
			var wificount = { };

			for (var ifname in _network.rpcCache.devstate)
			{
				if (_network.isBlacklistedDevice(ifname))
					continue;

				var dev = _network.rpcCache.devstate[ifname];
				var entry = _network.getDeviceObject(ifname);

				entry.up = dev.up;

				switch (dev.type)
				{
				case 'IP tunnel':
					entry.kind = 'tunnel';
					break;

				case 'Bridge':
					entry.kind = 'bridge';
					//entry.ports = dev['bridge-members'].sort();
					break;
				}
			}

			for (var i = 0; i < _network.rpcCache.devlist.length; i++)
			{
				var dev = _network.rpcCache.devlist[i];

				if (_network.isBlacklistedDevice(dev.device))
					continue;

				var entry = _network.getDeviceObject(dev.device);

				entry.up   = dev.is_up;
				entry.type = dev.type;

				switch (dev.type)
				{
				case 1: /* Ethernet */
					if (dev.is_bridge)
						entry.kind = 'bridge';
					else if (dev.is_tuntap)
						entry.kind = 'tunnel';
					else if (dev.is_wireless)
						entry.kind = 'wifi';
					break;

				case 512: /* PPP */
				case 768: /* IP-IP Tunnel */
				case 769: /* IP6-IP6 Tunnel */
				case 776: /* IPv6-in-IPv4 */
				case 778: /* GRE over IP */
					entry.kind = 'tunnel';
					break;
				}
			}

			var net = l2uci.sections('network');
			for (var i = 0; i < net.length; i++)
			{
				var s = net[i];
				var sid = s['.name'];

				if (s['.type'] == 'device' && s.name)
				{
					var entry = _network.getDeviceObject(s.name);

					switch (s.type)
					{
					case 'macvlan':
					case 'tunnel':
						entry.kind = 'tunnel';
						break;
					}

					entry.sid = sid;
				}
				else if (s['.type'] == 'interface' && !s['.anonymous'] && s.ifname)
				{
					var ifnames = angular.toArray(s.ifname);

					for (var j = 0; j < ifnames.length; j++)
						_network.getDeviceObject(ifnames[j]);

					if (s['.name'] != 'loopback')
					{
						var entry = _network.getDeviceObject('@%s'.format(s['.name']));

						entry.type = 0;
						entry.kind = 'alias';
						entry.sid  = sid;
					}
				}
				else if (s['.type'] == 'switch_vlan' && s.device)
				{
					var sw = _network.rpcCache.swstate[s.device];
					var vid = parseInt(s.vid || s.vlan);
					var ports = angular.toArray(s.ports);

					if (!sw || !ports.length || isNaN(vid))
						continue;

					var ifname = undefined;

					for (var j = 0; j < ports.length; j++)
					{
						var port = parseInt(ports[j]);
						var tag = (ports[j].replace(/[^tu]/g, '') == 't');

						if (port == sw.cpu_port)
						{
							// XXX: need a way to map switch to netdev
							if (tag)
								ifname = 'eth0.%d'.format(vid);
							else
								ifname = 'eth0';

							break;
						}
					}

					if (!ifname)
						continue;

					var entry = _network.getDeviceObject(ifname);

					entry.kind = 'vlan';
					entry.sid  = sid;
					entry.vsw  = sw;
					entry.vid  = vid;
				}
			}

			var wifi = l2uci.sections('wireless');
			for (var i = 0, c = 0; i < wifi.length; i++)
			{
				var s = wifi[i];

				if (s['.type'] == 'wifi-iface')
				{
					var sid = '@wifi-iface[%d]'.format(c++);

					if (!s.device)
						continue;

					var r = parseInt(s.device.replace(/^[^0-9]+/, ''));
					var n = wificount[s.device] = (wificount[s.device] || 0) + 1;
					var id = 'radio%d.network%d'.format(r, n);
					var ifname = id;

					if (_network.rpcCache.wifistate[s.device])
					{
						var ifcs = _network.rpcCache.wifistate[s.device].interfaces;
						for (var ifc in ifcs)
						{
							if (ifcs[ifc].section == sid && ifcs[ifc].ifname)
							{
								ifname = ifcs[ifc].ifname;
								break;
							}
						}
					}

					var entry = _network.getDeviceObject(ifname);

					entry.kind   = 'wifi';
					entry.sid    = s['.name'];
					entry.wid    = id;
					entry.wdev   = s.device;
					entry.wmode  = s.mode;
					entry.wssid  = s.ssid;
					entry.wbssid = s.bssid;
				}
			}

			for (var i = 0; i < net.length; i++)
			{
				var s = net[i];
				var sid = s['.name'];

				if (s['.type'] == 'interface' && !s['.anonymous'] && s.type == 'bridge')
				{
					var ifnames = angular.toArray(s.ifname);

					for (var ifname in _network.deviceObjects)
					{
						var dev = _network.deviceObjects[ifname];

						if (dev.kind != 'wifi')
							continue;

						var wnets = angular.toArray(l2uci.get('wireless', dev.sid, 'network'));
						if (wnets.indexOf(sid) > -1)
							ifnames.push(ifname);
					}

					entry = _network.getDeviceObject('br-%s'.format(s['.name']));
					entry.type  = 1;
					entry.kind  = 'bridge';
					entry.sid   = sid;
					entry.ports = ifnames.sort();
				}
			}
		},

		loadInterfacesCallback: function()
		{
			var net = l2uci.sections('network');

			for (var i = 0; i < net.length; i++)
			{
				var s = net[i];
				var sid = s['.name'];

				if (s['.type'] == 'interface' && !s['.anonymous'] && s.proto)
				{
					var entry = _network.getInterfaceObject(s['.name']);
					var proto = _network.protocolHandlers[s.proto] || _network.protocolHandlers.none;

					var l3dev = undefined;
					var l2dev = undefined;

					var ifnames = angular.toArray(s.ifname);

					for (var ifname in _network.deviceObjects)
					{
						var dev = _network.deviceObjects[ifname];

						if (dev.kind != 'wifi')
							continue;

						var wnets = angular.toArray(l2uci.get('wireless', dev.sid, 'network'));
						if (wnets.indexOf(entry.name) > -1)
							ifnames.push(ifname);
					}

					if (proto.virtual)
						l3dev = '%s-%s'.format(s.proto, entry.name);
					else if (s.type == 'bridge')
						l3dev = 'br-%s'.format(entry.name);
					else
						l3dev = ifnames[0];

					if (!proto.virtual && s.type == 'bridge')
						l2dev = 'br-%s'.format(entry.name);
					else if (!proto.virtual)
						l2dev = ifnames[0];

					entry.proto = proto;
					entry.sid   = sid;
					entry.l3dev = l3dev;
					entry.l2dev = l2dev;
				}
			}

			for (var i = 0; i < _network.rpcCache.ifstate.length; i++)
			{
				var iface = _network.rpcCache.ifstate[i];
				var entry = _network.getInterfaceObject(iface['interface']);
				var proto = _network.protocolHandlers[iface.proto] || _network.protocolHandlers.none;

				/* this is a virtual interface, either deleted from config but
				   not applied yet or set up from external tools (6rd) */
				if (!entry.sid)
				{
					entry.proto = proto;
					entry.l2dev = iface.device;
					entry.l3dev = iface.l3_device;
				}
			}

			_network.deferred.resolve();
		},

		load: function()
		{
			if (!_network.deferred) {
				_network.deferred         = $q.defer();
				_network.rpcCache         = { };
				_network.deviceObjects    = { };
				_network.interfaceObjects = { };
				_network.protocolHandlers = { };

				_network.loadCache()
					.then(_network.loadProtocolHandlers)
					.then(_network.loadDevicesCallback, _network.loadDevicesCallback)
					.then(_network.loadInterfacesCallback);
			}

			return _network.deferred.promise;
		},

		update: function()
		{
			delete _network.deferred;
			delete _network.rpcCache;
			return _network.load();
		},

		refreshInterfaceStatus: function()
		{
			return _network.loadCache(1).then(_network.loadInterfacesCallback);
		},

		refreshDeviceStatus: function()
		{
			return _network.loadCache(2).then(_network.loadDevicesCallback);
		},

		refreshStatus: function()
		{
			return _network.loadCache(1)
				.then(_network.loadCache(2))
				.then(_network.loadDevicesCallback)
				.then(_network.loadInterfacesCallback);
		},

		getDevices: function()
		{
			var devs = [ ];

			for (var ifname in _network.deviceObjects)
				if (ifname != 'lo')
					devs.push(new _network.Device(_network.deviceObjects[ifname]));

			return devs.sort(_network.sortDevicesCallback);
		},

		getDeviceByInterface: function(iface)
		{
			if (iface instanceof _network.Interface)
				iface = iface.name();

			if (_network.interfaceObjects[iface])
				return _network.getDevice(_network.interfaceObjects[iface].l3dev) ||
					   _network.getDevice(_network.interfaceObjects[iface].l2dev);

			return undefined;
		},

		getDevice: function(ifname)
		{
			if (_network.deviceObjects[ifname])
				return new _network.Device(_network.deviceObjects[ifname]);

			return undefined;
		},

		createDevice: function(name)
		{
			return new _network.Device(_network.getDeviceObject(name));
		},

		getInterfaces: function()
		{
			var ifaces = [ ];

			for (var name in _network.interfaceObjects)
				if (name != 'loopback')
					ifaces.push(_network.getInterface(name));

			ifaces.sort(function(a, b) {
				if (a.name() < b.name())
					return -1;
				else if (a.name() > b.name())
					return 1;
				else
					return 0;
			});

			return ifaces;
		},

		getInterfacesByDevice: function(dev)
		{
			var ifaces = [ ];

			if (dev instanceof _network.Device)
				dev = dev.name();

			for (var name in _network.interfaceObjects)
			{
				var iface = _network.interfaceObjects[name];
				if (iface.l2dev == dev || iface.l3dev == dev)
					ifaces.push(_network.getInterface(name));
			}

			ifaces.sort(function(a, b) {
				if (a.name() < b.name())
					return -1;
				else if (a.name() > b.name())
					return 1;
				else
					return 0;
			});

			return ifaces;
		},

		getInterface: function(iface)
		{
			if (_network.interfaceObjects[iface])
				return new _network.Interface(_network.interfaceObjects[iface]);

			return undefined;
		},

		getProtocols: function()
		{
			var rv = [ ];

			for (var proto in _network.protocolHandlers)
			{
				var pr = _network.protocolHandlers[proto];

				rv.push({
					name:        proto,
					description: pr.description,
					virtual:     pr.virtual,
					tunnel:      pr.tunnel
				});
			}

			return rv.sort(function(a, b) {
				if (a.name < b.name)
					return -1;
				else if (a.name > b.name)
					return 1;
				else
					return 0;
			});
		},

		findWANByAddr: function(ipaddr)
		{
			for (var i = 0; i < _network.rpcCache.ifstate.length; i++)
			{
				var ifstate = _network.rpcCache.ifstate[i];

				if (!ifstate.route)
					continue;

				for (var j = 0; j < ifstate.route.length; j++)
					if (ifstate.route[j].mask == 0 &&
						ifstate.route[j].target == ipaddr &&
						typeof(ifstate.route[j].table) == 'undefined')
					{
						return _network.getInterface(ifstate['interface']);
					}
			}

			return undefined;
		},

		findWAN: function()
		{
			return _network.findWANByAddr('0.0.0.0');
		},

		findWAN6: function()
		{
			return _network.findWANByAddr('::');
		},

		resolveAlias: function(ifname)
		{
			if (ifname instanceof _network.Device)
				ifname = ifname.name();

			var dev = _network.deviceObjects[ifname];
			var seen = { };

			while (dev && dev.kind == 'alias')
			{
				// loop
				if (seen[dev.ifname])
					return undefined;

				var ifc = _network.interfaceObjects[dev.sid];

				seen[dev.ifname] = true;
				dev = ifc ? _network.deviceObjects[ifc.l3dev] : undefined;
			}

			return dev ? _network.getDevice(dev.ifname) : undefined;
		},

		Interface: l2class.extend({
			getStatus: function(key)
			{
				var s = _network.rpcCache.ifstate;

				for (var i = 0; i < s.length; i++)
					if (s[i]['interface'] == this.options.name)
						return key ? s[i][key] : s[i];

				return undefined;
			},

			get: function(key)
			{
				return l2uci.get('network', this.options.name, key);
			},

			set: function(key, val)
			{
				return l2uci.set('network', this.options.name, key, val);
			},

			name: function()
			{
				return this.options.name;
			},

			protocol: function()
			{
				return (_network.get('proto') || 'none');
			},

			isUp: function()
			{
				return (_network.getStatus('up') === true);
			},

			isVirtual: function()
			{
				return (typeof(this.options.sid) != 'string');
			},

			getProtocol: function()
			{
				var prname = this.get('proto') || 'none';
				return _network.protocolHandlers[prname] || _network.protocolHandlers.none;
			},

			getUptime: function()
			{
				var uptime = this.getStatus('uptime');
				return isNaN(uptime) ? 0 : uptime;
			},

			getDevice: function(resolveAlias)
			{
				if (this.options.l3dev)
					return _network.getDevice(this.options.l3dev);

				return undefined;
			},

			getPhysdev: function()
			{
				if (this.options.l2dev)
					return _network.getDevice(this.options.l2dev);

				return undefined;
			},

			getSubdevices: function()
			{
				var rv = [ ];
				var dev = this.options.l2dev ?
					_network.deviceObjects[this.options.l2dev] : undefined;

				if (dev && dev.kind == 'bridge' && dev.ports && dev.ports.length)
					for (var i = 0; i < dev.ports.length; i++)
						rv.push(_network.getDevice(dev.ports[i]));

				return rv;
			},

			getIPv4Addrs: function(mask)
			{
				var rv = [ ];
				var addrs = this.getStatus('ipv4-address');

				if (addrs)
					for (var i = 0; i < addrs.length; i++)
						if (!mask)
							rv.push(addrs[i].address);
						else
							rv.push('%s/%d'.format(addrs[i].address, addrs[i].mask));

				return rv;
			},

			getIPv6Addrs: function(mask)
			{
				var rv = [ ];
				var addrs;

				addrs = this.getStatus('ipv6-address');

				if (addrs)
					for (var i = 0; i < addrs.length; i++)
						if (!mask)
							rv.push(addrs[i].address);
						else
							rv.push('%s/%d'.format(addrs[i].address, addrs[i].mask));

				addrs = this.getStatus('ipv6-prefix-assignment');

				if (addrs)
					for (var i = 0; i < addrs.length; i++)
						if (!mask)
							rv.push('%s1'.format(addrs[i].address));
						else
							rv.push('%s1/%d'.format(addrs[i].address, addrs[i].mask));

				return rv;
			},

			getDNSAddrs: function()
			{
				var rv = [ ];
				var addrs = this.getStatus('dns-server');

				if (addrs)
					for (var i = 0; i < addrs.length; i++)
						rv.push(addrs[i]);

				return rv;
			},

			getIPv4DNS: function()
			{
				var rv = [ ];
				var dns = this.getStatus('dns-server');

				if (dns)
					for (var i = 0; i < dns.length; i++)
						if (dns[i].indexOf(':') == -1)
							rv.push(dns[i]);

				return rv;
			},

			getIPv6DNS: function()
			{
				var rv = [ ];
				var dns = this.getStatus('dns-server');

				if (dns)
					for (var i = 0; i < dns.length; i++)
						if (dns[i].indexOf(':') > -1)
							rv.push(dns[i]);

				return rv;
			},

			getIPv4Gateway: function()
			{
				var rt = this.getStatus('route');

				if (rt)
					for (var i = 0; i < rt.length; i++)
						if (rt[i].target == '0.0.0.0' && rt[i].mask == 0)
							return rt[i].nexthop;

				return undefined;
			},

			getIPv6Gateway: function()
			{
				var rt = this.getStatus('route');

				if (rt)
					for (var i = 0; i < rt.length; i++)
						if (rt[i].target == '::' && rt[i].mask == 0)
							return rt[i].nexthop;

				return undefined;
			},

			getStatistics: function()
			{
				var dev = this.getDevice() || new _network.Device({});
				return dev.getStatistics();
			},

			getTrafficHistory: function()
			{
				var dev = this.getDevice() || new _network.Device({});
				return dev.getTrafficHistory();
			},

			renderBadge: function()
			{
				var badge = $('<span />')
					.addClass('badge')
					.text('%s: '.format(_network.name()));

				var dev = this.getDevice();
				var subdevs = this.getSubdevices();

				if (subdevs.length)
					for (var j = 0; j < subdevs.length; j++)
						badge.append($('<img />')
							.attr('src', subdevs[j].icon())
							.attr('title', '%s (%s)'.format(subdevs[j].description(), subdevs[j].name() || '?')));
				else if (dev)
					badge.append($('<img />')
						.attr('src', dev.icon())
						.attr('title', '%s (%s)'.format(dev.description(), dev.name() || '?')));
				else
					badge.append($('<em />').text(gettext('(No devices attached)')));

				return badge;
			},

			setDevices: function(devs)
			{
				var dev = this.getPhysdev();
				var old_devs = [ ];
				var changed = false;

				if (dev && dev.isBridge())
					old_devs = this.getSubdevices();
				else if (dev)
					old_devs = [ dev ];

				if (old_devs.length != devs.length)
					changed = true;
				else
					for (var i = 0; i < old_devs.length; i++)
					{
						var dev = devs[i];

						if (dev instanceof _network.Device)
							dev = dev.name();

						if (!dev || old_devs[i].name() != dev)
						{
							changed = true;
							break;
						}
					}

				if (changed)
				{
					for (var i = 0; i < old_devs.length; i++)
						old_devs[i].removeFromInterface(this);

					for (var i = 0; i < devs.length; i++)
					{
						var dev = devs[i];

						if (!(dev instanceof _network.Device))
							dev = _network.getDevice(dev);

						if (dev)
							dev.attachToInterface(this);
					}
				}
			},

			changeProtocol: function(proto)
			{
				var pr = _network.protocolHandlers[proto];

				if (!pr)
					return;

				for (var opt in (this.get() || { }))
				{
					switch (opt)
					{
					case 'type':
					case 'ifname':
					case 'macaddr':
						if (pr.virtual)
							this.set(opt, undefined);
						break;

					case 'auto':
					case 'mtu':
						break;

					case 'proto':
						this.set(opt, pr.protocol);
						break;

					default:
						this.set(opt, undefined);
						break;
					}
				}
			},

			createFormPrepareCallback: function()
			{
				var map = this;
				var iface = map.options.netIface;
				var proto = iface.getProtocol();
				var device = iface.getDevice();

				map.options.caption = gettext('Configure "%s"').format(iface.name());

				var section = map.section(L.cbi.SingleSection, iface.name(), {
					anonymous:   true
				});

				section.tab({
					id:      'general',
					caption: gettext('General Settings')
				});

				section.tab({
					id:      'advanced',
					caption: gettext('Advanced Settings')
				});

				section.tab({
					id:      'ipv6',
					caption: gettext('IPv6')
				});

				section.tab({
					id:      'physical',
					caption: gettext('Physical Settings')
				});


				section.taboption('general', L.cbi.CheckboxValue, 'auto', {
					caption:     gettext('Start on boot'),
					optional:    true,
					initial:     true
				});

				var pr = section.taboption('general', L.cbi.ListValue, 'proto', {
					caption:     gettext('Protocol')
				});

				pr.ucivalue = function(sid) {
					return iface.get('proto') || 'none';
				};

				var ok = section.taboption('general', L.cbi.ButtonValue, '_confirm', {
					caption:     gettext('Really switch?'),
					description: gettext('Changing the protocol will clear all configuration for this interface!'),
					text:        gettext('Change protocol')
				});

				ok.on('click', function(ev) {
					iface.changeProtocol(pr.formvalue(ev.data.sid));
					iface.createForm(mapwidget).show();
				});

				var protos = _network.getProtocols();

				for (var i = 0; i < protos.length; i++)
					pr.value(protos[i].name, protos[i].description);

				proto.populateForm(section, iface);

				if (!proto.virtual)
				{
					var br = section.taboption('physical', L.cbi.CheckboxValue, 'type', {
						caption:     gettext('Network bridge'),
						description: gettext('Merges multiple devices into one logical bridge'),
						optional:    true,
						enabled:     'bridge',
						disabled:    '',
						initial:     ''
					});

					section.taboption('physical', L.cbi.DeviceList, '__iface_multi', {
						caption:     gettext('Devices'),
						multiple:    true,
						bridges:     false
					}).depends('type', true);

					section.taboption('physical', L.cbi.DeviceList, '__iface_single', {
						caption:     gettext('Device'),
						multiple:    false,
						bridges:     true
					}).depends('type', false);

					var mac = section.taboption('physical', L.cbi.InputValue, 'macaddr', {
						caption:     gettext('Override MAC'),
						optional:    true,
						placeholder: device ? device.getMACAddress() : undefined,
						datatype:    'macaddr'
					})

					mac.ucivalue = function(sid)
					{
						if (device)
							return device.get('macaddr');

						return _network.callSuper('ucivalue', sid);
					};

					mac.save = function(sid)
					{
						if (!_network.changed(sid))
							return false;

						if (device)
							device.set('macaddr', _network.formvalue(sid));
						else
							_network.callSuper('set', sid);

						return true;
					};
				}

				section.taboption('physical', L.cbi.InputValue, 'mtu', {
					caption:     gettext('Override MTU'),
					optional:    true,
					placeholder: device ? device.getMTU() : undefined,
					datatype:    'range(1, 9000)'
				});

				section.taboption('physical', L.cbi.InputValue, 'metric', {
					caption:     gettext('Override Metric'),
					optional:    true,
					placeholder: 0,
					datatype:    'uinteger'
				});

				for (var field in section.fields)
				{
					switch (field)
					{
					case 'proto':
						break;

					case '_confirm':
						for (var i = 0; i < protos.length; i++)
							if (protos[i].name != proto.protocol)
								section.fields[field].depends('proto', protos[i].name);
						break;

					default:
						section.fields[field].depends('proto', proto.protocol, true);
						break;
					}
				}
			},

			createForm: function(mapwidget)
			{
				if (!mapwidget)
					mapwidget = L.cbi.Map;

				var map = new mapwidget('network', {
					prepare:     _network.createFormPrepareCallback,
					netIface:    _network
				});

				return map;
			}
		}),

		Device: l2class.extend({
			wifiModeStrings: {
				ap: gettext('Master'),
				sta: gettext('Client'),
				adhoc: gettext('Ad-Hoc'),
				monitor: gettext('Monitor'),
				wds: gettext('Static WDS')
			},

			getStatus: function(key)
			{
				var s = _network.rpcCache.devstate[this.options.ifname];

				if (s)
					return key ? s[key] : s;

				return undefined;
			},

			get: function(key)
			{
				var sid = this.options.sid;
				var pkg = (this.options.kind == 'wifi') ? 'wireless' : 'network';
				return l2uci.get(pkg, sid, key);
			},

			set: function(key, val)
			{
				var sid = this.options.sid;
				var pkg = (this.options.kind == 'wifi') ? 'wireless' : 'network';
				return l2uci.set(pkg, sid, key, val);
			},

			init: function()
			{
				if (typeof(this.options.type) == 'undefined')
					this.options.type = 1;

				if (typeof(this.options.kind) == 'undefined')
					this.options.kind = 'ethernet';

				if (typeof(this.options.networks) == 'undefined')
					this.options.networks = [ ];
			},

			name: function()
			{
				return this.options.ifname;
			},

			description: function()
			{
				switch (this.options.kind)
				{
				case 'alias':
					return gettext('Alias for network "%s"').format(this.options.ifname.substring(1));

				case 'bridge':
					return gettext('Network bridge');

				case 'ethernet':
					return gettext('Network device');

				case 'tunnel':
					switch (this.options.type)
					{
					case 1: /* tuntap */
						return gettext('TAP device');

					case 512: /* PPP */
						return gettext('PPP tunnel');

					case 768: /* IP-IP Tunnel */
						return gettext('IP-in-IP tunnel');

					case 769: /* IP6-IP6 Tunnel */
						return gettext('IPv6-in-IPv6 tunnel');

					case 776: /* IPv6-in-IPv4 */
						return gettext('IPv6-over-IPv4 tunnel');
						break;

					case 778: /* GRE over IP */
						return gettext('GRE-over-IP tunnel');

					default:
						return gettext('Tunnel device');
					}

				case 'vlan':
					return gettext('VLAN %d on %s').format(this.options.vid, this.options.vsw.model);

				case 'wifi':
					var o = this.options;
					/// (Wifi-Mode) "(SSID)" on (radioX)
					return gettext('%s "%h" on %s').format(
						o.wmode ? this.wifiModeStrings[o.wmode] : gettext('Unknown mode'),
						o.wssid || '?', o.wdev
					);
				}

				return gettext('Unknown device');
			},

			icon: function(up)
			{
				var kind = this.options.kind;

				if (kind == 'alias')
					kind = 'ethernet';

				if (typeof(up) == 'undefined')
					up = this.isUp();

				return '/luci-ng/icons/%s%s.png'.format(kind, up ? '' : '_disabled');
			},

			isUp: function()
			{
				var l = _network.rpcCache.devlist;

				for (var i = 0; i < l.length; i++)
					if (l[i].device == this.options.ifname)
						return (l[i].is_up === true);

				return false;
			},

			isAlias: function()
			{
				return (this.options.kind == 'alias');
			},

			isBridge: function()
			{
				return (this.options.kind == 'bridge');
			},

			isBridgeable: function()
			{
				return (this.options.type == 1 && this.options.kind != 'bridge');
			},

			isWireless: function()
			{
				return (this.options.kind == 'wifi');
			},

			isInNetwork: function(net)
			{
				if (!(net instanceof _network.Interface))
					net = _network.getInterface(net);

				if (net)
				{
					if (net.options.l3dev == this.options.ifname ||
						net.options.l2dev == this.options.ifname)
						return true;

					var dev = _network.deviceObjects[net.options.l2dev];
					if (dev && dev.kind == 'bridge' && dev.ports)
						return (dev.ports.indexOf(this.options.ifname) > -1);
				}

				return false;
			},

			getMTU: function()
			{
				var dev = _network.rpcCache.devstate[this.options.ifname];
				if (dev && !isNaN(dev.mtu))
					return dev.mtu;

				return undefined;
			},

			getMACAddress: function()
			{
				if (this.options.type != 1)
					return undefined;

				var dev = _network.rpcCache.devstate[this.options.ifname];
				if (dev && dev.macaddr)
					return dev.macaddr.toUpperCase();

				return undefined;
			},

			getInterfaces: function()
			{
				return _network.getInterfacesByDevice(this.options.name);
			},

			getStatistics: function()
			{
				var s = _network.getStatus('statistics') || { };
				return {
					rx_bytes: (s.rx_bytes || 0),
					tx_bytes: (s.tx_bytes || 0),
					rx_packets: (s.rx_packets || 0),
					tx_packets: (s.tx_packets || 0)
				};
			},

			getTrafficHistory: function()
			{
				var def = new Array(120);

				for (var i = 0; i < 120; i++)
					def[i] = 0;

				var h = _network.rpcCache.bwstate[this.options.ifname] || { };
				return {
					rx_bytes: (h.rx_bytes || def),
					tx_bytes: (h.tx_bytes || def),
					rx_packets: (h.rx_packets || def),
					tx_packets: (h.tx_packets || def)
				};
			},

			removeFromInterface: function(iface)
			{
				if (!(iface instanceof _network.Interface))
					iface = _network.getInterface(iface);

				if (!iface)
					return;

				var ifnames = angular.toArray(iface.get('ifname'));
				if (ifnames.indexOf(this.options.ifname) > -1)
					iface.set('ifname', angular.filterArray(ifnames, this.options.ifname));

				if (this.options.kind != 'wifi')
					return;

				var networks = angular.toArray(this.get('network'));
				if (networks.indexOf(iface.name()) > -1)
					this.set('network', angular.filterArray(networks, iface.name()));
			},

			attachToInterface: function(iface)
			{
				if (!(iface instanceof _network.Interface))
					iface = _network.getInterface(iface);

				if (!iface)
					return;

				if (this.options.kind != 'wifi')
				{
					var ifnames = angular.toArray(iface.get('ifname'));
					if (ifnames.indexOf(this.options.ifname) < 0)
					{
						ifnames.push(this.options.ifname);
						iface.set('ifname', (ifnames.length > 1) ? ifnames : ifnames[0]);
					}
				}
				else
				{
					var networks = angular.toArray(this.get('network'));
					if (networks.indexOf(iface.name()) < 0)
					{
						networks.push(iface.name());
						this.set('network', (networks.length > 1) ? networks : networks[0]);
					}
				}
			}
		})
	});

	_network.Protocol = _network.Interface.extend({
		description: '__unknown__',
		tunnel:      false,
		virtual:     false,

		populateForm: function(section, iface)
		{

		}
	});

	return _network;
}]);
