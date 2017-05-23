/* eslint angular/timeout-service:0 */

angular.module('LuCI2').factory('l2uci', function(l2rpc, $q, $timeout) {
	var _uci = { };
	return angular.extend(_uci, {
		_state: {
			newidx:  0,
			values:  { },
			creates: { },
			changes: { },
			deletes: { },
			reorder: { }
		},

		callLoad: l2rpc.declare({
			object: 'uci',
			method: 'get',
			params: ['config'],
			expect: { values: { } }
		}),

		callOrder: l2rpc.declare({
			object: 'uci',
			method: 'order',
			params: ['config', 'sections']
		}),

		callAdd: l2rpc.declare({
			object: 'uci',
			method: 'add',
			params: ['config', 'type', 'name', 'values'],
			expect: { section: '' }
		}),

		callSet: l2rpc.declare({
			object: 'uci',
			method: 'set',
			params: ['config', 'section', 'values']
		}),

		callDelete: l2rpc.declare({
			object: 'uci',
			method: 'delete',
			params: ['config', 'section', 'options']
		}),

		callCommit: l2rpc.declare({
			object: 'uci',
			method: 'commit',
			params: ['config']
		}),

		callApply: l2rpc.declare({
			object: 'uci',
			method: 'apply',
			params: ['timeout', 'rollback']
		}),

		callConfirm: l2rpc.declare({
			object: 'uci',
			method: 'confirm'
		}),

		createSID: function(conf) {
			var v = _uci._state.values;
			var n = _uci._state.creates;
			var sid;

			do {
				sid = 'new%06x'.format(Math.random() * 0xFFFFFF);
			} while ((n[conf] && n[conf][sid]) || (v[conf] && v[conf][sid]));

			return sid;
		},

		reorderSections: function() {
			var v = _uci._state.values;
			var n = _uci._state.creates;
			var r = _uci._state.reorder;

			if (angular.isEmptyObject(r))
				return $q.resolve();

			l2rpc.batch();

			/*
			 gather all created and existing sections, sort them according
			 to their index value and issue an uci order call
			*/
			for (var c in r) {
				var o = [], s;

				if (n[c])
					for (s in n[c])
						o.push(n[c][s]);

				for (s in v[c])
					o.push(v[c][s]);

				if (o.length > 0) {
					o.sort(function(a, b) {
						return (a['.index'] - b['.index']);
					});

					var sids = [];

					for (var i = 0; i < o.length; i++)
						sids.push(o[i]['.name']);

					_uci.callOrder(c, sids);
				}
			}

			_uci._state.reorder = { };
			return l2rpc.flush();
		},

		load: function(packages) {
			var seen = { };
			var pkgs = [];

			if (!angular.isArray(packages))
				packages = [packages];

			l2rpc.batch();

			for (var i = 0; i < packages.length; i++)
				if (!seen[packages[i]] && !_uci._state.values[packages[i]]) {
					pkgs.push(packages[i]);
					seen[packages[i]] = true;
					_uci.callLoad(packages[i]);
				}

			return l2rpc.flush().then(function(responses) {
				for (var i = 0; i < responses.length; i++)
					_uci._state.values[pkgs[i]] = responses[i];

				return pkgs;
			});
		},

		unload: function(packages) {
			if (!angular.isArray(packages))
				packages = [packages];

			for (var i = 0; i < packages.length; i++) {
				delete _uci._state.values[packages[i]];
				delete _uci._state.creates[packages[i]];
				delete _uci._state.changes[packages[i]];
				delete _uci._state.deletes[packages[i]];
			}
		},

		add: function(conf, type, name) {
			var n = _uci._state.creates;
			var sid = name || _uci.createSID(conf);

			if (!n[conf])
				n[conf] = { };

			n[conf][sid] = {
				'.type':      type,
				'.name':      sid,
				'.create':    name,
				'.anonymous': !name,
				'.index':     1000 + _uci._state.newidx++
			};

			return sid;
		},

		remove: function(conf, sid) {
			var n = _uci._state.creates;
			var c = _uci._state.changes;
			var d = _uci._state.deletes;

			/* requested deletion of a just created section */
			if (n[conf] && n[conf][sid]) {
				delete n[conf][sid];
			}			else			{
				if (c[conf])
					delete c[conf][sid];

				if (!d[conf])
					d[conf] = { };

				d[conf][sid] = true;
			}
		},

		sections: function(conf, type, cb) {
			var sa = [], s;
			var v = _uci._state.values[conf];
			var n = _uci._state.creates[conf];
			var c = _uci._state.changes[conf];
			var d = _uci._state.deletes[conf];

			if (!v)
				return sa;

			for (s in v)
				if (!d || d[s] !== true)
					if (!type || v[s]['.type'] == type)
						sa.push(angular.extend({}, v[s], c ? c[s] : undefined));

			if (n)
				for (s in n)
					if (!type || n[s]['.type'] == type)
						sa.push(n[s]);

			sa.sort(function(a, b) {
				return a['.index'] - b['.index'];
			});

			// for (var i = 0; i < sa.length; i++)
			//	sa[i]['.index'] = i;

			if (typeof(cb) == 'function')
				for (var i = 0; i < sa.length; i++)
					cb.call(this, sa[i], sa[i]['.name']);

			return sa;
		},

		get: function(conf, sid, opt) {
			var v = _uci._state.values;
			var n = _uci._state.creates;
			var c = _uci._state.changes;
			var d = _uci._state.deletes;

			if (typeof(sid) == 'undefined')
				return undefined;

			/* requested option in a just created section */
			if (n[conf] && n[conf][sid]) {
				if (!n[conf])
					return undefined;

				if (typeof(opt) == 'undefined')
					return n[conf][sid];

				return n[conf][sid][opt];
			}

			/* requested an option value */
			if (typeof(opt) != 'undefined') {
				/* check whether option was deleted */
				if (d[conf] && d[conf][sid]) {
					if (d[conf][sid] === true)
						return undefined;

					for (var i = 0; i < d[conf][sid].length; i++)
						if (d[conf][sid][i] == opt)
							return undefined;
				}

				/* check whether option was changed */
				if (c[conf] && c[conf][sid] && typeof(c[conf][sid][opt]) != 'undefined')
					return c[conf][sid][opt];

				/* return base value */
				if (v[conf] && v[conf][sid])
					return v[conf][sid][opt];

				return undefined;
			}

			/* requested an entire section */
			if (v[conf] && (!d[conf] || d[conf][sid] !== true))
				return v[conf][sid];

			return undefined;
		},

		set: function(conf, sid, opt, val) {
			var v = _uci._state.values;
			var n = _uci._state.creates;
			var c = _uci._state.changes;
			var d = _uci._state.deletes;

			if (typeof(sid) == 'undefined' ||
				typeof(opt) == 'undefined' ||
				opt.charAt(0) == '.')
				return;

			if (n[conf] && n[conf][sid]) {
				if (typeof(val) != 'undefined')
					n[conf][sid][opt] = val;
				else
					delete n[conf][sid][opt];
			}			else if (typeof(val) != 'undefined' && val !== '') {
				/* do not set within deleted section */
				if (d[conf] && d[conf][sid] === true)
					return;

				/* only set in existing sections */
				if (!v[conf] || !v[conf][sid])
					return;

				if (!c[conf])
					c[conf] = { };

				if (!c[conf][sid])
					c[conf][sid] = { };

				/* undelete option */
				if (d[conf] && d[conf][sid])
					d[conf][sid] = angular.filterArray(d[conf][sid], opt);

				c[conf][sid][opt] = val;
			}			else			{
				/* only delete in existing sections */
				if (!v[conf] || !v[conf][sid])
					return;

				if (!d[conf])
					d[conf] = { };

				if (!d[conf][sid])
					d[conf][sid] = [];

				if (d[conf][sid] !== true)
					d[conf][sid].push(opt);
			}
		},

		unset: function(conf, sid, opt) {
			return _uci.set(conf, sid, opt, undefined);
		},

		get_first: function(conf, type, opt) {
			var sid = undefined;

			_uci.sections(conf, type, function(s) {
				if (typeof(sid) != 'string')
					sid = s['.name'];
			});

			return _uci.get(conf, sid, opt);
		},

		set_first: function(conf, type, opt, val) {
			var sid = undefined;

			_uci.sections(conf, type, function(s) {
				if (typeof(sid) != 'string')
					sid = s['.name'];
			});

			return _uci.set(conf, sid, opt, val);
		},

		unset_first: function(conf, type, opt) {
			return _uci.set_first(conf, type, opt, undefined);
		},

		swap: function(conf, sid1, sid2) {
			var s1 = _uci.get(conf, sid1);
			var s2 = _uci.get(conf, sid2);
			var n1 = s1 ? s1['.index'] : NaN;
			var n2 = s2 ? s2['.index'] : NaN;

			if (isNaN(n1) || isNaN(n2))
				return false;

			s1['.index'] = n2;
			s2['.index'] = n1;

			_uci._state.reorder[conf] = true;

			return true;
		},

		save: function() {
			l2rpc.batch();

			var n = _uci._state.creates;
			var c = _uci._state.changes;
			var d = _uci._state.deletes;
			var conf, sid;

			var snew = [];
			var pkgs = { };

			if (n)
				for (conf in n) {
					for (sid in n[conf]) {
						var r = {
							config: conf,
							values: { }
						};

						for (var k in n[conf][sid]) {
							if (k == '.type')
								r.type = n[conf][sid][k];
							else if (k == '.create')
								r.name = n[conf][sid][k];
							else if (k.charAt(0) != '.')
								r.values[k] = n[conf][sid][k];
						}

						snew.push(n[conf][sid]);

						_uci.callAdd(r.config, r.type, r.name, r.values);
					}

					pkgs[conf] = true;
				}

			if (c)
				for (conf in c) {
					for (sid in c[conf])
						_uci.callSet(conf, sid, c[conf][sid]);

					pkgs[conf] = true;
				}

			if (d)
				for (conf in d) {
					for (sid in d[conf]) {
						var o = d[conf][sid];
						_uci.callDelete(conf, sid, (o === true) ? undefined : o);
					}

					pkgs[conf] = true;
				}

			return l2rpc.flush().then(function(responses) {
				/*
				 array "snew" holds references to the created uci sections,
				 use it to assign the returned names of the new sections
				*/
				for (var i = 0; i < snew.length; i++)
					snew[i]['.name'] = responses[i];

				return _uci.reorderSections();
			}).then(function() {
				pkgs = angular.toArray(pkgs);

				_uci.unload(pkgs);

				return _uci.load(pkgs);
			});
		},

		apply: function(timeout) {
			var date = new Date();

			if (typeof(timeout) != 'number' || timeout < 1)
				timeout = 10;

			return _uci.callApply(timeout, true).then(function(rv) {
				if (rv != 0) {
					return $q.reject(rv);
				}

				var try_deadline = date.getTime() + 1000 * timeout;
				var try_confirm = function() {
					return _uci.callConfirm().then(function(rv) {
						if (rv != 0) {
							if (date.getTime() < try_deadline)
								$timeout(1000).then(try_confirm);
							else
								return $q.reject(rv);
						}

						return rv;
					});
				};

				return $timeout(1000).then(try_confirm);
			});
		},

		changes: l2rpc.declare({
			object: 'uci',
			method: 'changes',
			expect: { changes: { } }
		}),

		readable: function(conf) {
			// return L2.session.hasACL('uci', conf, 'read');
			return true;
		},

		writable: function(conf) {
			// return L2.session.hasACL('uci', conf, 'write');
			return true;
		}
	});
});
