angular.module('LuCI2')
	.factory('l2menu', function(l2rpc, $stateRegistry) {
		var _menu = { };
		var _states = [];
		var _nodes;

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

			state: function(node) {
				var state = {
					name: node.sref,
					url: '/' + node.url,
					data: { title: node.title }
				};

				if (node.tabs)
					angular.extend( state, {
						component: 'amfNavTabs',
						resolve: {
							tabs: function() {
								return node.tabs;
							}
						}
					});
				else if (node.childs)
					angular.extend( state, {
						abstract: true,
						template: '<div class="ui-view"></div>',
						redirectTo: node.childs[0].sref
					});
				else if (node.view)
					angular.extend( state, {
						templateUrl: '/luci-ng/view/' + node.view + '.html',
						controller: angular.toClassName(node.view, 'Controller'),
						controllerAs: 'View',
						resolve: {
							load: ['l2use', function(l2use) {
								return l2use.load('/luci-ng/controller/' + node.view + '.js');
							}]
						}
					});

				return state;
			},


			populate: function(menu) {
				var tree = { sref: 'menu', url: 'menu' };
				var path, node;

				for (var entry in menu) {
					path = entry.split(/\//);
					node = tree;

					for (var i = 0; i < path.length; i++) {
						if (!node.childs)
							node.childs = { };

						if (!node.childs[path[i]])
							node.childs[path[i]] = {
								sref: 'menu.' + path.slice(0, i+1).join('.'),
								url: path[i]
							};

						node = node.childs[path[i]];
					}

					angular.extend(node, menu[entry]);
					if (!node.title) node.title = node.url;
				}

				_menu.childsArray(tree);
				_nodes = tree;

				return _nodes;
			},

			childsArray: function(node) {
				var childs = [];

				for (var child in (node.childs || {})) {
					_menu.childsArray(node.childs[child]);
					childs.push(node.childs[child]);
				}

				childs.sort(_menu.cmp);

				if (childs.length && !node.tabbed) {
					node.childs = childs;
				} else {
					delete node.childs;
					if (childs.length && node.tabbed) node.tabs = childs;
				}

				var state = _menu.state(node);
				_states.push(state);
			},

			registerStates: function() {
				_states.forEach(function(state) {
					$stateRegistry.register(state);
				});
			},

			update: function() {
				return _menu.load().then(_menu.populate);
			},

			getNodes: function() {
				return _nodes;
			},

			getStates: function() {
				return _states;
			}

		});
	});
