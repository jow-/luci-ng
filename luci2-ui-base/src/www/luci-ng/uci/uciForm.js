angular.module('LuCI2')
	.component('uciForm', {
		transclude: true,
		bindings: {
			uciModel: '=?',

			selector: '@',
			title: '@',
			description: '@',
			enabled: '<'

		},
		templateUrl: 'luci-ng/uci/uciForm.tmpl.html',
		controller: UciFormCtrl
	});


function UciFormCtrl(uci) {
	var self = this;

	/** public properties **/
	// self.form  --> added by the 'form' element in the template
	self.isRegistered = false;

	/** export public methods **/
	self.$onInit = onInit;


	/** public methods **/

	function onInit() {
		console.debug('uciForm: $onInit');

		if (!self.uciModel) {
			if (!self.selector)
				throw new Error('uciForm: either "uciModel" or "selector" attribute must be present');

			self.uciModel = uci.newModel();

			self.uciModel.load(self.selector).then(registerEnd);
		} else
			self.isRegistered = true;
	}

	/** private methods **/

	function registerEnd(config) {
		console.debug('uciForm: registerEnd');

		self.config = config;
		self.isRegistered = true;
	}
}
