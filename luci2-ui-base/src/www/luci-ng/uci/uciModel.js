/* eslint angular/timeout-service:0 */

angular.module('LuCI2').factory('uci', function(l2rpc, $q) {
	var uci = {
		callLoad: l2rpc.declare({
			object: 'uci',
			method: 'get',
			params: ['config'],
			expect: { values: { } }
		}),

		callOrder: l2rpc.declare({
			object: 'uci',
			method: 'order',
			params: ['config', 'sections']
		}),

		callAdd: l2rpc.declare({
			object: 'uci',
			method: 'add',
			params: ['config', 'type', 'name', 'values'],
			expect: { section: '' }
		}),

		callSet: l2rpc.declare({
			object: 'uci',
			method: 'set',
			params: ['config', 'section', 'values']
		}),

		callDelete: l2rpc.declare({
			object: 'uci',
			method: 'delete',
			params: ['config', 'section', 'options']
		}),

		callCommit: l2rpc.declare({
			object: 'uci',
			method: 'commit',
			params: ['config']
		}),

		callApply: l2rpc.declare({
			object: 'uci',
			method: 'apply',
			params: ['timeout', 'rollback']
		}),

		callConfirm: l2rpc.declare({
			object: 'uci',
			method: 'confirm'
		}),

		newModel: function() {
			return new UciModel(uci);
		}

	};

	function UciModel() {
		this.configs = [];
		this.configs.get = objectFinder('name');
	}

	UciModel.prototype = {
		configs: null,

		registerOption: registerOption,
		registerSection: registerSection,

		load: load,
		save: save,
/*		apply:
		commit:
*/
		_saveSection: _saveSection
	};

	return uci;


	function load(configName) {
		var self=this;
		var deferred = $q.defer();
		var conf=this.configs.get(configName);

		if (!conf) {
			uci.callLoad(configName).then(function(values) {
				var conf=new Config(configName, values);
				self.configs.push(conf);
				deferred.resolve(conf);
			});
		} else
			deferred.resolve(conf);

		return deferred.promise;
	}

	function registerOption(optDef) {
		var self=this;
		var deferred = $q.defer();

		var config = (optDef.section && optDef.section.config) || self.configs.get(optDef.configName);

		if (!config)
			self.load(optDef.configName).then(configLoadedCB);
		else {
			configLoadedCB(config);
		}

		return deferred.promise;

		function configLoadedCB(conf) {
			var section = optDef.section || conf.sections.get(optDef.sectionName);

			if (!section)
				throw new Error('uciModel: section "%s", doesn\'t exist in config "%s"'
				                .format(optDef.sectionName, conf.name));

			// if the option is new, add it, otherwise update attributes
			var option = section.options.get(optDef.name);
			if (!option) {
				option = section.addOption(optDef);
			} else
				option.redefine(optDef);

			deferred.resolve(option);
		}
	}

	function registerSection(sectDef) {
		var self=this;
		var deferred = $q.defer();

		var config = sectDef.config || self.configs.get(sectDef.configName);

		if (!config)
			self.load(sectDef.configName).then(configLoadedCB);
		else {
			configLoadedCB(config);
		}

		return deferred.promise;

		function configLoadedCB(conf) {
			var section = conf.sections.get(sectDef.name);

			if (!section)
				section = conf.addSection(sectDef);
			else
				section.redefine(sectDef);

			deferred.resolve(section);
		}
	}

	function save() {
		var i, j;

		l2rpc.batch();

		for (i=0; i < this.configs.length; i++) {
			for (j=0; j < this.configs[i].sections.length; j++)
				this._saveSection( this.configs[i].sections[j]);

			uci.callCommit(this.configs[i].name).then(function(res) {
				console.debug('commit CB: ' + res);
			});
		}

		return l2rpc.flush();
	}

	function _saveSection(section) {
		var i, o, opts = section.options;
		var deferred = $q.defer();


		if (section.changes == 1) {
		// if it is a new section
			o = {};
			for (i=0; i < opts.length; i++)
				o[opts[i].name] = opts[i].value;

			uci.callAdd(section.config.name, section.type,
			            section.anonymous ? undefined : section.name, o)
				.then(function(res) {
					// if it is anonymous we get back the temporary name
					if (section.anonymous && res && res['.name'] ) {
						section.uciName = section.name = res['.name'];
					}
					// uciIndex ??

					// mark everything as saved
					section.changes = 0;

					var j;
					for (j=0; j < opts.length; j++) {
						opts[j].changes = 0;
						opts[j].uciValue = opts[j].value;
					}
					deferred.resolve(1);
				});
		} else if (section.changes == -1) {
			// removed section
			uci.callDelete(section.config.name, section.uciName, undefined)
				.then(function(res) {
					deferred.resolve(-1);
				});
		} else {
			// check for modifications

			// update options
			o = {};
			var changes = false;
			for (i=0; i < opts.length; i++) {
				if (opts[i].uciValue != opts[i].value) {
					o[opts[i].name] = opts[i].value;
					opts[i].uciValue = opts[i].value;
					changes = true;
				}
			}

			if (changes) {
				uci.callSet(section.config.name, section.uciName, o).then(function(res) {
					deferred.resolve(0);
				});
			} else
				deferred.resolve(false);
		}

		return deferred.promise;
	}
});


