'use strict';

angular.module('LuCI2').directive('cbiMap', function($timeout, $parse, l2uci) {
	return {
		restrict: 'A',
		scope: true,
		transclude: true,

		controllerAs: 'Map',
		controller: function($scope, $q) {
			var self = angular.extend(this, {
				get: l2uci.get,
				set: l2uci.set,

				lockCount: 0,

				cbiChildSections: [],

				init: function() {
					self.lock();

					var w = $q.when(self.waitFn ? self.waitFn($scope) : null);
					$q.all([w, self.load(self.uciPackageName)]).then(self.finish);
				},

				load: function(uciPackageName) {
					self.uciPackages[uciPackageName] = true;
					return l2uci.load(uciPackageName);
				},

				lock: function() {
					self.lockCount++;
				},

				unlock: function() {
					if (self.lockCount > 0)
						self.lockCount--;

					if (self.lockCount == 0)
						self.validate();
				},

				validate: function() {
					for (var i = 0; i < self.cbiChildSections.length; i++)
						self.cbiChildSections[i].validate();
				},

				finish: function() {
					self.unlock();
				},

				save: function($event) {
					$event.currentTarget.blur();

					self.lock();

					for (var i = 0, sec; (sec = self.cbiChildSections[i]); i++) {
						sec.save();
						sec.reset();
					}

					l2uci.save().then(self.read);
				},

				resetSections: function() {
					for (var i = 0, sec; (sec = self.cbiChildSections[i]); i++)
						sec.reset();

					self.unlock();
				},

				reset: function($event) {
					$event.currentTarget.blur();

					self.lock();

					var uciPackageNames = angular.toArray(self.uciPackages);

					l2uci.unload(uciPackageNames);
					l2uci.load(uciPackageNames).then(self.resetSections);
				},

				apply: function($event) {
					$event.currentTarget.blur();

					l2uci.apply(10);
				}
			});
		},

		replace: true,
		templateUrl: 'luci-ng/cbi/cbiMap.tmpl.html',

		require: 'cbiMap',
		link: function($scope, iElem, iAttr, cbiMapCtrl) {
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
});

