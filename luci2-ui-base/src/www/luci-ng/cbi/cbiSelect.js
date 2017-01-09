'use strict';

angular.module('LuCI2').directive('cbiSelect', function($parse) {
	return {
		restrict: 'AE',
		scope: true,

		controllerAs: 'Select',
		controller: function() {
			var self = angular.extend(this, {
				textValue: function() {
					var o = self.selectElem.options,
					    i = self.selectElem.selectedIndex;

					return o[i].text;
				}
			});
		},

		replace: true,
		templateUrl: 'luci-ng/cbi/cbiSelect.tmpl.html',

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
});

