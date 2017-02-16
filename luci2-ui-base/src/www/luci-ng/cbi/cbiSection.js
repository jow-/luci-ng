/* eslint no-mixed-spaces-and-tabs:0 */
/* eslint max-len:0 */

'use strict';

angular.module('LuCI2').directive('cbiSection', function($timeout, $parse, gettext, l2validation) {
	return {
		restrict: 'A',
		scope: true,
		transclude: false,

		controllerAs: 'Section',
		controller: function($scope, $q, l2uci) {
			var self = angular.extend(this, {
				uciSections: [],

				fieldCtrls: { },
				fieldErrors: { },

				read: function() {
					var s;
					self.uciSections.length = 0;

					if (self.uciSectionName) {
						s = l2uci.get(self.uciPackageName, self.uciSectionName);
						if (s && self.filter(s)) {
							self.uciSections.push(s['.name']);
							self.uciSectionType = s['.type'];
						}
					} else if (self.uciSectionType) {
						var sl = l2uci.sections(self.uciPackageName, self.uciSectionType);
						for (var i = 0; (s = sl[i]); i++)
							if (angular.isUndefined(self.uciSectionIndex) ||
							    self.uciSectionIndex === i)
								if (self.filter(s))
									self.uciSections.push(s['.name']);
					}

					self.finish();
				},

				init: function() {
					self.cbiOwnerMap.lock();

					var w = $q.when(self.waitFn ? self.waitFn($scope) : null);
					$q.all([w, self.cbiOwnerMap.load(self.uciPackageName)]).then(self.read);

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

				finish: function() {
					if (self.isCollapse &&
							self.uciSections.indexOf(self.activeSectionName) === -1)
						self.activeSectionName = self.uciSections[0];

					self.cbiOwnerMap.unlock();
				},

				open: function(uciSectionName) {
					if (uciSectionName) {
						self.validate();
						self.activeSectionName = uciSectionName;
					}
				},

				add: function() {
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

				remove: function(sid) {
					var idx = self.uciSections.indexOf(sid);

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

				sort: function(sid1, dir) {
					var idx=self.uciSections.indexOf(sid1);
					if (idx < 0) return;

					idx = idx + (dir > 0 ? 1 : -1);
					if (idx < 0 || idx >= self.uciSections.length ) return;

					var sid2=self.uciSections[idx];

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
					self.uciSections.length = 0;
					$timeout(self.init, 0, true);
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
					var fields = [];

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
		},

		replace: true,
		// templateUrl: 'luci-ng/cbi/cbiSection.tmpl.html',

		template: function(tElem, tAttr) {
 			return '' +
 				'<div class="panel panel-default">' +
 					'<div ng-if="Section.title" class="panel-heading"><h3 class="panel-title">{{Section.title}}</h3></div>' +
 					'<ul class="l2-section-group list-group">' +
 						'<li ng-if="!Section.uciSections.length" class="list-group-item text-muted">{{Section.placeholder}}</li>' +
 						'<li class="l2-section-item list-group-item form-horizontal animate-repeat" ng-repeat="uciSectionName in Section.uciSections" cbi-section-id="{{uciSectionName}}">' +
 							'<div ng-if="Section.isCollapse || Section.isSortable || Section.isAddRemove" class="l2-section-header">' +
 								'<div ng-if="Section.isCollapse && (Section.activeSectionName !== uciSectionName)" ng-click="Section.open(uciSectionName)" class="l2-section-teaser well well-sm">' +
 									'<span ng-if="Section.fieldErrors[uciSectionName]" class="badge">{{Section.fieldErrors[uciSectionName]}}</span>' +
 									'<span ng-repeat="Option in Section.teaserFields(uciSectionName)" ng-init="textValue = Option.textValue()">' +
 										'<span ng-style="Option.isInvalid ? {color:\'#d9534f\'} : {}">' +
 											'{{Option.title}}: <strong>{{Option.textValue() || \'-\'}}</strong>' +
 										'</span>' +
 										'<span ng-if="!$last"> | </span>' +
 									'</span>' +
 								'</div>' +
 								'<div ng-if="Section.isSortable || Section.isAddRemove" class="btn-group">' +
 									'<button ng-if="Section.isSortable && !$first" type="button" title="{{\'Move up\' | translate}}" ng-click="Section.sort(uciSectionName, -1)" class="btn btn-info up">↑</button>' +
 									'<button ng-if="Section.isSortable && !$last" type="button" title="{{\'Move down\' | translate}}" ng-click="Section.sort(uciSectionName, 1)" class="btn btn-info down">↓</button>' +
 									'<button ng-if="Section.isAddRemove" type="button" title="{{Section.removeTitle}}" ng-click="Section.remove(uciSectionName)" class="btn btn-danger">{{Section.removeCaption}}</button>' +
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
		link: function($scope, iElem, iAttr, ctrls) {
			var cbiSectionCtrl = ctrls[0],
				cbiMapCtrl = ctrls[1];

			var CBI_SECTION_MATCH =
					/^(?:([a-zA-Z0-9_-]+)\.)?(?:@([a-zA-Z0-9_-]+)(?:\[(\d+)\])?|([a-zA-Z0-9_]+))$/;

			if (!CBI_SECTION_MATCH.test(iAttr.cbiSection))
				throw new Error('Invalid UCI selector');

			var uciPackageName = (RegExp.$1 !== '') ? RegExp.$1 : cbiMapCtrl.uciPackageName,
				uciSectionType = (RegExp.$2 !== '') ? RegExp.$2 : undefined,
				uciSectionIndex = (RegExp.$3 !== '') ? parseInt(RegExp.$3, 10) : undefined,
				uciSectionName = (RegExp.$4 !== '') ? RegExp.$4 : undefined;

			cbiMapCtrl.cbiChildSections.push(angular.extend(cbiSectionCtrl, {
				title: iAttr.title,
				placeholder: iAttr.placeholder || gettext('There are no entries defined yet.'),

				addTitle: iAttr.addTitle || gettext('Add new section'),
				addCaption: iAttr.addCaption || gettext('Add…'),
				addPlaceholder: iAttr.addPlaceholder || gettext('New section name'),

				removeTitle: iAttr.removeTitle || gettext('Remove this section'),
				removeCaption: iAttr.removeCaption || gettext('Remove'),

				isSortable: iAttr.hasOwnProperty('sortable'),
				isAnonymous: iAttr.hasOwnProperty('anonymous'),
				isAddRemove: iAttr.hasOwnProperty('addremove'),
				isCollapse: iAttr.hasOwnProperty('collapse'),

				addFn: iAttr.hasOwnProperty('onadd') ? $parse(iAttr.onadd) : null,
				removeFn: iAttr.hasOwnProperty('onremove') ? $parse(iAttr.onremove) : null,

				filterFn: iAttr.hasOwnProperty('filter') ? $parse(iAttr.filter) : null,
				waitFn: iAttr.hasOwnProperty('waitfor') ? $parse(iAttr.waitfor) : null,

				uciPackageName: uciPackageName,
				uciSectionType: uciSectionType,
				uciSectionIndex: uciSectionIndex,
				uciSectionName: uciSectionName,

				cbiOwnerMap: cbiMapCtrl
			}));

			cbiSectionCtrl.init(iElem);
		}
	};
});

