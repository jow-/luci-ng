angular.module('LuCI2')
	.component('uciSection', {
		transclude: true,
		bindings: {
			section: '=?',

			selector: '@',
			title: '@',
			description: '@',

			type: '@'
		},
		templateUrl: 'luci-ng/uci/uciSection.tmpl.html',
		require: {
			uciForm: '^^uciForm',
			uciSections: '?^^uciSections'
		},
		controller: UciSectionCtrl
	});

function UciSectionCtrl() {
	var self = this;

	self.$onInit = onInit;

	self.isRegistered = false;


	function onInit() {
		var match, sec;
		if (!self.section ) {
			// no 'section' attribute was provided, create osecpt obj and register with Form
			// 'selector' is required in this case

			if (!self.type)
				throw new Error('uciSection: a section must have a "type"');

			if (typeof(self.selector) == 'string') {
				match = self.selector.match(/^(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)$/);

				if (!match)
					throw new Error('uciSection: Invalid UCI selector "%s"'.format(self.selector) +
					                ', must be "[config.]section"');
			}

			sec = {
				configName: match[1],
				name: match[2],

				title: self.title || match[3],
				description: self.description || '',

				type: self.type
			};


			if (!sec.configName)
				sec.config = self.uciForm.config;

			self.uciForm.uciModel.registerSection(sec).then(registerEnd);
		} else if (Object.prototype.toString.call(self.section) != '[object Section]')
			throw new Error('uciSection: "section" attribute must be an instance of class Section');
		else
			self.isRegistered = true;
	}

	function registerEnd(section) {
		self.section = section;
		self.isRegistered = true;
	}
}
