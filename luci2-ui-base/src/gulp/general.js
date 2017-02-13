/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');
const path = require('path');
const del = require('del');
const $ = require('gulp-load-plugins')(); // load all gulp-* modules
const lazypipe = require('lazypipe');

// load configuration files
const conf = require('./conf.js');

// export Gulp tasks

exports.tasks = {
	clean: clean,
	download: downloadFiles,
	copyAssets: copyAssets,
	build: build
};


function clean(done) {
	del([conf.paths.dist, conf.paths.tmp, conf.paths.maps]);
	done();
}


function downloadFiles() {
	var urls = (conf.downloads && conf.downloads.length) ? conf.downloads : [];

	return $.download(urls)
		.pipe($.flatmap((stream, file)=> {
			var output = path.parse(file.history[file.history.length-1]).name;

			return stream.pipe($.decompress())
				.pipe($.rename((fileN) => {
					fileN.dirname = path.join(output, fileN.dirname);
				}));
		}))
		.pipe(gulp.dest(conf.wiredep.directory));
}

function copyAssets() {
	return gulp.src(conf.path.assets('src', ''), { base: conf.paths.src })
		.pipe(gulp.dest(conf.paths.dist));
}

function build() {
	return gulp.src(conf.path.mainHtml('tmp', ''))
		.pipe($.useref({}, lazypipe().pipe($.sourcemaps.init, { loadMaps: true })))
		.pipe($.if('*.js', $.uglify({ preserveComments: 'license' })))
		.pipe($.if('*.css', $.cssnano()))
		.pipe($.if('*.html', $.htmlmin()))
		.pipe($.sourcemaps.write(conf.path.maps('..', '')))
		.pipe(gulp.dest(conf.paths.dist));
}
