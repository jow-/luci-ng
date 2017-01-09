angular.module('LuCI2').factory('l2system', function(l2rpc) {
	var _system = { };
	return angular.extend(_system, {
		getSystemInfo: l2rpc.declare({
			object: 'system',
			method: 'info',
			expect: { '': { } }
		}),

		getBoardInfo: l2rpc.declare({
			object: 'system',
			method: 'board',
			expect: { '': { } }
		}),

		getDiskInfo: l2rpc.declare({
			object: 'luci2.system',
			method: 'diskfree',
			expect: { '': { } }
		}),

		getInfo: function(cb)
		{
			l2rpc.batch();

			_system.getSystemInfo();
			_system.getBoardInfo();
			_system.getDiskInfo();

			return l2rpc.flush().then(function(info) {
				var rv = { };

				angular.extend(rv, info[0]);
				angular.extend(rv, info[1]);
				angular.extend(rv, info[2]);

				return rv;
			});
		},


		initList: l2rpc.declare({
			object: 'luci2.system',
			method: 'init_list',
			expect: { initscripts: [ ] },
			filter: function(data) {
				data.sort(function(a, b) { return (a.start || 0) - (b.start || 0) });
				return data;
			}
		}),

		initEnabled: function(init, cb)
		{
			return _system.initList().then(function(list) {
				for (var i = 0; i < list.length; i++)
					if (list[i].name == init)
						return !!list[i].enabled;

				return false;
			});
		},

		initRun: l2rpc.declare({
			object: 'luci2.system',
			method: 'init_action',
			params: [ 'name', 'action' ],
			filter: function(data) {
				return (data == 0);
			}
		}),

		initStart:   function(init, cb) { return _system.initRun(init, 'start',   cb) },
		initStop:    function(init, cb) { return _system.initRun(init, 'stop',    cb) },
		initRestart: function(init, cb) { return _system.initRun(init, 'restart', cb) },
		initReload:  function(init, cb) { return _system.initRun(init, 'reload',  cb) },
		initEnable:  function(init, cb) { return _system.initRun(init, 'enable',  cb) },
		initDisable: function(init, cb) { return _system.initRun(init, 'disable', cb) },


		performReboot: l2rpc.declare({
			object: 'luci2.system',
			method: 'reboot'
		})
	});
});
