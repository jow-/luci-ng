'use strict';

angular.module('LuCI2').directive('cbiFlag', function() {
	return {
		restrict: 'AE',
		scope: true,

		controllerAs: 'Flag',
		controller: function(gettext) {
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
		},

		replace: true,
		templateUrl: 'luci-ng/cbi/cbiFlag.tmpl.html',

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
});
