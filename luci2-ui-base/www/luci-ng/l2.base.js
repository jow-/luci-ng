(function() {
	"use strict";

	if (!angular.element.fn || !angular.element.fn.jquery)
	{
		var element = angular.element;

		angular.element = function(select)
		{
			if (!(this instanceof angular.element))
				return new angular.element(select);

			if (typeof(select) === 'string' && ! /^</.test(select.trim()))
				select = document.querySelectorAll(select);

			return angular.extend(this, element(select));
		};

		angular.element.prototype = element.prototype;
		angular.element.prototype.constructor = element;

		angular.element.prototype.find = function(select)
		{
			if (this.length)
				return angular.element(this[0].querySelectorAll(select));

			return this;
		};
	}

	if (!(angular.element.findParent && angular.element.findPrev &&
	      angular.element.findNext && angular.element.findChildren))
	{
		var docElem = document.documentElement,
		    nativeMatchFn = docElem.matches ||
				docElem.matchesSelector ||
				docElem.mozMatchesSelector ||
				docElem.webkitMatchesSelector ||
				docElem.msMatchesSelector;

		var matchFn = function(node, sel)
		{
			if (nativeMatchFn)
				return (node.nodeType === 1 && nativeMatchFn.call(node, sel));

			if (!node.parentNode)
				return false;

			var nodeList = node.parentNode.querySelectorAll(sel);

			for (var i = 0; i < nodeList.length; i++)
				if (nodeList[i] === node)
					return true;

			return false;
		};

		var traverseFn = function(node, sel, prop)
		{
			while (node && (node = node[prop]))
				if (matchFn(node, sel))
					return node;

			return null;
		};

		angular.element.prototype.findParent = function(select)
		{
			return this.length
				? angular.element(traverseFn(this[0], select, 'parentNode'))
				: this
			;
		};

		angular.element.prototype.findPrev = function(select)
		{
			return this.length
				? angular.element(traverseFn(this[0], select, 'previousSibling'))
				: this
			;
		};

		angular.element.prototype.findNext = function(select)
		{
			return this.length
				? angular.element(traverseFn(this[0], select, 'nextSibling'))
				: this
			;
		};

		angular.element.prototype.findChildren = function(select)
		{
			if (!this.length)
				return this;

			var childNodes = this[0].childNodes,
			    childLength = childNodes.length,
				childList = angular.element();

			for (var i = 0; i < childLength; i++)
				if (matchFn(childNodes[i], select))
					childList[childList.length++] = childNodes[i];

			return childList;
		};
	}

	if (!String.prototype.format)
	{
		String.prototype.format = function()
		{
			var html_esc = [/&/g, '&#38;', /"/g, '&#34;', /'/g, '&#39;', /</g, '&#60;', />/g, '&#62;'];
			var quot_esc = [/"/g, '&#34;', /'/g, '&#39;'];

			function esc(s, r) {
				for( var i = 0; i < r.length; i += 2 )
					s = s.replace(r[i], r[i+1]);
				return s;
			}

			var str = this;
			var out = '';
			var re = /^(([^%]*)%('.|0|\x20)?(-)?(\d+)?(\.\d+)?(%|b|c|d|u|f|o|s|x|X|q|h|j|t|m))/;
			var a = [], numSubstitutions = 0, numMatches = 0;

			while ((a = re.exec(str)) != null)
			{
				var m = a[1];
				var leftpart = a[2], pPad = a[3], pJustify = a[4], pMinLength = a[5];
				var pPrecision = a[6], pType = a[7];

				numMatches++;

				if (pType == '%')
				{
					subst = '%';
				}
				else
				{
					if (numSubstitutions < arguments.length)
					{
						var param = arguments[numSubstitutions++];

						var pad = '';
						if (pPad && pPad.substr(0,1) == "'")
							pad = leftpart.substr(1,1);
						else if (pPad)
							pad = pPad;

						var justifyRight = true;
						if (pJustify && pJustify === "-")
							justifyRight = false;

						var minLength = -1;
						if (pMinLength)
							minLength = parseInt(pMinLength);

						var precision = -1;
						if (pPrecision && pType == 'f')
							precision = parseInt(pPrecision.substring(1));

						var subst = param;

						switch(pType)
						{
							case 'b':
								subst = (parseInt(param) || 0).toString(2);
								break;

							case 'c':
								subst = String.fromCharCode(parseInt(param) || 0);
								break;

							case 'd':
								subst = (parseInt(param) || 0);
								break;

							case 'u':
								subst = Math.abs(parseInt(param) || 0);
								break;

							case 'f':
								subst = (precision > -1)
									? ((parseFloat(param) || 0.0)).toFixed(precision)
									: (parseFloat(param) || 0.0);
								break;

							case 'o':
								subst = (parseInt(param) || 0).toString(8);
								break;

							case 's':
								subst = param;
								break;

							case 'x':
								subst = ('' + (parseInt(param) || 0).toString(16)).toLowerCase();
								break;

							case 'X':
								subst = ('' + (parseInt(param) || 0).toString(16)).toUpperCase();
								break;

							case 'h':
								subst = esc(param, html_esc);
								break;

							case 'q':
								subst = esc(param, quot_esc);
								break;

							case 'j':
								subst = String.serialize(param);
								break;

							case 't':
								var td = 0;
								var th = 0;
								var tm = 0;
								var ts = (param || 0);

								if (ts > 60) {
									tm = Math.floor(ts / 60);
									ts = (ts % 60);
								}

								if (tm > 60) {
									th = Math.floor(tm / 60);
									tm = (tm % 60);
								}

								if (th > 24) {
									td = Math.floor(th / 24);
									th = (th % 24);
								}

								subst = (td > 0)
									? '%dd %dh %dm %ds'.format(td, th, tm, ts)
									: '%dh %dm %ds'.format(th, tm, ts);

								break;

							case 'm':
								var mf = pMinLength ? parseInt(pMinLength) : 1000;
								var pr = pPrecision ? Math.floor(10*parseFloat('0'+pPrecision)) : 2;

								var i = 0;
								var val = parseFloat(param || 0);
								var units = [ '', 'K', 'M', 'G', 'T', 'P', 'E' ];

								for (i = 0; (i < units.length) && (val > mf); i++)
									val /= mf;

								subst = val.toFixed(pr) + ' ' + units[i];
								break;
						}

						subst = (typeof(subst) == 'undefined') ? '' : subst.toString();

						if (minLength > 0 && pad.length > 0)
							for (var i = 0; i < (minLength - subst.length); i++)
								subst = justifyRight ? (pad + subst) : (subst + pad);
					}
				}

				out += leftpart + subst;
				str = str.substr(m.length);
			}

			return out + str;
		}
	}

	window.L2 = angular.module('LuCI2', [
		'gettext',
		'ngRoute',
		'ngAnimate',
		'ui.bootstrap'
	]);

	angular.extend(L2, {
		registerController: L2.controller,
		registerDirective: L2.directive,
		registerFilter: L2.filter,
		registerFactory: L2.factory,
		registerService: L2.service
	});

	window.L2
		.filter('format', function() {
			return function(input, template, ifnull) {
				if (input === null || input === undefined) {
					if (ifnull !== null && ifnull !== undefined)
						return ifnull;

					return '';
				}

				if (angular.isString(template))
					return template.format(input);

				return input;
			};
		})
		.factory('l2httpRetry',['$q', '$timeout', '$injector', function($q, $timeout, $injector) {
			return {
				'responseError': function(response) {
					var $http = $injector.get('$http');
					var retry = response.config._retry || 0;

					if (response.status === 0 && retry++ < 3) {
						response.config._retry = retry;
						return $timeout(function() {
							console.debug('http retry: ' + retry + '/3');
							return $http(response.config);
						}, 5000);
					}

					return $q.reject(response);
				}
			};
		}])
		.factory('l2class', [function() {
			var _class = function() { };
			return angular.extend(_class, {
				extend: function(properties)
				{
					var prototype;

					_class.__init__ = true;
					prototype = new _class();
					delete _class.__init__;

					angular.extend(prototype, properties, {
						__super__: this.prototype,
						callSuper: function() {
							var args = [ ];
							var func = arguments[0];
							var ctx = ($scope.__scope__ || this).__super__;
							var ret;

							if (typeof(ctx) != 'object' || typeof(ctx[func]) != 'function')
								return undefined;

							for (var i = 1; i < arguments.length; i++)
								args.push(arguments[i]);

							_class.__scope__ = ctx;
							ret = ctx[func].apply(this, args);
							delete _class.__scope__;

							return ret;
						}
					});

					function Subclass()
					{
						this.options = arguments[0] || { };

						if (!_class.__init__ && typeof(this.init) == 'function')
							this.init.apply(this, arguments);
					}

					Subclass.prototype = prototype;
					Subclass.prototype.constructor = Subclass;
					Subclass.extend = _class.extend;

					return Subclass;
				}
			});
		}])
		.factory('$cookie', [function() {
			var _cookie = { };
			return angular.extend(_cookie, {
				get: function (name) {
					if (!name)
						return null;

					return decodeURIComponent(document.cookie.replace(
						new RegExp(
							"(?:(?:^|.*;)\\s*" +
							encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") +
							"\\s*\\=\\s*([^;]*).*$)|^.*$"
						), "$1"
					)) || null;
				},

				set: function (name, value, expiry, path, domain, secure) {
					if (!name || /^(?:expires|max\-age|path|domain|secure)$/i.test(name))
						return false;

					var expires = '';
					if (expiry) {
						switch (expiry.constructor) {
							case Number:
								expires = expiry === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + expiry;
								break;

							case String:
								expires = '; expires=' + expiry;
								break;

							case Date:
								expires = '; expires=' + expiry.toUTCString();
								break;
						}
					}

					document.cookie =
						encodeURIComponent(name)  + '='      +
						encodeURIComponent(value) + expires  +
						(domain ? '; domain=' + domain : '') +
						(path   ? '; path='   + path   : '') +
						(secure ? '; secure'           : '')
					;

					return true;
				},

				unset: function (name, path, domain) {
					if (!this.exists(name))
						return false;

					document.cookie =
						encodeURIComponent(name) +
						'=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
						(domain ? '; domain=' + domain : '') +
						(path   ? '; path='   + path   : '')
					;

					return true;
				},

				exists: function (name) {
					if (!name)
						return false;

					return (new RegExp(
						"(?:^|;\\s*)" +
						encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") +
						"\\s*\\="
					)).test(document.cookie);
				},

				keys: function () {
					var keys = document.cookie.replace(
						/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g,
						''
					).split(/\s*(?:\=[^;]*)?;\s*/);

					for (var len = keys.length, i = 0; i < len; i++)
						keys[i] = decodeURIComponent(keys[i]);

					return keys;
				}
			});
		}])
		.factory('l2auth', ['l2rpc', '$timeout', '$modal', '$cookie', '$rootScope', function(l2rpc, $timeout, $modal, $cookie, $rootScope) {
			var _auth = { };
			return angular.extend(_auth, {
				login: l2rpc.declare({
					object: 'session',
					method: 'login',
					params: [ 'username', 'password' ],
					expect: { '': { } }
				}),

				logout: l2rpc.declare({
					object: 'session',
					method: 'destroy'
				}),

				access: l2rpc.declare({
					object: 'session',
					method: 'access',
					params: [ 'scope', 'object', 'function' ],
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
							$cookie.unset('l2-session', '/');
							l2rpc.token(undefined);
							_auth.prompt();
						} else {
							_auth.timeout = $timeout(_auth.heartbeat, 5000);
						}
					});
				},

				prompt: function() {
					_auth._dialog = $modal.open({
						backdrop: 'static',
						templateUrl: 'loginForm',
						controller: function($scope, $modalInstance) {
							$scope.login = function($event) {
								if ($event.which !== 1 && $event.which !== 13)
									return;

								if (!$scope.username)
									return;

								_auth.login($scope.username, $scope.password).then(function(session) {
									if (angular.isObject(session.data) && session.data.username) {
										$scope.error = false;
										$cookie.set('l2-session', session.ubus_rpc_session, Infinity, '/')
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
					var sid = $cookie.get('l2-session');

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
						}
						else {
							l2rpc.token(undefined);
							_auth.prompt();
						}
					});
				},

				destroy: function() {
					_auth._dialog = $modal.open({
						backdrop: 'static',
						templateUrl: 'logoutForm',
						controller: function($scope, $modalInstance) {
							$scope.cancel = function($event) {
								_auth._dialog.close();
							};

							$scope.logout = function($event) {
								_auth.logout().then(function() {
									$timeout.cancel(_auth.timeout);
									$cookie.unset('l2-session', '/');
									l2rpc.token(undefined);
									_auth._dialog.close();
									_auth.prompt();
								});
							};
						}
					});
				}
			});
		}])
		.factory('l2menu', ['l2rpc', '$route', function(l2rpc, $route) {
			var _menu = { };
			return angular.extend(_menu, {
				load: l2rpc.declare({
					object: 'luci2.ui',
					method: 'menu',
					expect: { menu: { } }
				}),

				cmp: function(a, b) {
					var x = a.index || 0;
					var y = b.index || 0;
					return (x - y);
				},

				first: function(node)
				{
					if (node.view)
						return node;

					var nodes = [ ];
					for (var child in (node.childs || { }))
						nodes.push(node.childs[child]);

					nodes.sort(_menu.cmp);

					for (var i = 0; i < nodes.length; i++)
					{
						var child = _menu.first(nodes[i]);
						if (child)
						{
							for (var key in child)
								if (!node.hasOwnProperty(key) && child.hasOwnProperty(key))
									node[key] = child[key];

							return node;
						}
					}

					return undefined;
				},

				route: function(node)
				{
					var v = node.view,
						c = angular.toClassName(v, 'Controller'),
						t = '/luci-ng/view/' + v + '.html',
						m = '/luci-ng/controller/' + v + '.js';

					return {
						templateUrl: t,
						controller:  c,
						controllerAs: 'View',
						secure:      false,
						resolve:     {
							load: ['l2use', function(l2use) {
								return l2use.load(m);
							}]
						}
					};
				},

				populate: function(menu) {
					var tree = { };

					for (var entry in menu)
					{
						var path = entry.split(/\//);
						var node = tree;

						for (var i = 0; i < path.length; i++) {
							if (!node.childs)
								node.childs = { };

							if (!node.childs[path[i]])
								node.childs[path[i]] = { };

							node = node.childs[path[i]];
						}

						angular.extend(node, menu[entry]);

						if (angular.isString(node.view))
							L2.registerRoute('/' + node.view, _menu.route(node));
					}

					return _menu.render([], tree.childs, 0, 0, 9999);
				},

				render: function(nodes, childs, level, min, max)
				{
					for (var node in childs) {
						var child = _menu.first(childs[node]);
						if (child)
							nodes.push(childs[node]);
					}

					nodes.sort(_menu.cmp);

					for (var i = 0; i < nodes.length; i++) {
						if (level === 0 && i === 0) {
							L2.registerDefaultRoute({
								redirectTo: '/' + nodes[i].view
							});

							$route.reload();
						}

						if (nodes[i].childs && level < max)
							nodes[i].childs = _menu.render([], nodes[i].childs, level + 1, min, max);
					}

					return nodes;
				},

				update: function()
				{
					return _menu.load().then(_menu.populate);
				}
			});
		}])
		.factory('l2spin', ['$modal', 'gettext', function($modal, gettext) {
			var template = '<div class="modal-content l2-modal-loader">' +
				'<div class="modal-body">' +
					gettext('Loading data…') +
				'</div>' +
			'</div>';

			var _loading = { };
			return angular.extend(_loading, {
				open: function() {
					if (_loading.$modal)
						return;

					_loading.$modal = $modal.open({
						backdrop: 'static',
						template: template,
						windowClass: 'no-animation-modal'
					});
				},

				close: function() {
					if (!_loading.$modal)
						return;

					_loading.$modal.close();
					delete _loading.$modal;
				}
			});
		}])
		.controller('HeaderController',
			['l2spin', 'l2menu', 'l2auth', '$scope', function(l2spin, l2menu, l2auth, $scope) {
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
			}])
		.config(['$routeProvider', '$controllerProvider', '$compileProvider', '$filterProvider', '$modalProvider', '$httpProvider', '$provide',
			function($routeProvider, $controllerProvider, $compileProvider, $filterProvider, $modalProvider, $httpProvider, $provide) {
				angular.extend(angular, {
					isEmptyObject: function(x)
					{
						if (!angular.isObject(x))
							return false;

						for (var k in x)
							if (x.hasOwnProperty(k))
								return false;

						return true;
					},

					inArray: function(v, a) {
						if (!angular.isArray(a))
							return false;

						for (var i = 0; i < a.length; i++)
							if (a[i] === v)
								return true;

						return false;
					},

					toArray: function(x) {
						switch (typeof(x))
						{
						case 'number':
						case 'boolean':
							return [ x ];

						case 'string':
							var r = [ ];
							var l = x.split(/\s+/);
							for (var i = 0; i < l.length; i++)
								if (l[i].length > 0)
									r.push(l[i]);
							return r;

						case 'object':
							if (angular.isArray(x))
							{
								var r = [ ];
								for (var i = 0; i < x.length; i++)
									r.push(x[i]);
								return r;
							}
							else if (angular.isObject(x))
							{
								var r = [ ];
								for (var k in x)
									if (x.hasOwnProperty(k))
										r.push(k);
								return r.sort();
							}
						}

						return [ ];
					},

					toObject: function(x) {
						switch (typeof(x))
						{
						case 'number':
						case 'boolean':
							var r = { };
							r[x] = true;
							return r;

						case 'string':
							var r = { };
							var l = x.split(/\x+/);
							for (var i = 0; i < l.length; i++)
								if (l[i].length > 0)
									r[l[i]] = true;
							return r;

						case 'object':
							if (angular.isArray(x))
							{
								var r = { };
								for (var i = 0; i < x.length; i++)
									r[x[i]] = true;
								return r;
							}
							else if (angular.isObject(x))
							{
								return x;
							}
						}

						return { };
					},

					filterArray: function(array, item) {
						if (!angular.isArray(array))
							return [ ];

						for (var i = 0; i < array.length; i++)
							if (array[i] === item)
								array.splice(i--, 1);

						return array;
					},

					toClassName: function(str, suffix) {
						var n = str.replace(/(?:^|\/)(.)/g, function(m0, m1) {
							return m1.toUpperCase()
						});

						if (typeof(suffix) == 'string')
							n += suffix;

						return n;
					},

					toColor: function(str) {
						if (typeof(str) != 'string' || str.length == 0)
							return '#CCCCCC';

						if (str == 'wan')
							return '#F09090';
						else if (str == 'lan')
							return '#90F090';

						var i = 0, hash = 0;

						while (i < str.length)
							hash = str.charCodeAt(i++) + ((hash << 5) - hash);

						var r = (hash & 0xFF) % 128;
						var g = ((hash >> 8) & 0xFF) % 128;

						var min = 0;
						var max = 128;

						if ((r + g) < 128)
							min = 128 - r - g;
						else
							max = 255 - r - g;

						var b = min + (((hash >> 16) & 0xFF) % (max - min));

						return '#%02X%02X%02X'.format(0xFF - r, 0xFF - g, 0xFF - b);
					}
				});

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
			}])
		.run(['$q', '$injector', 'l2auth', 'gettextCatalog',
			function($q, $injector, l2auth, gettextCatalog) {
				angular.deferrable = function(x) {
					var deferred = $q.defer(); deferred.resolve(x);
					return deferred.promise;
				};

				angular.extend(L2, {
					invoke: $injector.invoke,
					getService: angular.bind($injector, $injector.get)
				});

				gettextCatalog.setCurrentLanguage('de');
				//gettextCatalog.debug = true;

				l2auth.init();
			}])
		;
})();
