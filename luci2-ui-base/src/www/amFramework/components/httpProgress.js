/**
 * @ngdoc directive
 * @name amfHttpProgress
 * @module amFramework
 *
 * @restrict E
 *
 * @description
 * `<amf-http-progress>` Shows a mdProgressLinear whenever an $http call is being made
 * Style can be controlled with `amf-http-progress` class
 *
 * It registers a http interceptor that triggers the spinner on each call.
 * It also exposes a companion factory `$amfHttpProgress` that can be used to enable/disable the annimation.
 * Alternative individual $http calls can be tagged with a truthy `ignoreHttpProgress` property in the
 * request config object, so that it doesn't trigger the animation.
 *
 */

angular.module('amFramework')
	.component('amfHttpProgress', {
		transclude: false,
		template: '<div class="amf-http-progress" style="z-index:95;"><md-progress-linear ' +
			               'class="md-hue-2" md-mode="indeterminate" ng-disabled="!$ctrl.show">' +
			           '</md-progress-linear></div>',
		controller: HttpProgressControler


	})
	.factory('$amfHttpProgress', httpProgressFactory)
	.config(function($httpProvider) {
		$httpProvider.interceptors.push(progressInterceptor);
	});

function HttpProgressControler($scope) {
	var self = this;

	self.show = false;

	self.$postLink = function postLink() {
		$scope.$on('amfHttpProgress.show', function() {
			self.show = true;
		});
		$scope.$on('amfHttpProgress.hide', function() {
			self.show = false;
		});
	};
}

function httpProgressFactory($rootScope) {
	// private vars
	var _state = {
		numPending: 0,
		enabled: true
	};

	var self = {
		enable: function() {
			_state.enabled=true;
			if (_state.numPending)
				$rootScope.$broadcast('amfHttpProgress.show');
		},
		disable: function() {
			_state.enabled=false;
			$rootScope.$broadcast('amfHttpProgress.hide');
		},
		state: function(newState) {
			var oldState = _state.enabled;
			if (typeof(newState)!='undefined') {
				if (newState)
					self.enable();
				else
					self.disable();
				return oldState;
			}
			return _state.enabled;
		},
		_state: _state
	};

	return self;
}

function progressInterceptor($rootScope, $amfHttpProgress) {
	return {
		request: function(config) {
			if ($amfHttpProgress._state.enabled && !config.ignoreHttpProgress) {
				config._httpProgress = true;
				$amfHttpProgress._state.numPending++;
				$rootScope.$broadcast('amfHttpProgress.show');
			}
			return config;
		},
		response: function(response) {
			if (response.config._httpProgress) {
				$amfHttpProgress._state.numPending--;
				if (!$amfHttpProgress._state.numPending) $rootScope.$broadcast('amfHttpProgress.hide');
			}

			return response;
		},
		responseError: function(response) {
			if (response.config._httpProgress) {
				$amfHttpProgress._state.numPending--;
				if (!$amfHttpProgress._state.numPending) $rootScope.$broadcast('amfHttpProgress.hide');
			}

			return response;
		}
	};
}
