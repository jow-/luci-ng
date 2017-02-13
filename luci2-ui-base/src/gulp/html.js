/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')(); // load all gulp-* modules
const series = require('stream-series');

// load configuration files
const conf = require('./conf.js');


// export Gulp tasks

exports.tasks = {
	copyHtml: copyHtml,
	partials: partials,
	injectPartials: gulp.series(partials, injectPartials)
};


function copyHtml() {
	return gulp.src(conf.path.mainHtml('src', ''))
		.pipe(gulp.dest(conf.paths.tmp));
}


function partials() {
	var streams = [];

	for (var mod in conf.ngModules) {
		streams.push(gulp.src([conf.path.module[mod]('src', '**/*.tmpl.html')]
			                  .concat(conf.path.assets('!')))
			.pipe($.htmlmin({ collapseWhitespace: true }))
			.pipe($.angularTemplatecache(mod + '.tmpl.js', {
				module: mod,
				root: conf.ngModules[mod].path
			})));
	}

	return series(streams)
		.pipe($.insert.wrap(conf.closure.pre, conf.closure.post))
		.pipe(gulp.dest(conf.paths.tmp));
}

function injectPartials() {
	var tmpl = gulp.src(conf.path.tmp('*.tmpl.js'), { read: false });

	return gulp.src(conf.path.mainHtml('tmp', ''))
		.pipe($.inject(tmpl, { name: 'partials', relative:  true }))
		.pipe(gulp.dest(conf.paths.tmp));
}
