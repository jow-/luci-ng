'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const path = require('path');
const del = require('del');
const proxy = require('http-proxy-middleware');
const $ = require('gulp-load-plugins')(); //load all gulp-* modules

// load configuration files
const pkg = require('./package.json');
const conf = require('./gulp.json');


// clean: clean output & tmp directory
gulp.task('clean', (done) => {
	del([conf.paths.dist, conf.paths.tmp]);
	done();
});

// build: trivial copy (stub)
gulp.task('build', (done) => {
	gulp.src(['www/**/*'])
	.pipe(gulp.dest('dist'));
	done();
});

// serve: web server with proxy, for development
gulp.task('serve', () => {
		browserSync.init({
			server: {
				baseDir: ['www'],
				index: 'luci-ng.html',
				middleware: proxy('http://lede.lan/ubus')
			},
			open: true
		});
});

// lint: lint js files
gulp.task('lint', () => {
	return gulp.src(path.join(conf.paths.src, '**/*.js'))
		.pipe($.eslint())
		.pipe($.eslint.format());
});

// js: concatenate & minify .js
gulp.task('js', () => {
	return gulp.src([path.join(conf.paths.src, conf.paths.app, '*.js')])
		.pipe($.sourcemaps.init())
		.pipe($.header('/** ${file.relative} **/\n'))
		.pipe($.concat(conf.ngModule + ".js"))
		.pipe($.ngAnnotate({
			remove: true,
			add: true,
			single_quotes: true
		}))
		//.pipe($.sourcemaps.write('maps'))
		.pipe(gulp.dest(conf.paths.dist))
		.pipe(gulp.dest(conf.paths.tmp))
		//.pipe($.filter('**/*.js'))
		.pipe($.uglify())
		.pipe($.rename({ extname: '.min.js' }))
		.pipe($.sourcemaps.write('maps'))
		.pipe(gulp.dest(conf.paths.dist))
		.pipe(gulp.dest(conf.paths.tmp));
});
