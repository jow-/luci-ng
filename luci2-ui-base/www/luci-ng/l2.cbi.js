L2.registerFactory('l2validation', ['l2ip', 'gettext', function(l2ip, gettext) {
	var _val = { };
	return angular.extend(_val, {
		compile: function(code)
		{
			var pos = 0;
			var esc = false;
			var depth = 0;
			var stack = [ ];

			code += ',';

			for (var i = 0; i < code.length; i++)
			{
				if (esc)
				{
					esc = false;
					continue;
				}

				switch (code.charCodeAt(i))
				{
				case 92:
					esc = true;
					break;

				case 40:
				case 44:
					if (depth <= 0)
					{
						if (pos < i)
						{
							var label = code.substring(pos, i);
								label = label.replace(/\\(.)/g, '$1');
								label = label.replace(/^[ \t]+/g, '');
								label = label.replace(/[ \t]+$/g, '');

							if (label && !isNaN(label))
							{
								stack.push(parseFloat(label));
							}
							else if (label.match(/^(['"]).*\1$/))
							{
								stack.push(label.replace(/^(['"])(.*)\1$/, '$2'));
							}
							else if (typeof _val.types[label] == 'function')
							{
								stack.push(_val.types[label]);
								stack.push([ ]);
							}
							else
							{
								throw "Syntax error, unhandled token '"+label+"'";
							}
						}
						pos = i+1;
					}
					depth += (code.charCodeAt(i) == 40);
					break;

				case 41:
					if (--depth <= 0)
					{
						if (typeof stack[stack.length-2] != 'function')
							throw "Syntax error, argument list follows non-function";

						stack[stack.length-1] =
							_val.compile(code.substring(pos, i));

						pos = i+1;
					}
					break;
				}
			}

			return stack;
		},

		test: function(stack, value) {
			delete _val.message;

			if (!stack[0].apply(value, stack[1]))
				return _val.message;

			return undefined;
		},

		types: {
			'integer': function()
			{
				if (this.match(/^-?[0-9]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid integer');
				return false;
			},

			'uinteger': function()
			{
				if (_val.types['integer'].apply(this) && (this >= 0))
					return true;

				_val.message = gettext('Must be a positive integer');
				return false;
			},

			'float': function()
			{
				if (!isNaN(parseFloat(this)))
					return true;

				_val.message = gettext('Must be a valid number');
				return false;
			},

			'ufloat': function()
			{
				if (_val.types['float'].apply(this) && (this >= 0))
					return true;

				_val.message = gettext('Must be a positive number');
				return false;
			},

			'ipaddr': function()
			{
				if (l2ip.parseIPv4(this) || l2ip.parseIPv6(this))
					return true;

				_val.message = gettext('Must be a valid IP address');
				return false;
			},

			'ip4addr': function()
			{
				if (l2ip.parseIPv4(this))
					return true;

				_val.message = gettext('Must be a valid IPv4 address');
				return false;
			},

			'ip6addr': function()
			{
				if (l2ip.parseIPv6(this))
					return true;

				_val.message = gettext('Must be a valid IPv6 address');
				return false;
			},

			'netmask4': function()
			{
				if (l2ip.isNetmask(l2ip.parseIPv4(this)))
					return true;

				_val.message = gettext('Must be a valid IPv4 netmask');
				return false;
			},

			'netmask6': function()
			{
				if (l2ip.isNetmask(l2ip.parseIPv6(this)))
					return true;

				_val.message = gettext('Must be a valid IPv6 netmask6');
				return false;
			},

			'cidr4': function()
			{
				if (this.match(/^([0-9.]+)\/(\d{1,2})$/))
					if (RegExp.$2 <= 32 && l2ip.parseIPv4(RegExp.$1))
						return true;

				_val.message = gettext('Must be a valid IPv4 prefix');
				return false;
			},

			'cidr6': function()
			{
				if (this.match(/^([a-fA-F0-9:.]+)\/(\d{1,3})$/))
					if (RegExp.$2 <= 128 && l2ip.parseIPv6(RegExp.$1))
						return true;

				_val.message = gettext('Must be a valid IPv6 prefix');
				return false;
			},

			'ipmask4': function()
			{
				if (this.match(/^([0-9.]+)\/([0-9.]+)$/))
				{
					var addr = RegExp.$1, mask = RegExp.$2;
					if (l2ip.parseIPv4(addr) && l2ip.isNetmask(l2ip.parseIPv4(mask)))
						return true;
				}

				_val.message = gettext('Must be a valid IPv4 address/netmask pair');
				return false;
			},

			'ipmask6': function()
			{
				if (this.match(/^([a-fA-F0-9:.]+)\/([a-fA-F0-9:.]+)$/))
				{
					var addr = RegExp.$1, mask = RegExp.$2;
					if (l2ip.parseIPv6(addr) && l2ip.isNetmask(L.parseIPv6(mask)))
						return true;
				}

				_val.message = gettext('Must be a valid IPv6 address/netmask pair');
				return false;
			},

			'port': function()
			{
				if (_val.types['integer'].apply(this) &&
					(this >= 0) && (this <= 65535))
					return true;

				_val.message = gettext('Must be a valid port number');
				return false;
			},

			'portrange': function()
			{
				if (this.match(/^(\d+)-(\d+)$/))
				{
					var p1 = RegExp.$1;
					var p2 = RegExp.$2;

					if (_val.types['port'].apply(p1) &&
						_val.types['port'].apply(p2) &&
						(parseInt(p1) <= parseInt(p2)))
						return true;
				}
				else if (_val.types['port'].apply(this))
				{
					return true;
				}

				_val.message = gettext('Must be a valid port range');
				return false;
			},

			'macaddr': function()
			{
				if (this.match(/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/) != null)
					return true;

				_val.message = gettext('Must be a valid MAC address');
				return false;
			},

			'host': function()
			{
				if (_val.types['hostname'].apply(this) ||
					_val.types['ipaddr'].apply(this))
					return true;

				_val.message = gettext('Must be a valid hostname or IP address');
				return false;
			},

			'hostname': function()
			{
				if ((this.length <= 253) &&
					((this.match(/^[a-zA-Z0-9]+$/) != null ||
					 (this.match(/^[a-zA-Z0-9_][a-zA-Z0-9_\-.]*[a-zA-Z0-9]$/) &&
					  this.match(/[^0-9.]/)))))
					return true;

				_val.message = gettext('Must be a valid host name');
				return false;
			},

			'network': function()
			{
				if (_val.types['uciname'].apply(this) ||
					_val.types['host'].apply(this))
					return true;

				_val.message = gettext('Must be a valid network name');
				return false;
			},

			'wpakey': function()
			{
				var v = this;

				if ((v.length == 64)
					  ? (v.match(/^[a-fA-F0-9]{64}$/) != null)
					  : ((v.length >= 8) && (v.length <= 63)))
					return true;

				_val.message = gettext('Must be a valid WPA key');
				return false;
			},

			'wepkey': function()
			{
				var v = this;

				if (v.substr(0,2) == 's:')
					v = v.substr(2);

				if (((v.length == 10) || (v.length == 26))
					  ? (v.match(/^[a-fA-F0-9]{10,26}$/) != null)
					  : ((v.length == 5) || (v.length == 13)))
					return true;

				_val.message = gettext('Must be a valid WEP key');
				return false;
			},

			'uciname': function()
			{
				if (this.match(/^[a-zA-Z0-9_]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid UCI identifier');
				return false;
			},

			'range': function(min, max)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(min) && !isNaN(max) && ((val >= min) && (val <= max)))
					return true;

				_val.message = gettext('Must be a number between %d and %d').format(min, max);
				return false;
			},

			'min': function(min)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(min) && !isNaN(val) && (val >= min))
					return true;

				_val.message = gettext('Must be a number greater or equal to %d').format(min);
				return false;
			},

			'max': function(max)
			{
				var val = parseFloat(this);

				if (_val.types['integer'].apply(this) &&
					!isNaN(max) && !isNaN(val) && (val <= max))
					return true;

				_val.message = gettext('Must be a number lower or equal to %d').format(max);
				return false;
			},

			'rangelength': function(min, max)
			{
				var val = '' + this;

				if (!isNaN(min) && !isNaN(max) &&
					(val.length >= min) && (val.length <= max))
					return true;

				if (min != max)
					_val.message = gettext('Must be between %d and %d characters').format(min, max);
				else
					_val.message = gettext('Must be %d characters').format(min);
				return false;
			},

			'minlength': function(min)
			{
				var val = '' + this;

				if (!isNaN(min) && (val.length >= min))
					return true;

				_val.message = gettext('Must be at least %d characters').format(min);
				return false;
			},

			'maxlength': function(max)
			{
				var val = '' + this;

				if (!isNaN(max) && (val.length <= max))
					return true;

				_val.message = gettext('Must be at most %d characters').format(max);
				return false;
			},

			'or': function()
			{
				var msgs = [ ];

				for (var i = 0; i < arguments.length; i += 2)
				{
					delete _val.message;

					if (typeof(arguments[i]) != 'function')
					{
						if (arguments[i] == this)
							return true;

						msgs.push('"%s"'.format(arguments[i]));
						i--;
					}
					else if (arguments[i].apply(this, arguments[i+1]))
					{
						return true;
					}

					if (_val.message)
						msgs.push(_val.message.format.apply(_val.message, arguments[i+1]));
				}

				_val.message = msgs.join( gettext(' - or - '));
				return false;
			},

			'and': function()
			{
				var msgs = [ ];

				for (var i = 0; i < arguments.length; i += 2)
				{
					delete _val.message;

					if (typeof arguments[i] != 'function')
					{
						if (arguments[i] != this)
							return false;
						i--;
					}
					else if (!arguments[i].apply(this, arguments[i+1]))
					{
						return false;
					}

					if (_val.message)
						msgs.push(_val.message.format.apply(_val.message, arguments[i+1]));
				}

				_val.message = msgs.join(', ');
				return true;
			},

			'neg': function()
			{
				return _val.types['or'].apply(
					this.replace(/^[ \t]*![ \t]*/, ''), arguments);
			},

			'list': function(subvalidator, subargs)
			{
				if (typeof subvalidator != 'function')
					return false;

				var tokens = this.match(/[^ \t]+/g);
				for (var i = 0; i < tokens.length; i++)
					if (!subvalidator.apply(tokens[i], subargs))
						return false;

				return true;
			},

			'phonedigit': function()
			{
				if (this.match(/^[0-9\*#!\.]+$/) != null)
					return true;

				_val.message = gettext('Must be a valid phone number digit');
				return false;
			},

			'string': function()
			{
				return true;
			}
		}
	});
}]);


L2.registerDirective('cbiMap', ['$timeout', '$parse', 'l2uci', function($timeout, $parse, l2uci) {
	return {
		restrict: 'A',
		scope: true,

		controllerAs: 'Map',
		controller: ['$scope', '$q', function($scope, $q) {
			var self = angular.extend(this, {
				get: l2uci.get,
				set: l2uci.set,

				isLoading: true,

				inProgress: [ ],
				cbiChildSections: [ ],
				loadConfig: function(package, cb) {
					console.debug('loadConfig: '+ package);
					self.uciPackages[package]=true;
					var res=l2uci.load(package);
					if(res && cb) res.then(cb);
				},

				init: function(iElem) {
					console.debug('Map init');
					self.loadConfig(self.uciPackageName, self.wait);
				},

				wait: function() {
					if (self.waitFn)
						self.waitfor(self.waitFn($scope));

					$q.all(self.inProgress).then(self.finish);
				},

				finish: function() {
					console.debug('Map finish');

					for (var i = 0, sec; sec = self.cbiChildSections[i]; i++)
						sec.finish();

					self.isLoading = false;
					self.inProgress.length = 0;

					console.debug('Map finish end');
				},

				waitfor: function(d) {
					if (angular.isObject(d) && angular.isFunction(d.then))
						self.inProgress.push(d);
				},

				save: function($event) {
					$event.currentTarget.blur();

					self.isLoading = true;

					for (var i = 0, sec; sec = self.cbiChildSections[i]; i++) {
						sec.save();
						sec.reset();
					}

					l2uci.save().then(self.read);
				},

				reset: function($event) {
					$event.currentTarget.blur();

					self.isLoading = true;
					l2uci.unload(self.uciPackages);

					for (var i = 0, sec; sec = self.cbiChildSections[i]; i++)
						sec.reset();

					l2uci.load(self.uciPackages).then(self.read);
				},

				apply: function($event) {
					$event.currentTarget.blur();

					l2uci.apply(10);
				}
			});
		}],

		replace: true,
		template: function(tElem, tAttr) {
			return '' +
				'<div class="cbi-map">' +
					'<h2 ng-if="Map.title">{{Map.title}}</h2>' +
					'<p ng-if="Map.description">{{Map.description}}</p>' +
					'<p ng-if="Map.isLoading" class="text-muted" translate>Loading configuration data…</p>' +
					'<div class="fade2" ng-class2="{in:!Map.isLoading}" ng-style="{opacity: Map.isLoading ? 0.3 : 1}">' +
						tElem.html() +
					'</div>' +
					'<div class="panel panel-default panel-body text-right">' +
						'<div class="btn-group">' +
							'<button type="button" ng-click="Map.save($event);Map.apply($event)" class="btn btn-primary" translate>Save &amp; Apply</button>' +
							'<button type="button" ng-click="Map.save($event)" class="btn btn-default" translate>Save</button>' +
							'<button type="button" ng-click="Map.reset($event)" class="btn btn-default" translate>Reset</button>' +
						'</div>' +
					'</div>' +
				'</div>'
			;
		},

		require: 'cbiMap',
		compile: function(tElem, tAttr) {
			return {
				pre: function($scope, iElem, iAttr, cbiMapCtrl) {
					angular.extend(cbiMapCtrl, {
						title: iAttr.title,
						description: iAttr.description,

						waitFn: iAttr.hasOwnProperty('waitfor') ? $parse(iAttr.waitfor) : null,

						uciPackages: {},
						uciPackageName: iAttr.cbiMap
					});

					cbiMapCtrl.init(iElem);
				}
			};
		}
	};
}]);

L2.registerDirective('cbiSection', ['$timeout', '$parse', 'gettext', 'l2validation', 'l2uci', function($timeout, $parse, gettext, l2validation, l2uci) {
	return {
		restrict: 'A',
		scope: true,

		controllerAs: 'Section',
		controller: ['$scope', 'l2uci', function($scope, l2uci) {
			var self = angular.extend(this, {
				uciSections: [ ],

				fieldCtrls: { },
				fieldErrors: { },

				read: function() {
					self.uciSections.length = 0;

					if (self.uciSectionName) {
						var s = l2uci.get(self.uciPackageName, self.uciSectionName);
						if (s && self.filter(s)) {
							self.uciSections.push(s['.name']);
							self.uciSectionType = s['.type'];
						}
					} else if (self.uciSectionType) {
						var sl = l2uci.sections(self.uciPackageName, self.uciSectionType);
						for (var i = 0, s; s = sl[i]; i++)
							if (self.uciSectionIndex === undefined || self.uciSectionIndex === i)
								if (self.filter(s))
									self.uciSections.push(s['.name']);
					}
				},

				init: function(iElem) {
					console.debug('Section init');
					self.read();

					if (self.waitFn)
						self.cbiOwnerMap.waitfor(self.waitFn($scope));

					if (self.isAddRemove && !self.isAnonymous)
						self.removeWatchFn = $scope.$watch('Section.addName', self.validateAddName);
				},

				filter: function(uciSection) {
					if (!self.filterFn)
						return true;

					return self.filterFn({
						uciSectionName: uciSection['.name'],
						uciSectionValues: uciSection,
						Section: self
					});
				},

				finish: function(uciSectionName) {
					console.debug('Section finish');

					if (self.isCollapse &&
					    self.uciSections.indexOf(self.activeSectionName) === -1)
						self.activeSectionName = self.uciSections[0];

					for (var sid in self.fieldCtrls) {
						if (uciSectionName !== undefined && uciSectionName !== sid)
							continue;

						for (var opt in self.fieldCtrls[sid])
							self.fieldCtrls[sid][opt].finish();
					}

					self.validate();

					console.debug('Section finish end');
				},

				open: function($event) {
					var $elem = angular.element($event.target),
					    sid = $elem.findParent('[cbi-section-id]').attr('cbi-section-id');

					if (sid) {
						self.validate();
						self.activeSectionName = sid;
					}
				},

				add: function($event) {
					if (!self.uciSectionType)
						return;

					if (!self.isAnonymous && !self.addName)
						return;

					var sid = l2uci.add(self.uciPackageName, self.uciSectionType,
					                    self.isAnonymous ? undefined : self.addName);

					if (self.isCollapse)
						self.activeSectionName = sid;

					if (self.addFn)
						self.addFn($scope, { uciSectionName: sid });

					$scope.$broadcast('section-add', sid);

					delete self.addName;

					self.read();

					$timeout(self.finish, 0, true, sid);
				},

				remove: function($event) {
					var $elem = angular.element($event.target),
						sid = $elem.findParent('[cbi-section-id]').attr('cbi-section-id'),
						idx = self.uciSections.indexOf(sid);

					if (sid) {
						if (idx === self.uciSections.length - 1)
							idx--;
						else
							idx++;

						if (sid === self.activeSectionName)
							self.activeSectionName = self.uciSections[idx];

						$scope.$broadcast('section-remove', sid);

						if (self.removeFn)
							self.removeFn($scope, { uciSectionName: sid });

						delete self.fieldCtrls[sid];
						delete self.fieldErrors[sid];

						l2uci.remove(self.uciPackageName, sid);
						self.read();
					}
				},

				sort: function($event) {
					var $elem = angular.element($event.target),
						selfSectionElem = $elem.findParent('[cbi-section-id]'),
						nextSectionElem = $elem.hasClass('up')
							? selfSectionElem.findPrev('[cbi-section-id]')
							: selfSectionElem.findNext('[cbi-section-id]'),
						sid1 = selfSectionElem.attr('cbi-section-id'),
						sid2 = nextSectionElem.attr('cbi-section-id');

					if (sid1 && sid2) {
						l2uci.swap(self.uciPackageName, sid1, sid2);
						self.read();
					}
				},

				validate: function() {
					for (var sid in self.fieldCtrls) {
						var nerr = 0;

						for (var opt in self.fieldCtrls[sid])
							if (!self.fieldCtrls[sid][opt].validate())
								nerr++;

						self.fieldErrors[sid] = nerr;
					}
				},

				reset: function() {
					self.fieldCtrls = { };
					self.fieldErrors = { };
					self.uciSections = [ ];

					if (self.removeWatchFn)
						self.removeWatchFn();
				},

				save: function() {
					for (var sid in self.fieldCtrls)
						for (var opt in self.fieldCtrls[sid])
							self.fieldCtrls[sid][opt].save();
				},

				validationFn: l2validation.compile('uciname'),
				validateAddName: function() {
					var name = self.addName;

					if (name && l2uci.get(self.uciPackageName, name))
						self.addErrorMsg = gettext('The name is already used');
					else if (name)
						self.addErrorMsg = l2validation.test(self.validationFn, name);
					else
						delete self.addErrorMsg;

					return !self.addErrorMsg;
				},

				teaserFields: function(uciSectionName) {
					var fields = [ ];

					if (self.fieldCtrls[uciSectionName]) {
						for (var optName in self.fieldCtrls[uciSectionName]) {
							var opt = self.fieldCtrls[uciSectionName][optName];
							if (opt.isPreview && !opt.isUnsatisified) {
								fields.push(opt);
							}
						}
					}

					return fields;
				},

				getFieldByName: function(uciSectionName, uciOptionName) {
					if (self.fieldCtrls[uciSectionName])
						return self.fieldCtrls[uciSectionName][uciOptionName] || null;

					return null;
				},

				addOption: function(cbiOptionCtrl) {
					var s = cbiOptionCtrl.uciSectionName,
					    n = cbiOptionCtrl.name,
						l = self.fieldCtrls[s] || (self.fieldCtrls[s] = { });

					l[n] = cbiOptionCtrl;
				}
			});
		}],

		replace: true,
		template: function(tElem, tAttr) {
			return '' +
				'<div class="panel panel-default">' +
					'<div ng-if="Section.title" class="panel-heading"><h3 class="panel-title">{{Section.title}}</h3></div>' +
					'<ul class="l2-section-group list-group">' +
						'<li ng-if="!Section.uciSections.length" class="list-group-item text-muted">{{Section.placeholder}}</li>' +
						'<li class="l2-section-item list-group-item form-horizontal animate-repeat" ng-repeat="uciSectionName in Section.uciSections" cbi-section-id="{{uciSectionName}}">' +
							'<div ng-if="Section.isCollapse || Section.isSortable || Section.isAddRemove" class="l2-section-header">' +
								'<div ng-if="Section.isCollapse && (Section.activeSectionName !== uciSectionName)" ng-click="Section.open($event)" class="l2-section-teaser well well-sm">' +
									'<span ng-if="Section.fieldErrors[uciSectionName]" class="badge">{{Section.fieldErrors[uciSectionName]}}</span>' +
									'<span ng-repeat="Option in Section.teaserFields(uciSectionName)" ng-init="textValue = Option.textValue()">' +
										'<span ng-style="Option.isInvalid ? {color:\'#d9534f\'} : {}">' +
											'{{Option.title}}: <strong>{{Option.textValue() || \'-\'}}</strong>' +
										'</span>' +
										'<span ng-if="!$last"> | </span>' +
									'</span>' +
								'</div>' +
								'<div ng-if="Section.isSortable || Section.isAddRemove" class="btn-group">' +
									'<button ng-if="Section.isSortable && !$first" type="button" title="{{\'Move up\' | translate}}" ng-click="Section.sort($event)" class="btn btn-info up">↑</button>' +
									'<button ng-if="Section.isSortable && !$last" type="button" title="{{\'Move down\' | translate}}" ng-click="Section.sort($event)" class="btn btn-info down">↓</button>' +
									'<button ng-if="Section.isAddRemove" type="button" title="{{Section.removeTitle}}" ng-click="Section.remove($event)" class="btn btn-danger">{{Section.removeCaption}}</button>' +
								'</div>' +
							'</div>' +
							'<div class="l2-section-panel panel-collapse" ng-class="{collapse: Section.isCollapse && (Section.activeSectionName !== uciSectionName)}">' +
								tElem.html() +
							'</div>' +
						'</li>' +
					'</ul>' +
					'<div ng-if="Section.isAddRemove" class="panel-footer">' +
						'<button ng-if="Section.isAnonymous" type="button" title="{{Section.addTitle}}" class="btn btn-success section-add-button" ng-click="Section.add($event)">{{Section.addCaption}}</button>' +
						'<div ng-if="!Section.isAnonymous" class="row"><div class="input-group col-lg-6 col-sm-12" ng-class="{\'has-error\':Section.addErrorMsg}">' +
							'<input type="text" class="form-control" placeholder="{{Section.addPlaceholder}}" ng-model="Section.addName">' +
							'<div class="input-group-btn">' +
								'<span title="{{Section.addTitle}}" class="btn btn-success" ng-disabled="Section.addErrorMsg" ng-click="Section.add($event)">{{Section.addCaption}}</span>' +
							'</div>' +
						'</div></div>' +
						'<div ng-if="Section.addErrorMsg" class="label label-danger">{{Section.addErrorMsg}}</div>' +
					'</div>' +
				'</div>'
			;
		},

		require: ['cbiSection', '^cbiMap'],
		link: function ($scope, iElem, iAttr, ctrls) {
			var cbiSectionCtrl = ctrls[0],
				cbiMapCtrl     = ctrls[1];

			var CBI_SECTION_MATCH = /^(?:([a-zA-Z0-9_-]+)\.)?(?:@([a-zA-Z0-9_-]+)(?:\[(\d+)\])?|([a-zA-Z0-9_]+))$/;
			if (!CBI_SECTION_MATCH.test(iAttr.cbiSection))
				throw 'Invalid UCI selector';

			cbiMapCtrl.cbiChildSections.push(angular.extend(cbiSectionCtrl, {
				title:           iAttr.title,
				placeholder:     iAttr.placeholder || gettext('There are no entries defined yet.'),

				addTitle:        iAttr.addTitle || gettext('Add new section'),
				addCaption:      iAttr.addCaption || gettext('Add…'),
				addPlaceholder:  iAttr.addPlaceholder || gettext('New section name'),

				removeTitle:     iAttr.removeTitle || gettext('Remove this section'),
				removeCaption:   iAttr.removeCaption || gettext('Remove'),

				isSortable:      iAttr.hasOwnProperty('sortable'),
				isAnonymous:     iAttr.hasOwnProperty('anonymous'),
				isAddRemove:     iAttr.hasOwnProperty('addremove'),
				isCollapse:      iAttr.hasOwnProperty('collapse'),

				addFn:           iAttr.hasOwnProperty('onadd') ? $parse(iAttr.onadd) : null,
				removeFn:        iAttr.hasOwnProperty('onremove') ? $parse(iAttr.onremove) : null,

				filterFn:        iAttr.hasOwnProperty('filter') ? $parse(iAttr.filter) : null,
				waitFn:          iAttr.hasOwnProperty('waitfor') ? $parse(iAttr.waitfor) : null,

				uciPackageName:  (RegExp.$1 !== '') ? RegExp.$1 : cbiMapCtrl.uciPackageName,
				uciSectionType:  (RegExp.$2 !== '') ? RegExp.$2 : undefined,
				uciSectionIndex: (RegExp.$3 !== '') ? parseInt(RegExp.$3, 10) : undefined,
				uciSectionName:  (RegExp.$4 !== '') ? RegExp.$4 : undefined,

				cbiOwnerMap:     cbiMapCtrl
			}));

			//make sure config is loaded an continue initialization
			cbiMapCtrl.loadConfig(cbiSectionCtrl.uciPackageName, cbiSectionCtrl.init.bind(cbiSectionCtrl,iElem));
		}
	};
}]);

L2.registerDirective('cbiOption', ['$parse', 'l2validation', 'gettext', function($parse, l2validation, gettext) {
	return {
		restrict: 'A',
		scope: true,

		controllerAs: 'Option',
		controller: ['$scope', 'l2uci', function($scope, l2uci) {
			var self = angular.extend(this, {
				rdepends: { },
				isUnsatisified: false,

				init: function(iElem) {
					console.debug('Option init');

					self.tabInit(iElem);

					self.uciValue = l2uci.get(self.uciPackageName, self.uciSectionName, self.uciOptionName);
					self.rawValue = self.uciValue;
				},

				finish: function() {
					for (var i = 0, dep; dep = self.dependencies[i]; i++) {
						for (var optName in dep) {
							var opt = self.cbiOwnerSection.getFieldByName(self.uciSectionName, optName);
							if (opt) {
								opt.rdepends[self.name] = self;
							}
						}
					}

					if (self.cbiWidget && self.cbiWidget.finish)
						self.cbiWidget.finish();

					console.debug('Option finish');
				},

				tabInit: function(iElem) {
					var curPane, tabHeads, tabIndex, $badge;

					if (!(curPane = iElem.findParent('.tab-pane')[0]))
						return;

					tabHeads = curPane.parentNode.previousElementSibling.children,
					tabIndex = Array.prototype.indexOf.call(curPane.parentNode.children, curPane);

					self.tabHead = angular.element(tabHeads[tabIndex]).addClass('fade in');
					self.tabBadge = self.tabHead.find('.badge');

					if (!self.tabBadge[0]) {
						self.tabHead.children().append('&#160;<span class="badge"></span>');
						self.tabBadge = self.tabHead.find('.badge');
					}
				},

				tabFields: function() {
					if (!self.tabHead)
						return null;

					var allFields = self.cbiOwnerSection.fieldCtrls,
					    tabFields = [ ];

					for (var optName in allFields[self.uciSectionName]) {
						var opt = allFields[self.uciSectionName][optName];

						if (opt.isUnsatisified || !opt.tabHead)
							continue;

						if (opt.tabHead[0] !== self.tabHead[0])
							continue;

						tabFields.push(opt);
					}

					return tabFields;
				},

				tabUpdate: function() {
					if (!self.tabHead)
						return;

					var nerr = 0,
					    fields = self.tabFields();

					for (var i = 0, opt; opt = fields[i]; i++)
						if (opt.isInvalid)
							nerr++;

					if (fields.length) {
						self.tabBadge.html(nerr).css('display', nerr ? '' : 'none');
						self.tabHead.addClass('in');
					}
					else {
						self.tabHead.removeClass('in');
					}
				},

				compare: function(a, b) {
					if (a === true) {
						return (angular.isDefined(b) &&
							    ((angular.isArray(b) && b.length > 0) ||
							     (angular.isString(b) && b !== '')));
					}
					else if (angular.isArray(a)) {
						return (a.indexOf(b) !== -1);
					}
					else if (angular.isFunction(a)) {
						return a(b);
					}
					else {
						return angular.equals(a, b);
					}
				},

				toggle: function() {
					for (var i = 0, dep; dep = self.dependencies[i]; i++) {
						var ok = true;

						for (var optName in dep) {
							if (!dep.hasOwnProperty(optName))
								continue;

							var opt = self.cbiOwnerSection.getFieldByName(self.uciSectionName, optName);

							if (!opt)
								continue;

							if (!self.compare(dep[optName], opt.formValue())) {
								ok = false;
								break;
							}
						}

						if (ok) {
							self.isUnsatisified = false;
							self.tabUpdate();
							return;
						}
					}

					self.isUnsatisified = true;
					self.tabUpdate();
				},

				validate: function() {
					var value = self.rawValue;

					if ((!angular.isDefined(value) || value.length === 0) && self.isRequired)
						self.errorMsg = gettext('Field must not be empty');
					else if (angular.isDefined(value) && value.length > 0 && self.validationFn)
						self.errorMsg = l2validation.test(self.validationFn, value);
					else
						delete self.errorMsg;

					self.isInvalid = !!self.errorMsg;

					for (var opt in self.rdepends)
						self.rdepends[opt].toggle();

					self.tabUpdate();

					return (!self.isInvalid || self.isUnsatisified);
				},

				save: function() {
					if (self.isInvalid || self.isUnsatisified)
						return false;

					if (self.cbiWidget && self.cbiWidget.save)
						return self.cbiWidget.save();

					var val = self.rawValue;

					if (!self.isList && angular.isArray(val))
						val = val.length ? val.join(' ') : undefined;

					if (angular.equals(val, self.uciValue))
						return false;

					l2uci.set(self.uciPackageName, self.uciSectionName,
					          self.uciOptionName, val);

					return true;
				},

				formValue: function(newValue) {
					if (arguments.length && !angular.equals(newValue, self.rawValue)) {
						self.rawValue = newValue;
						self.validate();
					}

					return self.rawValue;
				},

				textValue: function() {
					return self.cbiWidget ? self.cbiWidget.textValue() : self.formValue();
				}
			});
		}],

		replace: true,
		template: function(tElem, tAttr) {
			return '' +
				'<div ng-show="!Option.isUnsatisified" class="l2-field form-group" ng-class="{\'l2-form-error\':Option.errorMsg}">' +
					'<label class="col-lg-2 control-label" for="{{Option.id}}">{{Option.title}}</label>' +
					'<div class="l2-field-widget col-lg-5" ng-class="{\'has-error\':Option.errorMsg}">' +
						tElem.html() +
						'<div ng-if="Option.errorMsg" class="label label-danger">{{Option.errorMsg}}</div>' +
					'</div>' +
					'<div class="col-lg-5">{{Option.description}}</div>' +
				'</div>';
		},

		require: ['cbiOption', '^cbiSection', '^cbiMap'],
		compile: function(tElem, tAttr, linker) {
			var CBI_OPTION_MATCH  = /^(?:([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)$/;

			return function($scope, iElem, iAttr, ctrls) {
				console.log("Option link");
				var isRequired = false,
					validationFn = null;

				if (iAttr.validate && /^(?:(require|optional)\s+)?(.+)$/.test(iAttr.validate)) {
					isRequired = (RegExp.$1 === '' || RegExp.$1 === 'require');
					validationFn = l2validation.compile(RegExp.$2);
				}
				var cbiOptionCtrl = ctrls[0],
					cbiSectionCtrl = ctrls[1],
					cbiMapCtrl = ctrls[2];

				if (!CBI_OPTION_MATCH.test(iAttr.cbiOption))
					throw 'Invalid UCI selector';

				var uciPackage = (RegExp.$1 !== '') ? RegExp.$1 : cbiSectionCtrl.uciPackageName,
					uciSection = (RegExp.$2 !== '') ? RegExp.$2 : $scope.uciSectionName,
					uciOption = RegExp.$3,
					dependencies = [ ],
					name = iAttr.hasOwnProperty('name') ? iAttr.name : uciOption,
					id = '%s.%s.%s'.format(uciPackage, uciSection, name);

				if (iAttr.hasOwnProperty('depends')) {
					var deps;

					if (/^\s*[\{\['"]/.test(iAttr.depends)) {
						deps = $parse(iAttr.depends)($scope);

						if (angular.isArray(deps)) {
							for (var i = 0, dep; dep = deps[i]; i++) {
								if (angular.isObject(dep)) {
									dependencies.push(dep);
								}
								else if (angular.isString(dep)) {
									var d = { }; d[dep] = true;
									dependencies.push(dep);
								}
							}
						}
						else if (angular.isObject(deps)) {
							console.debug(deps);
							dependencies.push(deps);
						}
						else if (angular.isString(deps)) {
							var d = { }; d[deps] = true;
							dependencies.push(d);
						}
					}
					else {
						deps = angular.toArray(iAttr.depends);

						for (var i = 0, dep; dep = deps[i]; i++) {
							var d = { }; d[dep] = true;
							dependencies.push(d);
						}
					}
				}

				cbiSectionCtrl.addOption(angular.extend(cbiOptionCtrl, {
					id:              id,
					name:            name,

					title:           iAttr.title || RegExp.$3,
					placeholder:     iAttr.placeholder,
					description:     iAttr.description,

					isList:          iAttr.hasOwnProperty('list'),
					isPreview:       iAttr.hasOwnProperty('preview'),
					isRequired:      isRequired,
					validationFn:    validationFn,

					waitFn:          iAttr.hasOwnProperty('waitfor') ? $parse(iAttr.waitfor) : null,

					dependencies:    dependencies,

					uciPackageName:  uciPackage,
					uciSectionName:  uciSection,
					uciOptionName:   uciOption,

					cbiOwnerMap:     cbiMapCtrl,
					cbiOwnerSection: cbiSectionCtrl
				}));

				//continue init after config loaded
				cbiMapCtrl.loadConfig(cbiOptionCtrl.uciPackageName,cbiOptionCtrl.init.bind(cbiOptionCtrl, iElem));
			};
		}
	};
}]);

L2.registerDirective('cbiFlag', [function() {
	return {
		restrict: 'AE',
		scope: true,

		controllerAs: 'Flag',
		controller: ['gettext', function(gettext) {
			var self = angular.extend(this, {
				checked: function(set) {
					var val;

					if (arguments.length) {
						if (set)
							val = self.defaultOn ? undefined : self.onValue;
						else
							val = self.defaultOn ? self.offValue : undefined;

						self.cbiOwnerOption.formValue(val);
					}
					else {
						val = self.cbiOwnerOption.formValue();
					}

					return ((val === undefined && self.defaultOn) ||
							(val === self.onValue));
				},

				textValue: function() {
					return self.checked() ? gettext('yes') : gettext('no');
				}
			});
		}],

		replace: true,
		template: '<div class="checkbox"><input id="{{Option.id}}" ng-model="Flag.checked" ng-model-options="{getterSetter:true}" type="checkbox"></div>',

		require: ['cbiFlag', '^cbiOption'],
		link: function($scope, iElem, iAttr, ctrls) {
			var cbiFlagCtrl = ctrls[0],
				cbiOptionCtrl = ctrls[1];

			cbiOptionCtrl.cbiWidget = angular.extend(cbiFlagCtrl, {
				onValue: iAttr.hasOwnProperty('on') ? iAttr.on : '1',
				offValue: iAttr.hasOwnProperty('off') ? iAttr.off : '0',
				defaultOn: iAttr.hasOwnProperty('defaultOn'),
				cbiOwnerOption: cbiOptionCtrl
			});
		}
	};
}]);

L2.registerDirective('cbiInput', [function() {
	return {
		restrict: 'AE',
		replace: true,
		template: '<input id="{{Option.id}}" ng-model="Option.formValue" ng-model-options="{getterSetter:true}" class="form-control" type="text" ng-attr-placeholder="{{Option.placeholder}}">'
	};
}]);

L2.registerDirective('cbiSelect', ['$parse', function($parse) {
	return {
		restrict: 'AE',
		scope: true,

		controllerAs: 'Select',
		controller: [function() {
			var self = angular.extend(this, {
				textValue: function() {
					var o = self.selectElem.options,
					    i = self.selectElem.selectedIndex;

					return o[i].text;
				}
			});
		}],

		replace: true,
		template: function(tAttr, tElem) {
			return '<select id="{{Option.id}}" class="form-control" ng-model="Option.formValue" ng-model-options="{getterSetter:true}"></select>';
		},

		require: ['cbiSelect', '^cbiOption'],
		link: function($scope, iElem, iAttr, ctrls) {
			var cbiSelectCtrl = ctrls[0],
				cbiOptionCtrl = ctrls[1];

			cbiOptionCtrl.cbiWidget = angular.extend(cbiSelectCtrl, {
				selectElem: iElem[0],
				cbiOwnerOption: cbiOptionCtrl
			});
		}
	};
}]);

L2.registerDirective('cbiDeviceList', ['gettext', 'l2network', function(gettext, l2network) {
	return {
		restrict: 'AE',
		scope: { },

		require: ['cbiDeviceList', '^cbiOption', '^cbiSection', '^cbiMap'],
		controllerAs: 'DeviceList',
		controller: ['$scope', function($scope) {
			var self = angular.extend(this, {
				checked: { },
				devices: [ ],

				isUnspecified: function() {
					return angular.isEmptyObject(self.checked);
				},

				isUsableDevice: function(device) {
					if (device.isBridge() && !self.allowBridges)
						return false;

					if (!device.isBridgeable() && self.allowMultiple)
						return false;

					return true;
				},

				init: function(iElem) {
					self.caption = iElem.find('.caption');
					self.cbiOwnerMap.waitfor(l2network.load()/*.then(self.finish)*/); //().then(self.load));
				},

				finish: function() {
					console.debug('Network loaded...');

					l2network.loadDevicesCallback();
					l2network.loadInterfacesCallback();

					var devnames = angular.toArray(self.cbiOwnerOption.uciValue),
					    network = l2network.getInterface(self.cbiOwnerOption.uciSectionName);

					self.reload();

					for (var i = 0, dev; dev = self.devices[i]; i++) {
						if (dev.isInNetwork(network)) {
							self.checked[dev.name()] = true;
							if (!self.allowMultiple)
								break;
						}
					}

					self.redraw();
				},

				reload: function() {
					var devices = l2network.getDevices();
					self.devices.length = 0;
					for (var i = 0, dev; dev = devices[i]; i++)
						if (self.isUsableDevice(dev))
							self.devices.push(dev);
				},

				redraw: function() {
					var s = '';

					for (var i = 0, dev; dev = self.devices[i]; i++)
					{
						if (!self.checked[dev.name()])
							continue;

						if (s)
							s += ' <span class="sep">|</span> ';

						s += '<span title="%h (%h)"><img src="%s"> %h</span>'.format(
							dev.description(), dev.name() || '?',
							dev.icon(),
							dev.name()
						);
					}

					if (!s)
						s += '<em>%s</em>'.format(gettext('unspecified'));

					s += ' <span class="caret"></span>';

					self.caption.html(s);
				},

				select: function($event) {
					var $entry = angular.element($event.target).findParent('[value]'),
						devName = $entry.attr('value');

					if (self.allowMultiple) {
						if (self.checked[devName])
							delete self.checked[devName];
						else
							self.checked[devName] = true;
					}
					else {
						for (var key in self.checked)
							if (self.checked.hasOwnProperty(key))
								delete self.checked[key];

						if (devName.length)
							self.checked[devName] = true;
					}

					$event.target.blur();

					self.redraw();
				},

				keydown: function($event) {
					if ($event.which != 10 && $event.which != 13)
						return;

					var ifnames = angular.toArray($event.target.value);

					if (ifnames.length) {
						l2network.createDevice(ifnames[0]);
						self.reload();

						if (!self.allowMultiple) {
							for (var key in self.checked)
								if (self.checked.hasOwnProperty(key))
									delete self.checked[key];
						}

						self.checked[ifnames[0]] = true;
					}

					if (!self.allowMultiple)
						self.isOpen = false;

					$event.target.value = '';

					self.redraw();
				},

				blur: function($event) {
					$event.which = 10;
					self.keydown($event);
				},

				toggled: function(opened) {
					if (opened)
						self.reload();
				},

				save: function() {
					var devnames = angular.toArray(self.checked);

					if (!self.allowMultiple && devnames.length > 1)
						devnames.length = 1;

					l2network.loadDevicesCallback();
					l2network.loadInterfacesCallback();
					l2network.getInterface(self.cbiOwnerOption.uciSectionName)
						.setDevices(devnames);

					return true;
				},

				textValue: function() {
					return angular.toArray(self.cbiOwnerOption.formValue()).join(', ');
				}
			});
		}],

		replace: true,
		template: '' +
			'<div dropdown is-open="DeviceList.isOpen" on-toggle="DeviceList.toggled(open)" auto-close="{{ DeviceList.allowMultiple ? \'outsideClick\' : \'always\' }}">' +
				'<button class="btn btn-default dropdown-toggle" type="button" dropdown-toggle>' +
					'<div class="caption"><em translate>Loading…</em></div>' +
				'</button>' +
				'<ul class="dropdown-menu">' +
					'<li ng-repeat="dev in DeviceList.devices" value="{{dev.name()}}" ng-class="{selected: DeviceList.checked[dev.name()]}">' +
						'<a href="#" ng-click="DeviceList.select($event); $event.preventDefault()"><img ng-src="{{dev.icon()}}"> {{dev.name()}}</a>' +
					'</li>' +
					'<li ng-if="!DeviceList.allowMultiple" ng-class="{selected: DeviceList.isUnspecified()}" value="">' +
						'<a href="#" ng-click="DeviceList.select($event); $event.preventDefault()"><em>unspecified</em></a>' +
					'</li>'  +
					'<li class="divider"></li>' +
					'<li><form class="form-inline">' +
						'<input class="form-control input-sm" type="text" placeholder="{{\'Custom device …\' | translate}}" ' +
							'ng-click="$event.stopPropagation()" ' +
							'ng-keydown="DeviceList.keydown($event)" ' +
							'ng-blur="DeviceList.blur($event)">' +
					'</form></li>' +
				'</ul>' +
			'</div>',

		link: function($scope, iElem, iAttr, ctrls) {
			var cbiDeviceListCtrl = ctrls[0],
				cbiOptionCtrl = ctrls[1],
				cbiSectionCtrl = ctrls[2],
				cbiMapCtrl = ctrls[3];

			cbiOptionCtrl.cbiWidget = angular.extend(cbiDeviceListCtrl, {
				allowBridges: iAttr.hasOwnProperty('bridges'),
				allowMultiple: iAttr.hasOwnProperty('multiple'),

				cbiOwnerOption: cbiOptionCtrl,
				cbiOwnerSection: cbiSectionCtrl,
				cbiOwnerMap: cbiMapCtrl
			});

			cbiDeviceListCtrl.init(iElem);
		}
	};
}]);

L2.registerDirective('cbiNetworkList', ['gettext', 'l2network', function(gettext, l2network) {
	return {
		restrict: 'AE',
		scope: { },

		require: ['cbiNetworkList', '^cbiOption', '^cbiSection', '^cbiMap'],
		controllerAs: 'NetworkList',
		controller: ['$scope', function($scope) {
			var self = angular.extend(this, {
				checked: { },
				interfaces: [ ],

				isUnspecified: function() {
					return angular.isEmptyObject(self.checked);
				},

				isUsableInterface: function(ifc) {
					return true;
				},

				init: function(iElem) {
					self.caption = iElem.find('.caption');
					self.cbiOwnerMap.waitfor(l2network.load());
				},

				finish: function() {
					console.debug('Network loaded...');

					l2network.loadDevicesCallback();
					l2network.loadInterfacesCallback();

					var ifcnames = angular.toArray(self.cbiOwnerOption.uciValue),
					    selected = angular.toObject(ifcnames);

					self.reload();

					for (var i = 0, ifc; ifc = self.interfaces[i]; i++) {
						if (selected[ifc.name()]) {
							self.checked[ifc.name()] = true;
							if (!self.allowMultiple)
								break;
						}
					}

					self.redraw();
				},

				reload: function() {
					var interfaces = l2network.getInterfaces();
					self.interfaces.length = 0;
					for (var i = 0, ifc; ifc = interfaces[i]; i++)
						if (self.isUsableInterface(ifc))
							self.interfaces.push(ifc);
				},

				redraw: function() {
					var s = '';

					for (var i = 0, ifc; ifc = self.interfaces[i]; i++)
					{
						if (!self.checked[ifc.name()])
							continue;

						if (s)
							s += ' <span class="sep">|</span> ';

						s += '<span title="%h"><img src="%s"> %h</span>'.format(
							ifc.name(),
							ifc.icon(),
							ifc.name()
						);
					}

					if (!s)
						s += '<em>%s</em>'.format(gettext('unspecified'));

					s += ' <span class="caret"></span>';

					self.caption.html(s);
					self.cbiOwnerOption.formValue(angular.toArray(self.checked));
				},

				select: function($event) {
					var $entry = angular.element($event.target).findParent('[value]'),
						ifcName = $entry.attr('value');

					if (self.allowMultiple) {
						if (self.checked[ifcName])
							delete self.checked[ifcName];
						else
							self.checked[ifcName] = true;
					}
					else {
						for (var key in self.checked)
							if (self.checked.hasOwnProperty(key))
								delete self.checked[key];

						if (ifcName.length)
							self.checked[ifcName] = true;
					}

					if (!self.allowMultiple)
						self.isOpen = false;

					self.redraw();
				},

				toggled: function(opened) {
					if (opened)
						self.reload();
				},

				textValue: function() {
					return angular.toArray(self.cbiOwnerOption.formValue()).join(', ');
				}
			});
		}],

		replace: true,
		template: '' +
			'<div dropdown is-open="NetworkList.isOpen" on-toggle="NetworkList.toggled(open)" auto-close="{{ NetworkList.allowMultiple ? \'outsideClick\' : \'always\' }}">' +
				'<button class="btn btn-default dropdown-toggle" type="button" dropdown-toggle>' +
					'<div class="caption"><em translate>Loading…</em></div>' +
				'</button>' +
				'<ul class="dropdown-menu">' +
					'<li ng-repeat="ifc in NetworkList.interfaces" value="{{ifc.name()}}" ng-class="{selected: NetworkList.checked[ifc.name()]}">' +
						'<a href="#" ng-click="NetworkList.select($event); $event.preventDefault()"><img ng-src="{{ifc.icon()}}"> {{ifc.name()}}</a>' +
					'</li>' +
					'<li ng-if="!NetworkList.allowMultiple" ng-class="{selected: NetworkList.isUnspecified()}" value="">' +
						'<a href="#" ng-click="NetworkList.select($event); $event.preventDefault()"><em>unspecified</em></a>' +
					'</li>' +
				'</ul>' +
			'</div>',

		link: function($scope, iElem, iAttr, ctrls) {
			var cbiNetworkListCtrl = ctrls[0],
				cbiOptionCtrl = ctrls[1],
				cbiSectionCtrl = ctrls[2],
				cbiMapCtrl = ctrls[3];

			cbiOptionCtrl.cbiWidget = angular.extend(cbiNetworkListCtrl, {
				allowMultiple: iAttr.hasOwnProperty('multiple'),

				cbiOwnerOption: cbiOptionCtrl,
				cbiOwnerSection: cbiSectionCtrl,
				cbiOwnerMap: cbiMapCtrl
			});

			cbiNetworkListCtrl.init(iElem);
		}
	};
}]);
