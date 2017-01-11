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

L2.registerController('SystemBackupController', function($uibModal, l2cgi, l2rpc, l2spin,
	                  fileService, gettext) {
	var upgradeCtrl = this;

	angular.extend(upgradeCtrl, {
		getUploadFile: function() {
			return fileService[0];
		},

		getSelectedFileName: function(log) {
			var file=upgradeCtrl.getUploadFile();
			if (file == undefined ) {
				return gettext('No file selected');
			}			else {
				return file.name;
			}
		},

		uploadFileSelected: function() {
			if (upgradeCtrl.getUploadFile() != undefined ) {
				return false;
			}			else {
				return true;
			}
		},

		restoreBackupRpc: l2rpc.declare({
			object: 'luci2.system',
			method: 'backup_restore'
		}),

		cleanBackupRpc: l2rpc.declare({
			object: 'luci2.system',
			method: 'backup_clean'
		}),

		getBackupConfig: l2rpc.declare({
			object: 'luci2.system',
			method: 'backup_config_get',
			expect: { config: '' }
		}),

		setBackupConfig: l2rpc.declare({
			object: 'luci2.system',
			method: 'backup_config_set',
			params: ['data']
		}),

		listBackup: l2rpc.declare({
			object: 'luci2.system',
			method: 'backup_list',
			expect: { files: [] }
		}),

		reboot: l2rpc.declare({
			object: 'luci2.system',
			method: 'reboot'
		}),

		changeBackupConfig: function() {
			l2spin.open();
			upgradeCtrl.setBackupConfig(upgradeCtrl.backupconfig).then(function(rv) {
				upgradeCtrl.isBackupConfigChanged = (rv === 0);
				l2spin.close();
			});
		},

		downloadBackup: function() {
			l2spin.open();
			l2cgi._download().then(function() {
				l2spin.close();
			});
		},

		showBackupListCtrl: function($scope, $uibModalInstance) {
			var dialog = this;
			l2spin.open();
			upgradeCtrl.listBackup().then(function(files) {
				$scope.listconfig=files;
				l2spin.close();
			});
			return angular.extend(dialog, {
				confirm: function() {
					$uibModalInstance.dismiss();
				}
			});
		},

		showBackupList: function() {
			$uibModal.open({
				controller: upgradeCtrl.showBackupListCtrl,
				controllerAs: 'Dialog',
				templateUrl: 'system/upgrade/list.html'
			});
		},

		displayBackupConfirmCtrl: function($scope, $uibModalInstance) {
			var dialog = this;
			$scope.data = upgradeCtrl.data;
			return angular.extend(dialog, {
				upgradeCtrl: upgradeCtrl,
				backup: function() {
					$uibModalInstance.dismiss();
					upgradeCtrl.restoreBackup();
				},
				cancel: function() {
					$uibModalInstance.dismiss();
					upgradeCtrl.cleanBackup();
				}
			});
		},

		uploadBackup: function() {
			var file = upgradeCtrl.getUploadFile();
			l2spin.open();
			l2cgi.uploadBackup(file).then(function(data) {
				upgradeCtrl.data=data;
				l2spin.close();
				$uibModal.open({
					controller: ['$scope', '$uibModalInstance',
					            upgradeCtrl.displayBackupConfirmCtrl],
					controllerAs: 'Confirm',
					templateUrl: 'system/backup/success.html'
				});
			});
		},

		restoreBackup: function() {
			l2spin.open();
			upgradeCtrl.restoreBackupRpc().then(function() {
				upgradeCtrl.reboot();
			});
		},

		cleanBackup: function() {
			l2spin.open();
			upgradeCtrl.cleanBackupRpc().then(function() {
				l2spin.close();
			});
		}
	});

	l2spin.open();
	upgradeCtrl.getBackupConfig().then(function(files) {
		upgradeCtrl.backupconfig=files;
		l2spin.close();
	});
});

