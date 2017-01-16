/* eslint angular/module-setter: 0 */
/* eslint angular/controller-as: 0 */

(function() {
'use strict';


window.L2 = angular.module('LuCI2', [
	'gettext',
	'ngRoute',
	'ngAnimate',
	'ui.bootstrap',
	'ngCookies'
]);

angular.module('LuCI2')
	.controller('HeaderController', function(l2spin, l2menu, l2auth, $scope) {
		$scope.logout = l2auth.destroy;

		$scope.$on('session.setup', function(event, session) {
			l2spin.open();
			$scope.user = session.data ? session.data.username : undefined;
			$scope.token = session.ubus_rpc_session;
			l2menu.update().then(function(menu) {
				$scope.menu = menu;
				l2spin.close();
			});
		});
	})
	.config(function($routeProvider, $controllerProvider, $compileProvider, $filterProvider,
		        $uibModalProvider, $httpProvider, $provide) {
		angular.extend(L2, {
			registerRoute: angular.bind($routeProvider, $routeProvider.when),
			registerDefaultRoute: angular.bind($routeProvider, $routeProvider.otherwise),
			registerController: $controllerProvider.register,
			registerDirective: $compileProvider.directive,
			registerFilter: $filterProvider.register,
			registerFactory: $provide.factory,
			registerService: $provide.service
		});

		$httpProvider.interceptors.push('l2httpRetry');
	})
	.run(function($q, $injector, l2auth, gettextCatalog) {
		angular.deferrable = function(x) {
			var deferred = $q.defer(); deferred.resolve(x);
			return deferred.promise;
		};

		angular.extend(L2, {
			invoke: $injector.invoke,
			getService: angular.bind($injector, $injector.get)
		});

		gettextCatalog.setCurrentLanguage('de');
				// gettextCatalog.debug = true;

		l2auth.init();
	})
		;
})();
