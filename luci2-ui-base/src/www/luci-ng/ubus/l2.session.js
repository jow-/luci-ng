angular.module('LuCI2')
	.factory('l2session', function(l2rpc, $q) {
		var _session = { };
		var _username = null;

		return angular.extend(_session, {
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

			getUser: function() {
				return _username;
			},

			loginCB: function(user, password) {
				var promise;
				var ubus_rpc_session=null;

				// if called with just one argument, it is a cookie token

				if (typeof(password) == 'undefined') {
					// try to use its session
					ubus_rpc_session=user;
					l2rpc.token(ubus_rpc_session);
					l2rpc.customField({ ignoreAuthModule: true });
					promise = _session.data().then(loginOK);
					l2rpc.customField(null);
				} else {
					l2rpc.customField({ ignoreAuthModule: true });
					l2rpc.token(null);
					promise = _session.login(user, password).then(loginOK, function(err) {
						_username = null;
						// http error
						return $q.reject('Http error');
					});
					l2rpc.customField(null);
				}

				return promise;

				function loginOK(session) {
					if (angular.isObject(session.data) && session.ubus_rpc_session) {
						// successful login
						_username = session.data.username;
						l2rpc.token(session.ubus_rpc_session);
						return session.ubus_rpc_session;
					} else if (ubus_rpc_session && angular.isObject(session) && session.username) {
						// valid session cookie
						_username = session.username;
						return ubus_rpc_session;
					} else {
						// rejected login
						_username = null;
						return $q.reject('Wrong username/password');
					}
				}
			}

		});
	});
