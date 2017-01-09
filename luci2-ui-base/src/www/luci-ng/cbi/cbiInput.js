'use strict';

angular.module('LuCI2').directive('cbiInput', function() {
	return {
		restrict: 'AE',
		replace: true,
		templateUrl: 'luci-ng/cbi/cbiInput.tmpl.html'
	};
});

