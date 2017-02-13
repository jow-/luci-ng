'use strict';

angular
	.module('amFramework', ['ngMaterial', 'ngAnimate', 'ui.router', 'ngMessages'])
	.config(function($mdThemingProvider) {
		'ngInject';

		$mdThemingProvider.theme('default')
			.primaryPalette('blue-grey', { default: '600' })
			.accentPalette('teal', { default: '500' })
			.warnPalette('defaultPrimary')
			.backgroundPalette('grey', {
				'default': '50',
				'hue-1': '300'
			});

		$mdThemingProvider.definePalette('defaultPrimary', {
			'50': '#FFFFFF',
			'100': 'rgb(255, 198, 197)',
			'200': '#E75753',
			'300': '#E75753',
			'400': '#E75753',
			'500': '#E75753',
			'600': '#E75753',
			'700': '#E75753',
			'800': '#E75753',
			'900': '#E75753',
			'A100': '#E75753',
			'A200': '#E75753',
			'A400': '#E75753',
			'A700': '#E75753'
		});
	});
