angular.module('LuCI2')
	.factory('l2menu', function(l2rpc, $route) {
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

			first: function(node) {
				var child;
				if (node.view)
					return node;

				var nodes = [];
				for (child in (node.childs || { }))
					nodes.push(node.childs[child]);

				nodes.sort(_menu.cmp);

				for (var i = 0; i < nodes.length; i++) {
					child = _menu.first(nodes[i]);
					if (child) {
						for (var key in child)
							if (!node.hasOwnProperty(key) && child.hasOwnProperty(key))
								node[key] = child[key];

						return node;
					}
				}

				return undefined;
			},

			route: function(node) {
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

				for (var entry in menu) {
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

			render: function(nodes, childs, level, min, max) {
				for (var node in childs) {
					var child = _menu.first(childs[node]);
					if (child)
						nodes.push(childs[node]);
				}

				nodes.sort(_menu.cmp);

				for (var i = 0; i < nodes.length; i++) {
					if (level === 0 && i === 0) {
						L2.registerDefaultRoute({ redirectTo: '/' + nodes[i].view });

						$route.reload();
					}

					if (nodes[i].childs && level < max)
						nodes[i].childs = _menu.render([], nodes[i].childs, level + 1, min, max);
				}

				return nodes;
			},

			update: function() {
				return _menu.load().then(_menu.populate);
			}
		});
	});
