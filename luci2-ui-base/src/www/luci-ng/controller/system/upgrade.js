L2.registerFactory('fileService', function() {
	var files = [];
	return files;
});

L2.registerDirective('fileModel', function($parse, fileService) {
	return {
		restrict: 'A',
		link: function($scope, element) {
			element.bind('change', function() {
				$scope.$apply(function() {
					if (element[0].files != undefined) {
						fileService.pop();
						fileService.push(element[0].files[0]);
					}
				});
			});
		}
	};
});

L2.registerController('SystemUpgradeController', function($uibModal, l2cgi, l2rpc, l2spin,
	                  fileService, gettext) {
	var upgradeCtrl = this;

	angular.extend(upgradeCtrl, {
		getUploadFile: function() {
			return fileService[0];
		},

		getSelectedFileName: function() {
			var file = upgradeCtrl.getUploadFile();
			return file ? file.name : gettext('No file selected');
		},

		uploadFileSelected: function() {
			return ( upgradeCtrl.getUploadFile() != undefined );
		},

		upgradeTestRpc: l2rpc.declare({
			object: 'rpc-sys',
			method: 'upgrade_test'
		}),

		upgradeStartRpc: l2rpc.declare({
			object: 'rpc-sys',
			method: 'upgrade_start',
			params: ['keep']
		}),

		upgradeCleanRpc: l2rpc.declare({
			object: 'rpc-sys',
			method: 'upgrade_clean'
		}),

		reboot: l2rpc.declare({
			object: 'luci2.system',
			method: 'reboot'
		}),

		displayUpgradeSuccessCtrl: function($scope, $uibModalInstance) {
			var dialog = this;
			$scope.size = upgradeCtrl.size;
			$scope.checksum = upgradeCtrl.checksum;
			return angular.extend(dialog, {
				upgrade: function() {
					$uibModalInstance.dismiss();
					upgradeCtrl.startUpgrade();
				},
				cancel: function() {
					$uibModalInstance.dismiss();
					upgradeCtrl.upgradeCleanRpc();
				}
			});
		},

		displayUpgradeFailedCtrl: function($scope, $uibModalInstance) {
			var dialog = this;
			$scope.code = upgradeCtrl.code;
			$scope.stdout = upgradeCtrl.stdout;
			$uibModalInstance.opened.then(function() {
				upgradeCtrl.upgradeCleanRpc();
			});
			return angular.extend(dialog, {
				confirm: function() {
					$uibModalInstance.dismiss();
				}
			});
		},

		uploadUpgrade: function() {
			var file = upgradeCtrl.getUploadFile();
			l2spin.open();
			l2cgi.uploadUpgrade(file).then(function(data) {
				upgradeCtrl.checksum = data.checksum;
				upgradeCtrl.size = data.size;
				return upgradeCtrl.upgradeTestRpc();
			}).then(function(data) {
				upgradeCtrl.code = data.code;
				upgradeCtrl.stdout = data.stdout;
				l2spin.close();
				if (data.code == 0) {
					$uibModal.open({
						controller: ['$scope', '$uibModalInstance',
						            upgradeCtrl.displayUpgradeSuccessCtrl],
						controllerAs: 'success',
						keyboard: false,
						templateUrl: 'system/backup/success.html'
					});
				}				else {
					$uibModal.open({
						controller: ['$scope', '$uibModalInstance',
						            upgradeCtrl.displayUpgradeFailedCtrl],
						controllerAs: 'failed',
						keyboard: false,
						templateUrl: 'system/backup/failed.html'
					});
				}
			});
		},

		startUpgrade: function() {
			l2spin.open();
			upgradeCtrl.upgradeStartRpc(upgradeCtrl.keep).then(
				l2spin.close()
			);
		}
	});

	upgradeCtrl.keep = true;
});
