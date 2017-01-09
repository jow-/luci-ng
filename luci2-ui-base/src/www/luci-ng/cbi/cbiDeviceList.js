'use strict';

angular.module('LuCI2').directive('cbiDeviceList', function(gettext, l2network) {
	return {
		restrict: 'AE',
		scope: { },

		require: ['cbiDeviceList', '^cbiOption', '^cbiSection', '^cbiMap'],
		controllerAs: 'DeviceList',
		controller: function($scope) {
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
		},

		replace: true,
		templateUrl: 'luci-ng/cbi/cbiDeviceList.tmpl.html',

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
});

