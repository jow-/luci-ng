L2.registerController('SystemStartupController', function($modal, l2rpc, l2spin) {
	var startupCtrl = this;

	angular.extend(startupCtrl, {
		initList: [],

		getRcLocal: l2rpc.declare({
			object: 'luci2.system',
			method: 'rclocal_get',
			expect: { data: '' }
		}),

		setRcLocal: l2rpc.declare({
			object: 'luci2.system',
			method: 'rclocal_set',
			params: ['data']
		}),

		getInitList: l2rpc.declare({
			object: 'luci2.system',
			method: 'init_list',
			expect: { initscripts: [] },
			filter: function(data) {
				data.sort(function(a, b) {
					return (a.start || 0) - (b.start || 0);
				});
				return data;
			}
		}),

		setInitAction: l2rpc.declare({
			object: 'luci2.system',
			method: 'init_action',
			params: ['name', 'action'],
			filter: function(data) {
				return (data == 0);
			}
		}),

		callInitAction: function(name, action) {
			l2spin.open();
			startupCtrl.setInitAction(name, action)
				.then(startupCtrl.updateInitList);
		},

		updateInitList: function() {
			l2spin.open();

			startupCtrl.getInitList().then(function(init) {
				startupCtrl.initList.length = 0;

				for (var i = 0; i < init.length; i++)
					startupCtrl.initList.push(init[i]);

				startupCtrl.initList.sort(function(a, b) {
					var x = (a.start >= 0) ? a.start : a.stop;
					var y = (b.start >= 0) ? b.start : b.stop;
					return (x - y);
				});

				l2spin.close();
			});
		},

		changeRcLocal: function() {
			l2spin.open();
			startupCtrl.setRcLocal(startupCtrl.rclocal).then(function(rv) {
				startupCtrl.isRcLocalChanged = (rv === 0);
				l2spin.close();
			});
		}
	});

	l2spin.open();
	startupCtrl.getRcLocal().then(function(code) {
		startupCtrl.rclocal = code;
		startupCtrl.updateInitList();
	});
});
