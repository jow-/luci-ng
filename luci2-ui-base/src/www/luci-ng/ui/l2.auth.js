angular.module('LuCI2')
	.factory('l2auth', function(l2rpc, $timeout, $uibModal, $cookies, $rootScope) {
		var _auth = { };
		return angular.extend(_auth, {
			login: l2rpc.declare({
				object: 'session',
				method: 'login',
				params: ['username', 'password'],
				expect: { '': { } }
			}),

			logout: l2rpc.declare({
				object: 'session',
				method: 'destroy'
			}),

			access: l2rpc.declare({
				object: 'session',
				method: 'access',
				params: ['scope', 'object', 'function'],
				expect: { access: false }
			}),

			data: l2rpc.declare({
				object: 'session',
				method: 'get',
				expect: { values: { } }
			}),

			acls: l2rpc.declare({
				object: 'session',
				method: 'access',
				expect: { '': { } }
			}),

			heartbeat: function() {
				return _auth.access('ubus', 'session', 'destroy').then(function(access) {
					if (!access) {
						$cookies.remove('l2-session', { path: '/' });
						l2rpc.token(undefined);
						_auth.prompt();
					} else {
						_auth.timeout = $timeout(_auth.heartbeat, 5000);
					}
				});
			},

			prompt: function() {
				_auth._dialog = $uibModal.open({
					backdrop: 'static',
					templateUrl: 'loginForm',
					controller: function($scope, $uibModalInstance) {
						$scope.login = function($event) {
							if ($event.which !== 1 && $event.which !== 13)
								return;

							if (!$scope.username)
								return;

							_auth.login($scope.username, $scope.password)
								.then(function(session) {
									if (angular.isObject(session.data) &&
										    session.data.username) {
										$scope.error = false;
										$cookies.put('l2-session', session.ubus_rpc_session, { path: '/' });
										l2rpc.token(session.ubus_rpc_session);
										_auth.heartbeat();
										_auth._dialog.close();
										$rootScope.$broadcast('session.setup', session);
									} else {
										$scope.error = true;
									}
								});
						};
					}
				});
			},

			init: function() {
				var sid = $cookies.get('l2-session');

				l2rpc.token(sid);
				l2rpc.batch();

				_auth.data();
				_auth.acls();

				l2rpc.flush().then(function(data) {
					if (angular.isArray(data) &&
						    angular.isObject(data[1]) &&
						    angular.isObject(data[0]) &&
						    angular.isString(data[0].username)) {
						_auth.heartbeat();
						$rootScope.$broadcast('session.setup', {
							data: data[0],
							acls: data[1],
							ubus_rpc_session: sid
						});
					} else {
						l2rpc.token(undefined);
						_auth.prompt();
					}
				});
			},

			destroy: function() {
				_auth._dialog = $uibModal.open({
					backdrop: 'static',
					templateUrl: 'logoutForm',
					controller: function($scope, $uibModalInstance) {
						$scope.cancel = function($event) {
							_auth._dialog.close();
						};

						$scope.logout = function($event) {
							_auth.logout().then(function() {
								$timeout.cancel(_auth.timeout);
								$cookies.remove('l2-session', { path: '/' });
								l2rpc.token(undefined);
								_auth._dialog.close();
								_auth.prompt();
							});
						};
					}
				});
			}
		});
	});
