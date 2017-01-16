angular.module('LuCI2')
	.factory('l2spin', function($uibModal, gettext) {
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

				_loading.$modal = $uibModal.open({
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
	});
