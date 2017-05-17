angular.module('LuCI2')
	.component('uciOption', {
		transclude: false,
		bindings: {
			option: '=?',

			selector: '@',
			title: '@',
			description: '@',

			type: '@',
			validate: '@',
			required: '@',
			depends: '@'
		},
		templateUrl: 'luci-ng/uci/uciOption.tmpl.html',
		require: {
			uciForm: '^^uciForm',
			uciSection: '?^^uciSection'
		},
		controller: UciOptionCtrl
	});

function UciOptionCtrl() {
	var self = this;

	self.$onInit = onInit;

	self.isRegistered = false;


	function onInit() {
		var match, optDef;

		console.debug('uciOption: $onInit');

		if (!self.option ) {
			// no 'option' attribute was provided, create opt obj and register with Form
			// 'selector' is required in this case

			if (typeof(self.selector) == 'string') {
				match = self.selector.match(/^(?:([a-zA-Z0-9_-]+)\.)?(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)$/);

				if (!match)
					throw new Error('uciOption: Invalid UCI selector "%s"'.format(self.selector) +
					                ', must be "[[config.]section.]option"');
			} else
				throw new Error('uciOption: either "option" or "selector" attr must be provided');

			optDef = {
				configName: match[1] && match[2] ? match[1] : undefined,
				sectionName:  match[2] || match[1],
				name: match[3],

				title: self.title || match[3],
				description: self.description || '',

				type: self.type || 'string',
				validate: self.validate,
				required: !angular.isUndefined(self.required),
				depends: self.depends
			};

			if (!optDef.sectionName) {
				if (self.uciSection) {
					optDef.section = self.uciSection.section;
				} else
					throw new Error('uciOption: "section" selector can only be omited' +
					                ' inside a parent <uci-section>');
			} else if (!optDef.configName)
				optDef.config = self.uciForm.config;

			self.uciForm.uciModel.registerOption(optDef).then(registerEnd);
		} else if (Object.prototype.toString.call(self.option) != '[object Option]')
			throw new Error('uciOption: "option" attribute must be an instance of class Option');
		else
			self.isRegistered = true;
	}

	function registerEnd(option) {
		console.debug('uciOption: registerEnd');

		self.option = option;

		if (option.validate && option.validate!=option.type)
			self.validate = 'and(%s, %s)'.format(option.type, option.validate);
		else
			self.validate = option.type;

		if (!types[option.type])
			throw new Error('Invalid option type');
		self.type = types[option.type];

		self.isRegistered = true;
	}
}


var types = {
	bool: 'checkbox',
	integer: 'text',
	uinteger: 'text',
	float: 'text',
	ufloat: 'text',
	string: 'text',
	ipaddr: 'text',
	ip4addr: 'text',
	ip6addr: 'text',
	netmask4: 'text',
	netmask6: 'text',
	cidr4: 'text',
	cidr6: 'text',
	ipmask4: 'text',
	ipmask6: 'text',
	port: 'text',
	portrange: 'text',
	macaddr: 'text',
	host: 'text',
	hostname: 'text',
	wpakey: 'text',
	wepkey: 'text',
	device: 'cbiDeviceList',
	network: 'cbiNetworkList'
};

