/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')(); // load all gulp-* modules
const browserSync = require('./browsersync.js').browserSync;

// load configuration files
const conf = require('./conf.js');


// export Gulp tasks

exports.tasks = {
	injectCss: gulp.series(autoprefixCss, injectCss),
	autoprefixCss: autoprefixCss
};


function autoprefixCss() {
	return gulp.src([conf.path.src('**/*.css')].concat(conf.path.assets('!')))
		.pipe($.autoprefixer())
		.pipe(gulp.dest(conf.paths.tmp))
		.pipe(browserSync.stream());
}

function injectCss() {
	var css = gulp.src([conf.path.tmp('**/*.css')].concat(conf.path.assets('!')),
					   { read: false });

	return gulp.src(conf.path.mainHtml('tmp', ''))
		.pipe($.inject(css, { relative: true }))
		.pipe(gulp.dest(conf.paths.tmp));
}
