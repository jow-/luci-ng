/* eslint angular/controller-as-vm: 0 */

angular.module('LuCI2')
	.controller('AppController', function(l2menu, l2session, $scope) {
		var self = this;
		self.logout = l2session.destroy;
		self.thisYear = new Date().getFullYear();

		$scope.$on('session.setup', function(event, session) {
			l2menu.update().then(function(menu) {
				self.sideMenuItems = menu.childs;
				l2menu.registerStates();
			});
		});

		self.toolbar = [
			{
				svgIcon: 'border-color',
				badge: '0',
				menu: [
					{ svgIcon: 'content-save', label: 'Commit' },
					{ svgIcon: 'undo', label: 'Reset' }]
			},
			{
				svgIcon: 'account-circle',
				menu: [
					{ label: 'root', svgIcon: 'account-check' },
					{ label: 'Expert Mode', svgIcon: 'tune' },
					{ svgIcon: 'lock-outline', label: 'Change Password' },
					{ svgIcon: 'logout-variant', label: 'Logout' }]
			},
			{
				svgIcon: 'power-settings',
				menu: [
					{
						svgIcon: 'reload',
						label: 'Reboot',
						onClick: function() {
							alert('are you shure?');
						}
					},
					{ svgIcon: 'translate', label: 'Languaje' },
					{ svgIcon: 'palette', label: 'Theme' }]
			}];
	});
