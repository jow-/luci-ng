/* eslint-env node, es6 */

'use strict';

const path = require('path');
const pkg = require('../package.json');

var conf = {
	paths: {
		src: 'www',
		dist: 'dist',
		tmp: '.tmp',
		maps: '.maps',
		mainHtml: 'luci-ng.html',
		iconset: 'luci-ng/icons/svg'
	},

	ngModules: {
		LuCI2: {
			path: 'luci-ng',
			assets: ['view/**/*', 'controller/**/*', 'icons/**/*', 'proto/**/*']
		},
		amFramework: { path: 'amFramework' }
	},

	proxy: 'http://lede.lan/ubus',

	wiredep: { directory: 'bower_components' },

	material: {
		basePath: 'node_modules/angular-material/modules/js',
		modules: ['core', 'backdrop', 'button', 'checkbox', 'dialog', 'icon', 'input', 'menu',
		          'progressLinear', 'select', 'sidenav', 'switch', 'tabs']

	},

	downloads: ['https://cdn.materialdesignicons.com/1.8.36/MaterialDesignIconsDesign.zip'],

	closure: {
		pre: '(function(window, angular, undefined) {\n\'use strict\';\n\n',
		post: '})(window, window.angular);\n'
	},

	banner: '/*!\n * ' + pkg.name + '\n * ' + pkg.repository +
	        '\n * @license ' + pkg.license + '\n * v' + pkg.version + '\n */\n'
};

module.exports = conf;

// helper functions to construct paths
conf.path = pathHelper(conf.paths);
conf.path.module = pathHelper(conf.ngModules);

conf.path.assets= function(exclude, prepend, append) {
	var paths = [];
	var opt = parseParams(exclude, prepend, append);

	for (var mod in conf.ngModules)
		if (conf.ngModules[mod].assets)
			conf.ngModules[mod].assets.forEach((glob) => {
				paths.push(opt.exc + path.join(opt.pre, conf.ngModules[mod].path, glob, opt.post));
			});
	return paths;
};

conf.path.modules = function(exclude, prepend, append) {
	var paths = [];
	var opt = parseParams(exclude, prepend, append);

	for (var mod in conf.ngModules)
		paths.push(opt.exc + path.join(opt.pre, conf.ngModules[mod].path, opt.post));

	return paths;
};

function pathHelper(obj) {
	var res = {};
	for (var p in obj)
		res[p] = createPath(p);

	return res;

	function createPath(prop) {
		return function(exclude, prepend, append) {
			var opt = parseParams(exclude, prepend, append);
			return opt.exc + path.join(opt.pre, obj[prop].path || obj[prop], opt.post);
		};
	}
}

function parseParams(exclude, prepend, append) {
	var opt = {
		exc: '',
		pre: '',
		post: ''
	};
	if (exclude == '!') {
		opt.exc = '!';
		if (typeof(append)=='undefined') // only two param, assume eclude - post
			opt.post = getPaths(prepend) || '';
		else { // all trhee params
			opt.pre = getPaths(prepend) || '';
			opt.post = getPaths(append);
		}
	}	else { // assume two params pre, post
		if (typeof(prepend)=='undefined') // only one param, assume post
			opt.post = getPaths(exclude) || '';
		else { // two param, assume pre - post
			opt.pre = getPaths(exclude) || '';
			opt.post = getPaths(prepend);
		}
	}
	return opt;
}

function getPaths(prop) {
	if (module.exports.paths.hasOwnProperty(prop))
		return module.exports.paths[prop];
	return prop;
}
