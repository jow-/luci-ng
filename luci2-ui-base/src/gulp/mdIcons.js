/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');
const path = require('path');
const del = require('del');
const $ = require('gulp-load-plugins')(); // load all gulp-* modules

// load configuration files
const conf = require('./conf.js');


// export Gulp tasks

exports.tasks = {
	svg: gulp.series(svgExtractIcons, svgIconset),
	svgExtract: svgExtractIcons
};


function svgIconset() {
	var icons = require(conf.path.tmp('..', 'svgIcons.json'));
	var paths = [];
	for (var icon in icons) {
		if (icons[icon])
			paths.push(path.join(conf.wiredep.directory, 'MaterialDesignIconsDesign/svg/', icon + '.svg'));
	}
	return gulp.src(paths)
		.pipe($.svgmin())
		.pipe($.cheerio({
			run: function(sel) {
				sel('[fill]').removeAttr('fill');
			},
			parserOptions: { xmlMode: true }
		}))
		.pipe($.svgNgmaterial({ filename : 'iconset.svg', contentTransform: '<g/>' }))
		.pipe(gulp.dest(conf.path.iconset('tmp', '')))
		.pipe(gulp.dest(conf.path.iconset('dist', '')));
}

function svgExtractIcons() {
	del(conf.path.tmp('svgIcons.json'));

	return gulp.src([conf.path.src('**/*.html'), conf.path.src('**/*.js')])
		.pipe($.search(/md-svg-icon\s*=\s*["']([^"'{]*)["']/g, function(item) {
			var group=item.match(/md-svg-icon\s*=\s*["']([^"']*)["']/);
			var res = {};
			res[group.length > 1 ? group[1] :  item] = true;
			return res;
		}, {
			path: conf.paths.tmp,
			filename: 'svgIcons.json'
		}))
		.pipe($.search(/svgIcon\s*[:=]\s*["']([^"'{]*)["']/g, function(item) {
			var group=item.match(/svgIcon\s*[:=]\s*["']([^"']*)["']/);
			var res = {};
			res[group.length > 1 ? group[1] :  item] = true;
			return res;
		}, {
			path: conf.paths.tmp,
			filename: 'svgIcons.json'
		}));
}
