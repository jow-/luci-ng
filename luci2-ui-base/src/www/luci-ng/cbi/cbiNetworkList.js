'use strict';

angular.module('LuCI2').directive('cbiNetworkList', function(gettext, l2network) {
	return {
		restrict: 'AE',
		scope: { },

		require: ['cbiNetworkList', '^cbiOption', '^cbiSection', '^cbiMap'],
		controllerAs: 'NetworkList',
		controller: function($scope) {
			var self = angular.extend(this, {
				checked: { },
				interfaces: [],
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
					} else {
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
		},

		replace: true,
		templateUrl: 'luci-ng/cbi/cbiNetworkList.tmpl.html',

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
});
