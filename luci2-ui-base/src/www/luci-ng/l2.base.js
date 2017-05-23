/* eslint angular/module-setter: 0 */

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
	.config(function($controllerProvider, $compileProvider, $filterProvider,
		        $httpProvider, $provide, amfLoginDialogProvider, $urlRouterProvider) {
		angular.extend(L2, {
			registerController: $controllerProvider.register,
			registerDirective: $compileProvider.directive,
			registerFilter: $filterProvider.register,
			registerFactory: $provide.factory,
			registerService: $provide.service
		});

		$httpProvider.interceptors.push('l2httpRetry');

		amfLoginDialogProvider.configure({
			loginFactory: function(l2session) {
				'ngInject';

				return l2session.loginCB;
			},
			retryFilter: function(req, token) {
				if (req.data && angular.isArray(req.data.params) && req.data.params.length)
					req.data.params[0]=token;
			}
		});

		$urlRouterProvider.otherwise('/menu/status/overview');
	})
	.config(function($mdIconProvider) {
		$mdIconProvider.defaultIconSet('luci-ng/icons/svg/iconset.svg');
	})
	.run(function($injector, l2session, gettextCatalog) {
		angular.extend(L2, {
			invoke: $injector.invoke,
			getService: angular.bind($injector, $injector.get)
		});

		gettextCatalog.setCurrentLanguage('de');
				// gettextCatalog.debug = true;

		// dummy rpc call to immidiatly trigger the login interceptor
		l2session.data();
	});
