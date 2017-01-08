/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const path = require('path');
const del = require('del');
const lazypipe = require('lazypipe');
const proxy = require('http-proxy-middleware');
const $ = require('gulp-load-plugins')(); // load all gulp-* modules
$.wiredep = require('wiredep').stream;

// load configuration files
const conf = require('./gulp.json');


/** GULP TASKS: declarations **/

gulp.task('clean', clean);	// remove output & tmp directory
gulp.task('partials', partials);
gulp.task('inject', inject);	// insert <scripts> & <styles> and wire dependencies
gulp.task('lint', lint);	// check for js errors (leaves fixed files in tmp)
gulp.task('translate:pot', translatePot);	// translation: generate template.pot in .tmp
gulp.task('translate:json', translateJson);	// translation: convert .po translations into .json
gulp.task('serve', gulp.series('inject', watch, serveDev)); // starts local web server
																														// (with proxy), for development
gulp.task('build', gulp.parallel(copyFiles, gulp.series('inject', 'partials', build))); // generates
																																												// final dis
gulp.task('serve:dist', gulp.series('build', serveDist)); // starts local web server
																													// (with proxy), from dist files


/** GULP TASKS: definitions **/

function clean(done) {
	del([conf.paths.dist, conf.paths.tmp, '.maps']);
	done();
}

function inject() {
	const css = gulp.src(path.join(conf.paths.src, '**/*.css'), {read: false});

	const js = gulp.src([path.join(conf.paths.src, conf.paths.app, '*.js'),
		path.join(conf.paths.src, conf.paths.app, 'cbi/**/*.js')], {read: false});

	const opts = {
		ignorePath: [conf.paths.src, conf.paths.tmp],
		addRootSlash: false,
	};

	return gulp.src(path.join(conf.paths.src, conf.paths.mainHtml))
		.pipe($.inject(css, opts))
		.pipe($.inject(js, opts))
		.pipe($.wiredep(Object.assign({}, conf.wiredep)))
		.pipe(gulp.dest(conf.paths.tmp))
		.pipe(browserSync.stream());
}

function lint() {
	return gulp.src([path.join(conf.paths.src, '**/*.js'),
		path.join(conf.paths.src, '**/*.json')])
		.pipe($.eslint({fix: false}))
		.pipe($.eslint.format())
		.pipe(gulp.dest(conf.paths.tmp));
}

function serveDev() {
	browserSync.init({
		server: {
			baseDir: [conf.paths.tmp, conf.paths.src],
			index: conf.paths.mainHtml,
			routes: {
				'/bower_components': 'bower_components',
			},
			middleware: conf.proxy ? proxy('http://lede.lan/ubus') : undefined,
		},
		open: false,
	});
}

function serveDist() {
	browserSync.init({
		server: {
			baseDir: [conf.paths.dist],
			index: conf.paths.mainHtml,
			middleware: conf.proxy ? proxy('http://lede.lan/ubus') : undefined,
		},
		open: false,
	});
}

function copyFiles(done) {
	gulp.src([path.join(conf.paths.src, conf.paths.app, 'view/**/*'),
		path.join(conf.paths.src, conf.paths.app, 'controller/**/*'),
		path.join(conf.paths.src, conf.paths.app, 'icons/**/*'),
		path.join(conf.paths.src, conf.paths.app, 'proto/**/*')],
		{base: conf.paths.src})
	.pipe(gulp.dest(conf.paths.dist));
	done();
}

function watch(done) {
	gulp.watch([path.join(conf.paths.src, conf.paths.mainHtml),
		'bower.json',
		path.join(conf.paths.src, '**/*.js')], inject);
	gulp.watch(path.join(conf.paths.src, '**/*.html'), reloadBrowserSync);
	done();
}

function reloadBrowserSync(done) {
	browserSync.reload();
	done();
}

function partials() {
	return gulp.src(path.join(conf.paths.src, conf.paths.app, '**/*.tmpl.html'))
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe($.angularTemplatecache('templateCache.js', {
	module: conf.ngModule,
	root: conf.paths.app,
}))
    .pipe(gulp.dest(conf.paths.tmp));
}

function build() {
	const partials = gulp.src(path.join(conf.paths.tmp, 'templateCache.js'), {read: false});
	const opts = {
		starttag: '<!-- inject:partials -->',
		ignorePath: conf.paths.tmp,
		addRootSlash: false,
	};

	const htmlFilter = $.filter(path.join(conf.paths.tmp, '**/*.html'), {restore: true});
	const jsFilter = $.filter(path.join(conf.paths.tmp, '**/*.js'), {restore: true});
	const cssFilter = $.filter(path.join(conf.paths.tmp, '**/*.css'), {restore: true});

	return gulp.src(path.join(conf.paths.tmp, conf.paths.mainHtml))

		.pipe($.inject(partials, opts))
		.pipe($.useref({}, lazypipe().pipe($.sourcemaps.init, {loadMaps: true})))

		.pipe(jsFilter)
		// .pipe($.ngAnnotate({remove: true, add: true, single_quotes: true})))
    .pipe($.uglify({preserveComments: 'license'}))
		.pipe(jsFilter.restore)

    .pipe(cssFilter)
		.pipe($.if(path.join(conf.paths.src, '**/*'), $.autoprefixer())) // only for proyect css
    .pipe($.cssnano())
    .pipe(cssFilter.restore)

		.pipe(htmlFilter)
    .pipe($.htmlmin())
    .pipe(htmlFilter.restore)

		.pipe($.sourcemaps.write('../.maps'))

		.pipe(gulp.dest(conf.paths.dist))
		.pipe(browserSync.stream());
}

function translatePot() {
	return gulp.src([path.join(conf.paths.src, '**/*.html'), path.join(conf.paths.src, '**/*.js')])
        .pipe($.angularGettext.extract('template.pot', {}))
        .pipe(gulp.dest(path.join(conf.paths.tmp, 'po')));
}

function translateJson() {
	return gulp.src(path.join(conf.paths.src, 'po/**/*.po'))
        .pipe($.angularGettext.compile({format: 'json'}))
        .pipe(gulp.dest(path.join(conf.paths.dist, 'translations/')));
}
