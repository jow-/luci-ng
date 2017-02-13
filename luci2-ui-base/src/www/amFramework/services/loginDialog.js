/**
 * @ngdoc provider
 * @name amfLoginDialog
 * @module amFramework
 *
 * @description
 * Provides authentication services with http interceptor
 *
 *
 */


angular
	.module('amFramework')
	.provider('amfLoginDialog', LoginDialogProvider)
	.config(loginDialogConfig);

function LoginDialogProvider() {
	// private vars
	var loggedToken = null;
	var options = {
		loginFactory: null,
		retryFilter: null,
		httpErrors: ['401'],
		jsonrpcErrors: [-32002],
		cookie: 'auth-token',
		disabled: false
	};
	var httpBuffer = [];

	// configuration interface
	this.configure = configure;
	this._loginInterceptor = loginInterceptor;

	// service factory
	this.$get = loginDialogFactory;

	// function definitions
	function configure(opts) {
		angular.extend(options, opts);

		if (angular.isObject(options.cookie)) {
			options.cookie.name = options.cookie.name || 'auth-token';
			options.cookie.path = options.cookie.path || '/';
		} else if (angular.isString(options.cookie)) {
			options.cookie = { name: options.cookie, path: '/' };
		} else
			options.cookie = null;
	}

	/* ngInject */
	function loginDialogFactory($injector) {
		if (options.loginFactory && !options.loginCB)
			options.loginCB = $injector.invoke(options.loginFactory);

		return {
			enable: function() {
				options.disabled=false;
			},
			disable: function() {
				options.disabled=true;
			}
		};
	}

	/* @ngInject */
	function loginInterceptor($q, $injector, $cookies, $rootScope, $amfHttpProgress) {
		var $http, $mdDialog;

		return {
			response: interceptResponse,
			responseError: interceptError
		};


		function interceptResponse(response) {
			var config = response.config || {};
			var data = angular.isArray(response.data) ? response.data : [response.data || {}];
			var deferred = $q.defer();

			if (!options.disabled && !config.ignoreAuthModule && options.jsonrpcErrors.length) {
				for (var i=0; i< data.length; i++) {
					if (data[i].error && data[i].jsonrpc === '2.0') {
						if (options.jsonrpcErrors.indexOf(data[i].error.code) >= 0) {
							config.deferred = deferred;
							httpBuffer.push(config);

							if (httpBuffer.length === 1)
								doLogin().then(retryAll, rejectAll);

							return deferred.promise;
						}
					}
				}
			}
			return response;
		}

		function interceptError(rejection) {
			var config = rejection.config || {};
			var deferred = $q.defer();

			if (!options.disabled && !config.ignoreAuthModule && options.httpErrors.length) {
				if (options.httpErrors.indexOf(rejection.status)>=0) {
					config.deferred = deferred;
					httpBuffer.push(config);

					if (httpBuffer.length === 1)
						doLogin().then(retryAll, rejectAll);


					return deferred.promise;
				}
          // otherwise, default behaviour
			}
			return $q.reject(rejection);
		}

		function retryAll() {
			$http = $http || $injector.get('$http');
			for (var i = 0; i < httpBuffer.length; ++i) {
				if (options.retryFilter) options.retryFilter(httpBuffer[i], loggedToken);
				$http(httpBuffer[i]).then(function(res) {
					res.config.deferred.resolve(res);
				}, function(rej) {
					rej.config.deferred.reject(rej);
				});
			}
			httpBuffer = [];
		}

		function rejectAll(reason) {
			for (var i = 0; i < httpBuffer.length; ++i) {
				httpBuffer[i].deferred.reject(reason);
			}
			httpBuffer = [];
		}

		function doLogin() {
			var deferred = $q.defer();

			if (options.loginFactory && !options.loginCB)
				options.loginCB = $injector.invoke(options.loginFactory);

			// if there is no CB assume we are authorized
			if ( typeof(options.loginCB) != 'function')
				deferred.resolve(true);

			// if this is the first time, try with cookie token
			else if (!loggedToken && options.cookie &&
				(loggedToken = $cookies.getObject(options.cookie.name))) {
				options.loginCB(loggedToken)
					.then(function(token) {
						loggedToken = token;

						if (options.cookie) {
							$cookies.putObject(options.cookie.name, token, { path: options.cookie.path });
						}
						$rootScope.$broadcast('session.setup', token);
						deferred.resolve(token);
					}, function(errMsg) {
						if (options.cookie)
							$cookies.remove(options.cookie.name, { path: options.cookie.path });
						deferred.resolve(showLoginDialog());
					});
			} else
				deferred.resolve(showLoginDialog());

			return deferred.promise;
		}

		function showLoginDialog() {
			$mdDialog = $mdDialog || $injector.get('$mdDialog');

			var oldState = $amfHttpProgress.state(false);

			return $mdDialog.show({
				templateUrl: 'amFramework/services/loginDialog.tmpl.html',
				controller: LoginDialogController,
				controllerAs: 'dialog',
				bindToController: true,
				clickOutsideToClose: false,
				escapeToClose: false,
				fullscreen: true
			}).finally(function() {
				$amfHttpProgress.state(oldState);
			});
		}

		/* ngInject */
		function LoginDialogController($mdDialog, $cookies, $rootScope, $scope) {
			var dialog = this;
			$scope.theme = 'default';
			dialog.username = '';
			dialog.password = '';
			dialog.error = null;

			dialog.handleSubmit = handleSubmit;
			dialog.handleCancel = handleCancel;

			function handleSubmit() {
				if (typeof(options.loginCB) == 'function') {
					options.loginCB(dialog.username, dialog.password)
						.then(function(token) {
							loggedToken = token;
							dialog.password = '';
							dialog.username = '';
							$mdDialog.hide(token);
							dialog.error = null;

							if (options.cookie) {
								$cookies.putObject(options.cookie.name, token, { path: options.cookie.path });
							}
							$rootScope.$broadcast('session.setup', token);
						}, function(errMsg) {
							if (options.cookie)
								$cookies.remove(options.cookie.name, { path: options.cookie.path });
							dialog.error = { unauthorized: errMsg || 'Invalid username/password' };
						});
				} else $mdDialog.hide();
				return;
			}

			function handleCancel() {
				return $mdDialog.cancel();
			}
		}
	}
}

/* ngInject */
function loginDialogConfig($httpProvider, amfLoginDialogProvider) {
	// initialization
	$httpProvider.interceptors.push(amfLoginDialogProvider._loginInterceptor);
}


