angular.module('LuCI2')
	.factory('l2httpRetry', function($q, $timeout, $injector) {
		return {
			'responseError': function(response) {
				var $http = $injector.get('$http');
				var retry = response.config._retry || 0;

				if (response.status <= 0 && retry++ < 3) {
					response.config._retry = retry;
					return $timeout(function() {
						return $http(response.config);
					}, 2500);
				}

				return $q.reject(response);
			}
		};
	});