function Config(name, uci) {
	this.sections = [];
	this.sections.get = objectFinder('name');
	this.name = name;

	if (typeof(uci)=='object')
		this.importUci(uci);
}

Config.prototype = {
	name: undefined,

	importUci: function(config) {
		for (var sec in config) {
			this.sections[config[sec]['.index']] = new Section(this, config[sec]);
		}
	},

	addSection: function(secDef) {
		var section = new Section(this);
		section.changes = 1; // signal new option
		section.redefine(secDef);
		this.sections.push(section);

		return section;
	}


};


/** "Section" object
	** properties **
	config: null,

	anonymous: true,
	type: undefined,
	name: undefined,

	options: null, // [<Option>] array of child options

	changes: null,
	uciName: undefined,
	uciIndex: null,
**/

function Section(config, section) {
	this.config = config;
	this.options = [];
	this.options.get = objectFinder('name');

	if (typeof(section)=='object') {
		this.importUci(section);
	}
}

Section.prototype = {

	/** methods **/

	importUci: function(uciSection) {
		this.anonymous = uciSection['.anonymous'];
		this.type = uciSection['.type'];
		this.uciName = this.name = uciSection['.name'];
		this.uciIndex = uciSection['.index'];
		this.changes = null;

		this.options.length=0;

		for (var prop in uciSection) {
			if (prop.charAt(0) != '.') {
				this.options.push(new Option(this, prop, uciSection[prop]));
			}
		}
	},

	addOption: function(optDef) {
		var option = new Option(this, optDef);
		option.changes = 1; // signal new option
		this.options.push(option);

		return option;
	},

	redefine: function(secDef) {
		if (angular.isUndefined(this.name)) this.name = secDef.name;

		if (!angular.isUndefined(secDef.title)) this.title = secDef.title;
		if (!angular.isUndefined(secDef.description)) this.description = secDef.description;

		if (!angular.isUndefined(secDef.type)) this.type = secDef.type;
		this.anonymous = !this.name;
	}
};

var optionID = 0;

function Option(section, opt, value) {
	this.section = section;

	if (typeof(opt)=='string') {
		this.name = this.title = opt;
		this.value = angular.copy(value);
		this.uciValue = value;

		this.type = 'string';
		this.isList = angular.isArray(value);
	} else if (typeof(opt)=='object') {
		this.redefine(opt);
		this.value = undefined;
	}

	this.changes = null;
	this.id = ++optionID;
}

Option.prototype = {
	section: undefined,

	name: undefined,
	value: undefined,

	changes: undefined,

	/** definition **/
	title: undefined,
	description: undefined,

	type: 'string',
	isList: false,

	required: false,
	validation: null,
	values: undefined,
	depends: undefined,


	redefine: function(optDef) {
		if (angular.isUndefined(this.name)) this.name = optDef.name;

		if (!angular.isUndefined(optDef.title)) this.title = optDef.title;
		if (!angular.isUndefined(optDef.description)) this.description = optDef.description;

		if (!angular.isUndefined(optDef.type)) this.type = optDef.type;
		this.isList = angular.isArray(this.type) || angular.isArray(this.value);

		if (!angular.isUndefined(optDef.required)) this.required = optDef.required;
		if (!angular.isUndefined(optDef.validation)) this.validation = optDef.validation;
		if (!angular.isUndefined(optDef.values)) this.values = optDef.values;
		if (!angular.isUndefined(optDef.depends)) this.depends = optDef.depends;
	}
};


/** helper functions **/

function objectFinder(prop) {
	return function(value) {
		for (var i=0; i< this.length; i++)
			if (this[i][prop] == value)
				return this[i];

		return undefined;
	};
}
