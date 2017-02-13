/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');
const path = require('path');
const $ = require('gulp-load-plugins')(); // load all gulp-* modules

// load configuration files
const conf = require('./conf.js');


// export Gulp tasks

exports.tasks = {
	translatePot: translatePot,
	translateJson: translateJson
};


function translatePot() {
	return gulp.src([path.join(conf.paths.src, '**/*.html'), path.join(conf.paths.src, '**/*.js')])
		.pipe($.angularGettext.extract('template.pot', {}))
		.pipe(gulp.dest(path.join(conf.paths.tmp, 'po')));
}

function translateJson() {
	return gulp.src(path.join(conf.paths.src, 'po/**/*.po'))
		.pipe($.angularGettext.compile({ format: 'json' }))
		.pipe(gulp.dest(path.join(conf.paths.dist, 'translations/')));
}
