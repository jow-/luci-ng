L2.registerFactory('l2validation', ['l2ip', 'gettext', function(l2ip, gettext) {
	var _val = { };
	return angular.extend(_val, {
		compile: function(code)
		{
			var pos = 0;
			var esc = false;
			var depth = 0;
			var stack = [ ];

			code += ',';

			for (var i = 0; i < code.length; i++)
			{
				if (esc)
				{
					esc = false;
					continue;
				}

				switch (code.charCodeAt(i))
				{
				case 92:
					esc = true;
					break;

				case 40:
				case 44:
					if (depth <= 0)
					{
						if (pos < i)
						{
							var label = code.substring(pos, i);
								label = label.replace(/\\(.)/g, '$1');
								label = label.replace(/^[ \t]+/g, '');
								label = label.replace(/[ \t]+$/g, '');

							if (label && !isNaN(label))
							{
								stack.push(parseFloat(label));
							}
							else if (label.match(/^(['"]).*\1$/))
							{
								stack.push(label.replace(/^(['"])(.*)\1$/, '$2'));
							}
							else if (typeof _val.types[label] == 'function')
							{
								stack.push(_val.types[label]);
								stack.push([ ]);
							}
							else
							{
								throw "Syntax error, unhandled token '"+label+"'";
							}
						}
						pos = i+1;
					}
					depth += (code.charCodeAt(i) == 40);
					break;

				case 41:
					if (--depth <= 0)
					{
						if (typeof stack[stack.length-2] != 'function')
							throw "Syntax error, argument list follows non-function";

						stack[stack.length-1] =
							_val.compile(code.substring(pos, i));

						pos = i+1;
					}
					break;
				}
			}

			return stack;
		},

		test: function(stack, value) {
			delete _val.message;

			if (!stack[0].apply(value, stack[1]))
				return _val.message;

			return undefined;
		},

		types: {
			'integer': function()
			{
				if (this.match(/^-?[0-9]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid integer');
				return false;
			},

			'uinteger': function()
			{
				if (_val.types['integer'].apply(this) && (this >= 0))
					return true;

				_val.message = gettext('Must be a positive integer');
				return false;
			},

			'float': function()
			{
				if (!isNaN(parseFloat(this)))
					return true;

				_val.message = gettext('Must be a valid number');
				return false;
			},

			'ufloat': function()
			{
				if (_val.types['float'].apply(this) && (this >= 0))
					return true;

				_val.message = gettext('Must be a positive number');
				return false;
			},

			'ipaddr': function()
			{
				if (l2ip.parseIPv4(this) || l2ip.parseIPv6(this))
					return true;

				_val.message = gettext('Must be a valid IP address');
				return false;
			},

			'ip4addr': function()
			{
				if (l2ip.parseIPv4(this))
					return true;

				_val.message = gettext('Must be a valid IPv4 address');
				return false;
			},

			'ip6addr': function()
			{
				if (l2ip.parseIPv6(this))
					return true;

				_val.message = gettext('Must be a valid IPv6 address');
				return false;
			},

			'netmask4': function()
			{
				if (l2ip.isNetmask(l2ip.parseIPv4(this)))
					return true;

				_val.message = gettext('Must be a valid IPv4 netmask');
				return false;
			},

			'netmask6': function()
			{
				if (l2ip.isNetmask(l2ip.parseIPv6(this)))
					return true;

				_val.message = gettext('Must be a valid IPv6 netmask6');
				return false;
			},

			'cidr4': function()
			{
				if (this.match(/^([0-9.]+)\/(\d{1,2})$/))
					if (RegExp.$2 <= 32 && l2ip.parseIPv4(RegExp.$1))
						return true;

				_val.message = gettext('Must be a valid IPv4 prefix');
				return false;
			},

			'cidr6': function()
			{
				if (this.match(/^([a-fA-F0-9:.]+)\/(\d{1,3})$/))
					if (RegExp.$2 <= 128 && l2ip.parseIPv6(RegExp.$1))
						return true;

				_val.message = gettext('Must be a valid IPv6 prefix');
				return false;
			},

			'ipmask4': function()
			{
				if (this.match(/^([0-9.]+)\/([0-9.]+)$/))
				{
					var addr = RegExp.$1, mask = RegExp.$2;
					if (l2ip.parseIPv4(addr) && l2ip.isNetmask(l2ip.parseIPv4(mask)))
						return true;
				}

				_val.message = gettext('Must be a valid IPv4 address/netmask pair');
				return false;
			},

			'ipmask6': function()
			{
				if (this.match(/^([a-fA-F0-9:.]+)\/([a-fA-F0-9:.]+)$/))
				{
					var addr = RegExp.$1, mask = RegExp.$2;
					if (l2ip.parseIPv6(addr) && l2ip.isNetmask(L.parseIPv6(mask)))
						return true;
				}

				_val.message = gettext('Must be a valid IPv6 address/netmask pair');
				return false;
			},

			'port': function()
			{
				if (_val.types['integer'].apply(this) &&
					(this >= 0) && (this <= 65535))
					return true;

				_val.message = gettext('Must be a valid port number');
				return false;
			},

			'portrange': function()
			{
				if (this.match(/^(\d+)-(\d+)$/))
				{
					var p1 = RegExp.$1;
					var p2 = RegExp.$2;

					if (_val.types['port'].apply(p1) &&
						_val.types['port'].apply(p2) &&
						(parseInt(p1) <= parseInt(p2)))
						return true;
				}
				else if (_val.types['port'].apply(this))
				{
					return true;
				}

				_val.message = gettext('Must be a valid port range');
				return false;
			},

			'macaddr': function()
			{
				if (this.match(/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/) != null)
					return true;

				_val.message = gettext('Must be a valid MAC address');
				return false;
			},

			'host': function()
			{
				if (_val.types['hostname'].apply(this) ||
					_val.types['ipaddr'].apply(this))
					return true;

				_val.message = gettext('Must be a valid hostname or IP address');
				return false;
			},

			'hostname': function()
			{
				if ((this.length <= 253) &&
					((this.match(/^[a-zA-Z0-9]+$/) != null ||
					 (this.match(/^[a-zA-Z0-9_][a-zA-Z0-9_\-.]*[a-zA-Z0-9]$/) &&
					  this.match(/[^0-9.]/)))))
					return true;

				_val.message = gettext('Must be a valid host name');
				return false;
			},

			'network': function()
			{
				if (_val.types['uciname'].apply(this) ||
					_val.types['host'].apply(this))
					return true;

				_val.message = gettext('Must be a valid network name');
				return false;
			},

			'wpakey': function()
			{
				var v = this;

				if ((v.length == 64)
					  ? (v.match(/^[a-fA-F0-9]{64}$/) != null)
					  : ((v.length >= 8) && (v.length <= 63)))
					return true;

				_val.message = gettext('Must be a valid WPA key');
				return false;
			},

			'wepkey': function()
			{
				var v = this;

				if (v.substr(0,2) == 's:')
					v = v.substr(2);

				if (((v.length == 10) || (v.length == 26))
					  ? (v.match(/^[a-fA-F0-9]{10,26}$/) != null)
					  : ((v.length == 5) || (v.length == 13)))
					return true;

				_val.message = gettext('Must be a valid WEP key');
				return false;
			},

			'uciname': function()
			{
				if (this.match(/^[a-zA-Z0-9_]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid UCI identifier');
				return false;
			},

			'range': function(min, max)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(min) && !isNaN(max) && ((val >= min) && (val <= max)))
					return true;

				_val.message = gettext('Must be a number between %d and %d').format(min, max);
				return false;
			},

			'min': function(min)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(min) && !isNaN(val) && (val >= min))
					return true;

				_val.message = gettext('Must be a number greater or equal to %d').format(min);
				return false;
			},

			'max': function(max)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(max) && !isNaN(val) && (val <= max))
					return true;

				_val.message = gettext('Must be a number lower or equal to %d').format(max);
				return false;
			},

			'rangelength': function(min, max)
			{
				var val = '' + this;

				if (!isNaN(min) && !isNaN(max) &&
					(val.length >= min) && (val.length <= max))
					return true;

				if (min != max)
					_val.message = gettext('Must be between %d and %d characters').format(min, max);
				else
					_val.message = gettext('Must be %d characters').format(min);
				return false;
			},

			'minlength': function(min)
			{
				var val = '' + this;

				if (!isNaN(min) && (val.length >= min))
					return true;

				_val.message = gettext('Must be at least %d characters').format(min);
				return false;
			},

			'maxlength': function(max)
			{
				var val = '' + this;

				if (!isNaN(max) && (val.length <= max))
					return true;

				_val.message = gettext('Must be at most %d characters').format(max);
				return false;
			},

			'or': function()
			{
				var msgs = [ ];

				for (var i = 0; i < arguments.length; i += 2)
				{
					delete _val.message;

					if (typeof(arguments[i]) != 'function')
					{
						if (arguments[i] == this)
							return true;

						msgs.push('"%s"'.format(arguments[i]));
						i--;
					}
					else if (arguments[i].apply(this, arguments[i+1]))
					{
						return true;
					}

					if (_val.message)
						msgs.push(_val.message.format.apply(_val.message, arguments[i+1]));
				}

				_val.message = msgs.join( gettext(' - or - '));
				return false;
			},

			'and': function()
			{
				var msgs = [ ];

				for (var i = 0; i < arguments.length; i += 2)
				{
					delete _val.message;

					if (typeof arguments[i] != 'function')
					{
						if (arguments[i] != this)
							return false;
						i--;
					}
					else if (!arguments[i].apply(this, arguments[i+1]))
					{
						return false;
					}

					if (_val.message)
						msgs.push(_val.message.format.apply(_val.message, arguments[i+1]));
				}

				_val.message = msgs.join(', ');
				return true;
			},

			'neg': function()
			{
				return _val.types['or'].apply(
					this.replace(/^[ \t]*![ \t]*/, ''), arguments);
			},

			'list': function(subvalidator, subargs)
			{
				if (typeof subvalidator != 'function')
					return false;

				var tokens = this.match(/[^ \t]+/g);
				for (var i = 0; i < tokens.length; i++)
					if (!subvalidator.apply(tokens[i], subargs))
						return false;

				return true;
			},

			'phonedigit': function()
			{
				if (this.match(/^[0-9\*#!\.]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid phone number digit');
				return false;
			},

			'string': function()
			{
				return true;
			}
		}
	});
}]);


L2.registerDirective('cbiFlag', [function() {
	return {
		restrict: 'AE',
		scope: true,

		controllerAs: 'Flag',
		controller: ['gettext', function(gettext) {
			var self = angular.extend(this, {
				checked: function(set) {
					var val;

					if (arguments.length) {
						if (set)
							val = self.defaultOn ? undefined : self.onValue;
						else
							val = self.defaultOn ? self.offValue : undefined;

						self.cbiOwnerOption.formValue(val);
					}
					else {
						val = self.cbiOwnerOption.formValue();
					}

					return ((val === undefined && self.defaultOn) ||
							(val === self.onValue));
				},

				textValue: function() {
					return self.checked() ? gettext('yes') : gettext('no');
				}
			});
		}],

		replace: true,
		template: '<div class="checkbox"><input id="{{Option.id}}" ng-model="Flag.checked" ng-model-options="{getterSetter:true}" type="checkbox"></div>',

		require: ['cbiFlag', '^cbiOption'],
		link: function($scope, iElem, iAttr, ctrls) {
			var cbiFlagCtrl = ctrls[0],
				cbiOptionCtrl = ctrls[1];

			cbiOptionCtrl.cbiWidget = angular.extend(cbiFlagCtrl, {
				onValue: iAttr.hasOwnProperty('on') ? iAttr.on : '1',
				offValue: iAttr.hasOwnProperty('off') ? iAttr.off : '0',
				defaultOn: iAttr.hasOwnProperty('defaultOn'),
				cbiOwnerOption: cbiOptionCtrl
			});
		}
	};
}]);

L2.registerDirective('cbiInput', [function() {
	return {
		restrict: 'AE',
		replace: true,
		template: '<input id="{{Option.id}}" ng-model="Option.formValue" ng-model-options="{getterSetter:true}" class="form-control" type="text" ng-attr-placeholder="{{Option.placeholder}}">'
	};
}]);

L2.registerDirective('cbiSelect', ['$parse', function($parse) {
	return {
		restrict: 'AE',
		scope: true,

		controllerAs: 'Select',
		controller: [function() {
			var self = angular.extend(this, {
				textValue: function() {
					var o = self.selectElem.options,
					    i = self.selectElem.selectedIndex;

					return o[i].text;
				}
			});
		}],

		replace: true,
		template: function(tAttr, tElem) {
			return '<select id="{{Option.id}}" class="form-control" ng-model="Option.formValue" ng-model-options="{getterSetter:true}"></select>';
		},

		require: ['cbiSelect', '^cbiOption'],
		link: function($scope, iElem, iAttr, ctrls) {
			var cbiSelectCtrl = ctrls[0],
				cbiOptionCtrl = ctrls[1];

			cbiOptionCtrl.cbiWidget = angular.extend(cbiSelectCtrl, {
				selectElem: iElem[0],
				cbiOwnerOption: cbiOptionCtrl
			});
		}
	};
}]);

L2.registerDirective('cbiDeviceList', ['gettext', 'l2network', function(gettext, l2network) {
	return {
		restrict: 'AE',
		scope: { },

		require: ['cbiDeviceList', '^cbiOption', '^cbiSection', '^cbiMap'],
		controllerAs: 'DeviceList',
		controller: ['$scope', function($scope) {
			var self = angular.extend(this, {
				checked: { },
				devices: [ ],
				isLoading: true,

				isUnspecified: function() {
					return angular.isEmptyObject(self.checked);
				},

				isUsableDevice: function(device) {
					if (device.isBridge() && !self.allowBridges)
						return false;

					if (!device.isBridgeable() && self.allowMultiple)
						return false;

					return true;
				},

				init: function() {
					self.cbiOwnerMap.lock();
					l2network.load().then(self.finish);
				},

				finish: function() {
					$scope.$watch(self.cbiOwnerOption.formValue, self.update);
					self.isLoading=false;
					self.reload();
					self.cbiOwnerMap.unlock();
				},

				update: function(newValue) {
					l2network.loadDevicesCallback();
					l2network.loadInterfacesCallback();

					var devnames = angular.toArray(newValue),
					    network = l2network.getInterface(self.cbiOwnerOption.uciSectionName);

					self.reload();

					for (var i = 0, dev; dev = self.devices[i]; i++) {
						if (dev.isInNetwork(network)) {
							self.checked[dev.name()] = true;
							if (!self.allowMultiple)
								break;
						}
					}
				},

				reload: function() {
					var devices = l2network.getDevices();
					self.devices.length = 0;
					for (var i = 0, dev; dev = devices[i]; i++)
						if (self.isUsableDevice(dev))
							self.devices.push(dev);
				},

				select: function(devName) {

					if (self.allowMultiple) {
						if (self.checked[devName])
							delete self.checked[devName];
						else
							self.checked[devName] = true;
					}
					else {
						for (var key in self.checked)
							if (self.checked.hasOwnProperty(key))
								delete self.checked[key];

						if (devName.length)
							self.checked[devName] = true;
					}

					$event.target.blur();

					self.save();
				},

				keydown: function($event) {
					if ($event.which != 10 && $event.which != 13)
						return;

					var ifnames = angular.toArray($event.target.value);

					if (ifnames.length) {
						l2network.createDevice(ifnames[0]);
						self.reload();

						if (!self.allowMultiple) {
							for (var key in self.checked)
								if (self.checked.hasOwnProperty(key))
									delete self.checked[key];
						}

						self.checked[ifnames[0]] = true;
					}

					if (!self.allowMultiple)
						self.isOpen = false;

					$event.target.value = '';

					self.save();
				},

				blur: function($event) {
					$event.which = 10;
					self.keydown($event);
				},

				toggled: function(opened) {
					if (opened)
						self.reload();
				},

				save: function() {
					var devnames = angular.toArray(self.checked);

					if (!self.allowMultiple && devnames.length > 1)
						devnames.length = 1;

					l2network.loadDevicesCallback();
					l2network.loadInterfacesCallback();

					if (self.parentInterface) {
						var ifc = l2network.getInterface(self.parentInterface);
						if (ifc)
							ifc.setDevices(devnames);

						self.redraw();
					}
					else {
						self.cbiOwnerOption.formValue(devnames);
					}

					return true;
				},

				textValue: function() {
					return angular.toArray(self.cbiOwnerOption.formValue()).join(', ');
				},

				isChecked: function(dev) { 
					return self.checked[dev.name()];
				}

			});
		}],

		replace: true,
		template: '' +
			'<div uib-dropdown is-open="DeviceList.isOpen" on-toggle="DeviceList.toggled(open)" auto-close="{{ DeviceList.allowMultiple ? \'outsideClick\' : \'always\' }}">' +
				'<button class="btn btn-default uib-dropdown-toggle" type="button" uib-dropdown-toggle>' +
					'<div class="caption">' +
						'<em ng-if="DeviceList.isLoading" translate>Loading…</em>' +
						'<span ng-if="!DeviceList.isLoading" ng-repeat="dev in DeviceList.devices | filter : DeviceList.isChecked as selected">' +
							'<span title="dev.name()"><img ng-src="{{dev.icon()}}">{{dev.name()}}</span>' +
							'<span ng-if="!$last" class="sep">|</span>' +
						'</span>' +
		 				'<em ng-if="!DeviceList.isLoading && !selected.length">unspecified</em>' +
	 					'<span class="caret"></span>' +
					'</div>' +
				'</button>' +
				'<ul class="dropdown-menu">' +
					'<li ng-repeat="dev in DeviceList.devices" value="{{dev.name()}}" ng-class="{selected: DeviceList.checked[dev.name()]}">' +
						'<a href="#" ng-click="DeviceList.select(dev.name()); $event.preventDefault()"><img ng-src="{{dev.icon()}}"> {{dev.name()}}</a>' +
					'</li>' +
					'<li ng-if="!DeviceList.allowMultiple" ng-class="{selected: DeviceList.isUnspecified()}" value="">' +
						'<a href="#" ng-click="DeviceList.select(\'\'); $event.preventDefault()"><em>unspecified</em></a>' +
					'</li>'  +
					'<li class="divider"></li>' +
					'<li><form class="form-inline">' +
						'<input class="form-control input-sm" type="text" placeholder="{{\'Custom device …\' | translate}}" ' +
							'ng-click="$event.stopPropagation()" ' +
							'ng-keydown="DeviceList.keydown($event)" ' +
							'ng-blur="DeviceList.blur($event)">' +
					'</form></li>' +
				'</ul>' +
			'</div>',

		link: function($scope, iElem, iAttr, ctrls) {
			var cbiDeviceListCtrl = ctrls[0],
				cbiOptionCtrl = ctrls[1],
				cbiSectionCtrl = ctrls[2],
				cbiMapCtrl = ctrls[3];

			cbiOptionCtrl.cbiWidget = angular.extend(cbiDeviceListCtrl, {
				allowBridges: iAttr.hasOwnProperty('bridges'),
				allowMultiple: iAttr.hasOwnProperty('multiple'),
				parentInterface: iAttr.parentInterface,

				cbiOwnerOption: cbiOptionCtrl,
				cbiOwnerSection: cbiSectionCtrl,
				cbiOwnerMap: cbiMapCtrl
			});

			cbiDeviceListCtrl.init();
		}
	};
}]);

L2.registerDirective('cbiNetworkList', ['gettext', 'l2network', function(gettext, l2network) {
	return {
		restrict: 'AE',
		scope: { },

		require: ['cbiNetworkList', '^cbiOption', '^cbiSection', '^cbiMap'],
		controllerAs: 'NetworkList',
		controller: ['$scope', function($scope) {
			var self = angular.extend(this, {
				checked: { },
				interfaces: [ ],
				isLoading: true,

				isUnspecified: function() {
					return angular.isEmptyObject(self.checked);
				},

				isUsableInterface: function(ifc) {
					return true;
				},

				init: function() {
					self.cbiOwnerMap.lock();
					l2network.load().then(self.finish);
				},

				finish: function() {
					$scope.$watch(self.cbiOwnerOption.formValue, self.update);
					self.isLoading=false;
					self.reload();
					self.cbiOwnerMap.unlock();
				},

				update: function(newValue) {
					l2network.loadDevicesCallback();
					l2network.loadInterfacesCallback();

					var ifcnames = angular.toArray(newValue),
					    selected = angular.toObject(ifcnames);

					self.reload();

					for (var i = 0, ifc; ifc = self.interfaces[i]; i++) {
						if (selected[ifc.name()]) {
							self.checked[ifc.name()] = true;
							
							if (!self.allowMultiple)
								break;
						}
					}

				},

				reload: function() {
					var interfaces = l2network.getInterfaces();
					self.interfaces.length = 0;
					for (var i = 0, ifc; ifc = interfaces[i]; i++)
						if (self.isUsableInterface(ifc))
							self.interfaces.push(ifc);
				},

				select: function(ifcName) {

					if (self.allowMultiple) {
						if (self.checked[ifcName])
							delete self.checked[ifcName];
						else
							self.checked[ifcName] = true;
					}
					else {
						for (var key in self.checked)
							if (self.checked.hasOwnProperty(key))
								delete self.checked[key];

						if (ifcName.length)
							self.checked[ifcName] = true;
					}

					if (!self.allowMultiple)
						self.isOpen = false;

					self.cbiOwnerOption.formValue(angular.toArray(self.checked));
				},

				toggled: function(opened) {
					if (opened)
						self.reload();
				},

				textValue: function() {
					return angular.toArray(self.cbiOwnerOption.formValue()).join(', ');
				},
				
				isChecked: function(dev) { 
					return self.checked[dev.name()];
				}
			});
		}],

		replace: true,
		template: '' +
			'<div uib-dropdown is-open="NetworkList.isOpen" on-toggle="NetworkList.toggled(open)" auto-close="{{ NetworkList.allowMultiple ? \'outsideClick\' : \'always\' }}">' +
				'<button class="btn btn-default uib-dropdown-toggle" type="button" uib-dropdown-toggle>' +
					'<div class="caption">' +
						'<em ng-if="NetworkList.isLoading" translate>Loading…</em>' +
						'<span ng-if="!NetworkList.isLoading" ng-repeat="ifc in NetworkList.interfaces | filter : NetworkList.isChecked as selected">' +
							'<span title="ifc.name()"><img ng-src="{{ifc.icon()}}">{{ifc.name()}}</span>' +
							'<span ng-if="!$last" class="sep">|</span>' +
						'</span>' +
		 				'<em ng-if="!NetworkList.isLoading && !selected.length">unspecified</em>' +
	 					'<span class="caret"></span>' +
					'</div>' +
				'</button>' +
				'<ul class="dropdown-menu">' +
					'<li ng-repeat="ifc in NetworkList.interfaces" value="{{ifc.name()}}" ng-class="{selected: NetworkList.checked[ifc.name()]}">' +
						'<a href="#" ng-click="NetworkList.select(ifc.name()); $event.preventDefault()"><img ng-src="{{ifc.icon()}}"> {{ifc.name()}}</a>' +
					'</li>' +
					'<li ng-if="!NetworkList.allowMultiple" ng-class="{selected: NetworkList.isUnspecified()}" value="">' +
						'<a href="#" ng-click="NetworkList.select(\'\'); $event.preventDefault()"><em>unspecified</em></a>' +
					'</li>' +
				'</ul>' +
			'</div>',

		link: function($scope, iElem, iAttr, ctrls) {
			var cbiNetworkListCtrl = ctrls[0],
				cbiOptionCtrl = ctrls[1],
				cbiSectionCtrl = ctrls[2],
				cbiMapCtrl = ctrls[3];

			cbiOptionCtrl.cbiWidget = angular.extend(cbiNetworkListCtrl, {
				allowMultiple: iAttr.hasOwnProperty('multiple'),

				cbiOwnerOption: cbiOptionCtrl,
				cbiOwnerSection: cbiSectionCtrl,
				cbiOwnerMap: cbiMapCtrl
			});

			cbiNetworkListCtrl.init();
		}
	};
}]);
