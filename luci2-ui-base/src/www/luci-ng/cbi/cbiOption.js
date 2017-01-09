'use strict';

L2.registerDirective('cbiOption', function($parse, l2validation, gettext) {
	'ngInject';
	return {
		restrict: 'A',
		scope: true,
		transclude: true,

		controllerAs: 'Option',
		controller: function($scope, $q, l2uci) {
			'ngInject';
			var self = angular.extend(this, {
				rdepends: { },
				isUnsatisified: false,

				init: function(iElem) {
					self.tabInit(iElem);
					self.cbiOwnerMap.lock();

					var w = $q.when(self.waitFn ? self.waitFn($scope) : null);
					$q.all([w, self.cbiOwnerMap.load(self.uciPackageName)]).then(self.finish);
				},

				finish: function() {
					self.uciValue = l2uci.get(self.uciPackageName, self.uciSectionName, self.uciOptionName);
					self.rawValue = self.uciValue;

					for (var i = 0, dep; dep = self.dependencies[i]; i++) {
						for (var optName in dep) {
							var opt = self.cbiOwnerSection.getFieldByName(self.uciSectionName, optName);
							if (opt) {
								opt.rdepends[self.name] = self;
							}
						}
					}

					self.cbiOwnerMap.unlock();
				},

				tabInit: function(iElem) {
					var curPane, tabHeads, tabIndex;

					if (!(curPane = iElem.findParent('.tab-pane')[0]))
						return;

					tabHeads = curPane.parentNode.previousElementSibling.children,
					tabIndex = Array.prototype.indexOf.call(curPane.parentNode.children, curPane);

					self.tabHead = angular.element(tabHeads[tabIndex]).addClass('fade in');
					self.tabBadge = self.tabHead.findAll('.badge');

					if (!self.tabBadge[0]) {
						self.tabHead.children().append('&#160;<span class="badge"></span>');
						self.tabBadge = self.tabHead.findAll('.badge');
					}
				},

				tabFields: function() {
					if (!self.tabHead)
						return null;

					var allFields = self.cbiOwnerSection.fieldCtrls,
						tabFields = [];

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
					}					else {
						self.tabHead.removeClass('in');
					}
				},

				compare: function(a, b) {
					if (a === true) {
						return (angular.isDefined(b) &&
							((angular.isArray(b) && b.length > 0) ||
							(angular.isString(b) && b !== '')));
					}	else if (angular.isArray(a)) {
						return (a.indexOf(b) !== -1);
					}	else if (angular.isFunction(a)) {
						return a(b);
					} else {
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

					if ((angular.isUnefined(value) || value.length === 0) && self.isRequired)
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

				isAngularScope: function(value) {
					return (typeof(value) === 'object' &&
						value.constructor === $scope.constructor);
				},

				formValue: function(newValue) {
					if (arguments.length &&
							!self.isAngularScope(newValue) &&
							!angular.equals(newValue, self.rawValue)) {
						self.rawValue = newValue;
						self.validate();
					}

					return self.rawValue;
				},

				textValue: function() {
					return self.cbiWidget ? self.cbiWidget.textValue() : self.formValue();
				},
			});
		},

		replace: true,
		templateUrl: 'luci-ng/cbi/cbiOption.tmpl.html',

		require: ['cbiOption', '^cbiSection', '^cbiMap'],
		compile: function(tElem, tAttr, linker) {
			var CBI_OPTION_MATCH = /^(?:([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)$/;

			return function($scope, iElem, iAttr, ctrls) {
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
					throw new Error('Invalid UCI selector');

				var uciPackage = (RegExp.$1 !== '') ? RegExp.$1 : cbiSectionCtrl.uciPackageName,
					uciSection = (RegExp.$2 !== '') ? RegExp.$2 : $scope.uciSectionName,
					uciOption = RegExp.$3,
					dependencies = [],
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
								}								else if (angular.isString(dep)) {
									var d = { }; d[dep] = true;
									dependencies.push(dep);
								}
							}
						}						else if (angular.isObject(deps)) {
							dependencies.push(deps);
						}						else if (angular.isString(deps)) {
							var d = { }; d[deps] = true;
							dependencies.push(d);
						}
					}					else {
						deps = angular.toArray(iAttr.depends);

						for (var i = 0, dep; dep = deps[i]; i++) {
							var d = { }; d[dep] = true;
							dependencies.push(d);
						}
					}
				}

				cbiSectionCtrl.addOption(angular.extend(cbiOptionCtrl, {
					id: id,
					name: name,

					title: iAttr.title || RegExp.$3,
					placeholder: iAttr.placeholder,
					description: iAttr.description,

					isList: iAttr.hasOwnProperty('list'),
					isPreview: iAttr.hasOwnProperty('preview'),
					isRequired: isRequired,
					validationFn: validationFn,

					waitFn: iAttr.hasOwnProperty('waitfor') ? $parse(iAttr.waitfor) : null,

					dependencies: dependencies,

					uciPackageName: uciPackage,
					uciSectionName: uciSection,
					uciOptionName: uciOption,

					cbiOwnerMap: cbiMapCtrl,
					cbiOwnerSection: cbiSectionCtrl,
				}));

				cbiOptionCtrl.init(iElem);
			};
		},
	};
});

