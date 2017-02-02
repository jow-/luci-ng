/* eslint angular/module-setter: 0 */
/* eslint angular/controller-as: 0 */

(function() {
'use strict';


window.L2 = angular.module('LuCI2', [
	'gettext',
	'ui.router',
	'ngAnimate',
	'ui.bootstrap',
	'ngCookies',
	'ngMaterial',
	'amFramework'
]);

angular.module('LuCI2')
	.controller('HeaderController', function(l2menu, l2session, $scope) {
		$scope.logout = l2session.destroy;

		$scope.$on('session.setup', function(event, session) {
			l2menu.update().then(function(menu) {
				$scope.menu = menu;
			});
		});
	})
	.config(function($routeProvider, $controllerProvider, $compileProvider, $filterProvider,
		        $uibModalProvider, $httpProvider, $provide, amfLoginDialogProvider) {
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

		amfLoginDialogProvider.configure({
			loginFactory: function(l2session) {
				return l2session.loginCB;
			},
			retryFilter: function(req, token) {
				if (req.data && angular.isArray(req.data.params) && req.data.params.length)
					req.data.params[0]=token;
			}
		});
	})
	.run(function($q, $injector, l2session, gettextCatalog) {
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

		// dummy rpc call to immidiatly trigger the login interceptor
		l2session.data();
	})
		;
})();
