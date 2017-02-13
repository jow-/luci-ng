/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync').create('server1');
const proxy = require('http-proxy-middleware');

// load configuration files
const conf = require('./conf.js');


// export Gulp tasks

exports.tasks = {
	serveDev: gulp.parallel(watch, serve()),
	serveDist: serve('dist')
};

exports.browserSync = browserSync;

function serve(mode) {
	return function serveDev(done) {
		browserSync.init({
			server: {
				baseDir: mode == 'dist' ? [conf.paths.dist] : [conf.paths.tmp, conf.paths.src],
				index: conf.paths.mainHtml,
				routes: {
					'/bower_components': 'bower_components',
					'/node_modules': 'node_modules',
					'/.tmp': '.tmp',
					'/.maps': '.maps'
				},
				middleware: conf.proxy ? proxy(conf.proxy) : undefined
			},
			open: false
		});
		done();
	};
}

function watch(done) {
	gulp.watch([conf.path.mainHtml('src', ''),
		'bower.json',
		conf.path.src('**/*.js')], gulp.series('inject', reloadBrowserSync));
	gulp.watch(conf.path.src('**/*.html'), reloadBrowserSync);
	gulp.watch(conf.path.src('**/*.css'), gulp.series('autoprefixCss'));

	done();
}

function reloadBrowserSync(done) {
	browserSync.reload();
	done();
}

