L2.registerController('SharedUci_generalController', ['$scope', '$http', 'l2uci', function ($scope, $http, l2uci) {

	console.log("View controller");

	var configFile = "system";


	var self = angular.extend(this, {
		types: {
			bool: {
				elem: "cbiFlag",
				attr: "on='1' off='0'",
				validation: false
			},
			intenger: true,
			uinteger: true,
			float: true,
			ufloat: true,
			string: true,
			ipaddr: true,
			ip4addr: true,
			ip6addr: true,
			netmask4: true,
			netmask6: true,
			cidr4: true,
			cidr6: true,
			ipmask4: true,
			ipmask6: true,
			port: true,
			portrange: true,
			macaddr: true,
			host: true,
			hostname: true,
			wpakey: true,
			wepkey: true,
			device: {
				elem: "cbiDeviceList"
			},
			network: {
				elem: "cbiNetworkList"
			},
		},

		config: null,
		isLoaded: false,

		parseTemplate: function (data) {
			var sec, opt, grp;
			var secName, optName, grpName;
			var isList;
			console.log("UCI Templeate read");
			data = data.data;
			//console.log(data);

			//add 'name' properties to each level
			data.name = configFile
			data.title = data.title || configFile;
			if (!data.luci2) data.luci2 = {};



			if (data.sections) {
				for (secName in data.sections) {
					sec = data.sections[secName];
					sec.name = secName;
					//console.log(sec);
					//console.log(data.sections[sec]);

					if (typeof (sec.title) == "undefined") sec.title = secName;
					if (!sec.luci2) sec.luci2 = {};

					if (!sec.luci2.addremove) delete sec.luci2.addremove;
					if (!sec.luci2.anonymous) delete sec.luci2.anonymous;

					//section has ungrouped options
					self.parseOptions(sec.options);
					
					for( grpName in sec.groups) {
						grp=sec.groups[grpName];
						grp.nane=grpName;
						grp.title=grp.title || grpName;
						self.parseOptions(grp.options);
					}
						
				}


			}
			//console.log("add names");
			//console.log(data);

			self.config = data;
			self.isLoaded = true;
			$scope.config = data;
			$scope.isLoaded = true;
		},
		parseOptions: function (options) {
			if(typeof(options)=='undefined') return;
			
			for (optName in options) {
				opt = options[optName];
				//console.log(opt);

				opt.name = optName;
				opt.title = opt.title || optName;

				//if it is a list take the type from the first value
				if (angular.isArray(opt.type)) {
					isList = true;
					opt.type = opt.type.length ? opt.type[0] : "string";
				} else isList = undefined;

				//get control information
				if (!self.types[opt.type]) opt.type = 'string';
				if (!angular.isObject(self.types[opt.type])) {
					opt.type = {
						elem: 'cbiInput',
						validation: opt.type
					}
				} else opt.type = self.types[opt.type];
				opt.type.isList = isList;


				if (opt.values) {
					if (!angular.isArray(opt.values)) opt.values = [opt.values];

					if (opt.type.elem == "cbiFlag") {
						if (opt.values.length >= 2) {
							opt.type.attr = "on=" + opt.values[0] + " off="
							opt.values[1];
						}
					} else opt.type.elem = 'cbiSelect';

				}

				
				//calculate validate options
				if(typeof(opt.required)=="undefined") opt.required=false;
				
				opt.validate = []
				if (opt.type.validation) opt.validate.push(opt.type.validation);
				if (opt.validation) opt.validate.push(opt.validation);
				if (opt.values) opt.validate.push("or(" + opt.values.join(',') + ")");
				opt.validate =  opt.validate.length > 1 ? ("and(" + opt.validate.join(',') + ")") : opt.validate.join(',');
				opt.validate = (opt.required ? "require " : "optional ")  + opt.validate;

			}

		}
	});

	$http.get('system.json').then(this.parseTemplate, function (data) {
		console.log("error reading config definition");
		console.log(data);
	});
	}]);
