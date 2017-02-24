L2.registerController('SystemSoftwareController', function($q, $uibModal, l2rpc, l2spin) {
	var softwareCtrl = this;

	angular.extend(softwareCtrl, {
		isLoading: true,

		pkgList: [],
		pkgTotal: 0,
		pkgOffset: 0,
		pkgPattern: '*',

		pkgInstalled: { },
		pkgInstOffset: 0,
		pkgInstCount: 0,
		pkgInstPromise: undefined,

		getDiskFree: l2rpc.declare({
			object: 'luci2.system',
			method: 'diskfree',
			expect: { root: { } }
		}),

		updateDiskFree: function() {
			return softwareCtrl.getDiskFree().then(function(free) {
				free.free = 21 * 1024;
				softwareCtrl.diskFree = free;
			});
		},

		getOpkgInfo: l2rpc.declare({
			object: 'luci2.opkg',
			method: 'info',
			params: ['package']
		}),

		getOpkgInstalled: l2rpc.declare({
			object: 'luci2.opkg',
			method: 'list_installed',
			params: ['limit', 'offset']
		}),

		parseOpkgInstalled: function(list) {
			if (!angular.isObject(list) ||
			    !angular.isArray(list.packages) ||
			    !angular.isNumber(list.total)) {
				softwareCtrl.pkgInstPromise.reject();
				return;
			}

			softwareCtrl.pkgInstOffset += list.packages.length;

			for (var i = 0; i < list.packages.length; i++) {
				var pkg = list.packages[i];
				softwareCtrl.pkgInstCount++;
				softwareCtrl.pkgInstalled[pkg[0]] = pkg[1];
			}

			if (softwareCtrl.pkgInstCount < list.total)
				softwareCtrl.getOpkgInstalled(100, softwareCtrl.pkgInstOffset)
					.then(softwareCtrl.parseOpkgInstalled);
			else
				softwareCtrl.pkgInstPromise.resolve();
		},

		getInstalled: function() {
			softwareCtrl.pkgInstPromise = $q.defer();
			softwareCtrl.pkgInstOffset = 0;
			softwareCtrl.pkgInstCount = 0;
			softwareCtrl.pkgInstalled = { };

			softwareCtrl.getOpkgInstalled(100, 0)
				.then(softwareCtrl.parseOpkgInstalled);

			return softwareCtrl.pkgInstPromise.promise;
		},

		getOpkgList: l2rpc.declare({
			object: 'luci2.opkg',
			method: 'list',
			params: ['limit', 'offset', 'pattern']
		}),

		parseOpkgList: function(list) {
			if (!angular.isObject(list) ||
			    !angular.isArray(list.packages) ||
			    !angular.isNumber(list.total)) {
				softwareCtrl.pkgTotal = 0;
				softwareCtrl.pkgList.length = 0;
				return;
			}

			softwareCtrl.pkgTotal = list.total;
			softwareCtrl.pkgList.length = 0;

			for (var i = 0; i < list.packages.length; i++)
				softwareCtrl.pkgList.push(list.packages[i]);

			softwareCtrl.isPrevAvail = (softwareCtrl.pkgOffset > 0);
			softwareCtrl.isNextAvail = (softwareCtrl.pkgOffset + list.packages.length <
			                           softwareCtrl.pkgTotal);
		},

		getNextList: function() {
			if (softwareCtrl.pkgOffset < softwareCtrl.pkgTotal || softwareCtrl.pkgTotal === 0) {
				l2spin.open();
				softwareCtrl.getOpkgList(100, softwareCtrl.pkgOffset, softwareCtrl.pkgPattern)
					.then(function(list) {
						softwareCtrl.parseOpkgList(list);
						softwareCtrl.pkgOffset += 100;
						softwareCtrl.isLoading = false;
						l2spin.close();
					});
			}
		},

		getPrevList: function() {
			if (softwareCtrl.pkgOffset > 0) {
				l2spin.open();
				softwareCtrl.getOpkgList(100, softwareCtrl.pkgOffset, softwareCtrl.pkgPattern)
					.then(function(list) {
						softwareCtrl.parseOpkgList(list);
						softwareCtrl.pkgOffset -= 100;
						softwareCtrl.isLoading = false;
						l2spin.close();
					});
			}
		},

		getSearchPattern: function()		{
			if (!softwareCtrl.pkgSearch)
				return '*';
			else if (softwareCtrl.pkgSearch.indexOf('*') > -1)
				return softwareCtrl.pkgSearch;
			else if (softwareCtrl.pkgSearch.match(/^"(.+)"$/))
				return RegExp.$1;
			else
				return '*' + softwareCtrl.pkgSearch + '*';
		},

		applySearch: function() {
			var pat = softwareCtrl.getSearchPattern();

			if (pat !== softwareCtrl.pkgPattern) {
				softwareCtrl.pkgOffset = 0;
				softwareCtrl.pkgPattern = pat;
				softwareCtrl.isLoading = true;
				softwareCtrl.getNextList();
			}
		},

		displayInfoCtrl: function($scope, $uibModalInstance, initialPkgName) {
			var dialog = angular.extend(this, {
				softwareCtrl: softwareCtrl,

				loadInfo: function(pkg) {
					dialog.pkgInfo = { package: pkg };
					softwareCtrl.getOpkgInfo(pkg).then(dialog.setInfo);
				},

				setInfo: function(info) {
					if (angular.isObject(info) && angular.isString(info.package)) {
						dialog.pkgInfo = info;
						dialog.findDependencies(true);
					}					else {
						dialog.dismiss();
					}
				},

				findDependencies: function(pkgInfo) {
					if (pkgInfo === true) {
						dialog.depCache = {
							size: 0,
							info: { },
							queue: [],
							needed: [],
							isLoading: true
						};

						var curPkgName = dialog.pkgInfo.package;

						$scope.pkgInfo = dialog.depCache.info[curPkgName] = {
							childs: [],
							state: softwareCtrl.pkgInstalled[curPkgName] ? 'installed' : 'unknown'
						};

						dialog.findDependencies(dialog.pkgInfo);
						return;
					}

					if (!angular.isObject(pkgInfo) ||
						!angular.isString(pkgInfo.package)) {
						pkgInfo = {
							package: dialog.depCache.queue[0],
							md5sum: Math.random(),
							state: softwareCtrl.pkgInstalled[dialog.depCache.queue[0]] ?
							      'installed' : 'missing'
						};
					}

					if (!angular.isNumber(pkgInfo.size))
						pkgInfo.size = 0;

					var e = dialog.depCache.info[pkgInfo.package];

					if (!e)
						return;

					angular.extend(e, pkgInfo);

					dialog.depCache.queue.shift();
					dialog.depCache.size = 0;

					for (var pkgInfoName in dialog.depCache.info)
						if (dialog.depCache.info[pkgInfoName].state === 'unknown')
							dialog.depCache.size += dialog.depCache.info[pkgInfoName].size;

					if (angular.isArray(pkgInfo.depends)) {
						for (var j = 0; j < pkgInfo.depends.length; j++) {
							var pkgDepName = pkgInfo.depends[j].split(' ')[0];
							if (!angular.isObject(dialog.depCache.info[pkgDepName])) {
								dialog.depCache.queue.push(pkgDepName);

								e.childs.push((
									dialog.depCache.info[pkgDepName] = {
										package: pkgDepName,
										md5sum: Math.random(),
										state: softwareCtrl.pkgInstalled[pkgDepName] ?
										       'installed' : 'unknown',
										childs: []
									}
								));
							}
						}
					}

					if (dialog.depCache.queue.length > 0) {
						softwareCtrl.getOpkgInfo(dialog.depCache.queue[0])
							.then(dialog.findDependencies);
					}					else {
						for (var pkgName in dialog.depCache.info)
							if (dialog.depCache.info[pkgName].state === 'unknown')
								dialog.depCache.needed.push(pkgName);
							else if (dialog.depCache.info[pkgName].state === 'missing')
								dialog.depCache.isMissing = true;

						if (dialog.depCache.size >= softwareCtrl.diskFree.free)
							dialog.depCache.isSizeError = true;
						else if (dialog.depCache.size * 1.05 >= softwareCtrl.diskFree.free)
							dialog.depCache.isSizeWarning = true;

						dialog.depCache.isLoading = false;
					}
				},

				dismiss: function() {
					$uibModalInstance.dismiss();
				}
			});

			dialog.loadInfo(initialPkgName);

			return dialog;
		},

		displayInfo: function(pkgName) {
			$uibModal.open({
				controller: ['$scope', '$uibModalInstance', 'pkgName',
				            softwareCtrl.displayInfoCtrl],
				controllerAs: 'Dialog',
				templateUrl: 'system/software/info.html',
				resolve: {
					pkgName: function() {
						return pkgName;
					}
				}
			});
		}
	});

	l2spin.open();
	softwareCtrl.updateDiskFree()
		.then(softwareCtrl.getInstalled)
		.then(softwareCtrl.getNextList);
});
