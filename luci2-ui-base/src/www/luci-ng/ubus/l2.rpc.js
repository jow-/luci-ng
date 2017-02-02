angular.module('LuCI2').factory('l2rpc', function($q, $http) {
	var _rpc = { };
	return angular.extend(_rpc, {
		_id: 1,
		_token: '00000000000000000000000000000000',
		_batch: undefined,
		_customFields: {},

		_date: new Date(),

		getToken: function() {
			return _rpc._token;
		},

		_call: function(msgs, cb) {
			var url = ['/ubus', 't='+_rpc._date.getTime()];
			var reqs = [];

			if (angular.isArray(msgs)) {
				for (var i = 0; i < msgs.length; i++) {
					url.push('o='+msgs[i].params[1], 'm='+msgs[i].params[2]);
					reqs.push(msgs[i].request);
					delete msgs[i].request;
				}
			}			else {
				url.push('o='+msgs.params[1], 'm='+msgs.params[2]);
				reqs = msgs.request;
				delete msgs.request;
			}

			return $http(angular.extend({}, _rpc._customFields, {
				url:         url.join('/'),
				method:      'POST',
				headers:     {
					'Accept':       'application/json',
					'Content-Type': 'application/json'
				},
				data:        msgs,
				timeout:     5000 /* XXX */,
				_rpc_reqs:   reqs
			})).then(cb, cb);
		},

		_list_cb: function(res) {
			var msg = res.data, list;

			/* verify message frame */
			if (!angular.isObject(msg) || msg.jsonrpc !== '2.0' || !msg.id ||
			    !angular.isArray(msg.result))
				list = [];
			else
				list = msg.result;

			return list;
		},

		_call_cb: function(res) {
			var msgs = res.data;
			var data = [];
			var type = Object.prototype.toString;
			var reqs = res.config._rpc_reqs;

			if (!angular.isArray(reqs)) {
				msgs = [msgs];
				reqs = [reqs];
			}			else if (!angular.isArray(msgs)) {
				msgs = [false];
			}

			for (var i = 0; i < msgs.length; i++) {
				/* fetch related request info */
				var req = reqs[i];
				if (typeof(req) != 'object')
					throw new Error('No related request for JSON response');

				/* fetch response attribute and verify returned type */
				var ret = undefined;

				/* verify message frame */
				if (angular.isObject(msgs[i]) && msgs[i].jsonrpc === '2.0')
					if (angular.isArray(msgs[i].result) && msgs[i].result[0] == 0)
						ret = (msgs[i].result.length > 1) ? msgs[i].result[1] : msgs[i].result[0];

				if (req.expect) {
					for (var key in req.expect) {
						if (typeof(ret) != 'undefined' && key != '')
							ret = ret[key];

						if (typeof(ret) == 'undefined' ||
						    type.call(ret) != type.call(req.expect[key]))
							ret = req.expect[key];

						break;
					}
				}

				/* apply filter */
				if (typeof(req.filter) == 'function') {
					req.priv[0] = ret;
					req.priv[1] = req.params;
					ret = req.filter.apply(_rpc, req.priv);
				}

				/* store response data */
				if (typeof(req.index) == 'number')
					data[req.index] = ret;
				else
					data = ret;
			}

			return data;
		},

		list: function() {
			var params = [];
			for (var i = 0; i < arguments.length; i++)
				params[i] = arguments[i];

			var msg = {
				jsonrpc: '2.0',
				id:      _rpc._id++,
				method:  'list',
				params:  (params.length > 0) ? params : undefined
			};

			return _rpc._call(msg, _rpc._list_cb);
		},

		batch: function() {
			if (!angular.isArray(_rpc._batch))
				_rpc._batch = [];
		},

		flush: function() {
			var req = _rpc._batch;
			delete _rpc._batch;

			if (!angular.isArray(req) || !req.length)
				return angular.deferrable([]);

			/* call rpc */
			return _rpc._call(req, _rpc._call_cb);
		},

		declare: function(options) {
			var _rpc = this;

			return function() {
				/* build parameter object */
				var p_off = 0;
				var params = { };
				if (angular.isArray(options.params))
					for (p_off = 0; p_off < options.params.length; p_off++)
						params[options.params[p_off]] = arguments[p_off];

				/* all remaining arguments are private args */
				var priv = [undefined, undefined];
				for (; p_off < arguments.length; p_off++)
					priv.push(arguments[p_off]);

				/* build message object */
				var msg = {
					jsonrpc: '2.0',
					id:      _rpc._id++,
					request: {
						expect: options.expect,
						filter: options.filter,
						params: params,
						priv:   priv
					},
					method:  'call',
					params:  [
						_rpc._token,
						options.object,
						options.method,
						params
					]
				};

				/* when a batch is in progress then store index in request data
				 * and push message object onto the stack */
				if (angular.isArray(_rpc._batch)) {
					msg.request.index = _rpc._batch.push(msg) - 1;
					return angular.deferrable(msg);
				}

				/* call rpc */
				return _rpc._call(msg, _rpc._call_cb);
			};
		},

		token: function(token) {
			if (/^[0-9a-fA-F]{32}$/.test(token))
				_rpc._token = token;
			else
				_rpc._token = '00000000000000000000000000000000';
		},

		customField: function(fields) {
			if (angular.isObject(fields)) _rpc._customFields = fields;
			else _rpc._customFields = {};
		}
	});
});
