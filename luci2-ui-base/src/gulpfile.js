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
gulp.task('lint', lint('chk'));	// check for js errors
gulp.task('lint:fix', lint('fix'));	// fix linting errors, updating original files
gulp.task('translate:pot', translatePot);	// translation: generate template.pot in .tmp
gulp.task('translate:json', translateJson);	// translation: convert .po translations into .json
gulp.task('serve', gulp.parallel(lint('chk'),
		  gulp.series(inject, watch, serveDev))); // local web server (+proxy), for development
gulp.task('build', gulp.parallel(copyFiles,
				   gulp.series(lint('err'), inject, partials, build))); // final dist
gulp.task('serve:dist', gulp.series('build', serveDist)); // local web server from dist files


/** GULP TASKS: definitions **/

function clean(done) {
	del([conf.paths.dist, conf.paths.tmp, '.maps']);
	done();
}

function inject() {
	const css = gulp.src(path.join(conf.paths.src, '**/*.css'), { read: false });

	const js = gulp.src([path.join(conf.paths.src, conf.paths.app, '**/*.js'),
		'!' + path.join(conf.paths.src, conf.paths.app, 'controller/**/*.js'),
		'!' + path.join(conf.paths.src, conf.paths.app, 'proto/**/*.js')], { read: false });

	const opts = {
		ignorePath: [conf.paths.src, conf.paths.tmp],
		addRootSlash: false
	};

	gulp.src([path.join(conf.paths.src, conf.paths.app, '**/*.js'),
		'!' + path.join(conf.paths.src, conf.paths.app, 'controller/**/*.js'),
		'!' + path.join(conf.paths.src, conf.paths.app, 'proto/**/*.js')], { base: conf.paths.src })
		.pipe($.insert.wrap('(function() {\n\'use strict\';\n', '})();\n'))
		.pipe($.ngAnnotate({ remove: true, add: true, single_quotes: true }))
		.pipe(gulp.dest(conf.paths.tmp));

	return gulp.src(path.join(conf.paths.src, conf.paths.mainHtml))
		.pipe($.inject(css, opts))
		.pipe($.inject(js, opts))
		.pipe($.wiredep(Object.assign({}, conf.wiredep)))
		.pipe(gulp.dest(conf.paths.tmp))
		.pipe(browserSync.stream());
}

function lint(mode) {
	var fix = mode == 'fix';
	var fail = mode == 'err';
	var fixed = [];

	return linter;

	function linter(done) {
		return gulp.src([path.join(conf.paths.src, '**/*.js'),
			             path.join(conf.paths.src, '**/*.json')])
			.pipe($.eslint({ fix: fix }))
			.pipe($.eslint.format())

			.pipe($.if(fix, $.if(isFixed, gulp.dest(conf.paths.src))))
			.on('end', reportFixed)

			.pipe($.if(fail, $.eslint.failAfterError()));
	}

	// Has ESLint fixed the file contents?
	function isFixed(file) {
		if (file.eslint != null && file.eslint.fixed) {
			fixed.push(file.path);
			return true;
		}
		return false;
	}

	function reportFixed() {
		if (!fix) return;
		console.log(`ESLint fixed ${fixed.length} files.`);
		for (var i = 0; i < fixed.length; i++)
			console.log(fixed[i]);
	}
}

function serveDev() {
	browserSync.init({
		server: {
			baseDir: [conf.paths.tmp, conf.paths.src],
			index: conf.paths.mainHtml,
			routes: { '/bower_components': 'bower_components' },
			middleware: conf.proxy ? proxy('http://lede.lan/ubus') : undefined
		},
		open: false
	});
}

function serveDist() {
	browserSync.init({
		server: {
			baseDir: [conf.paths.dist],
			index: conf.paths.mainHtml,
			routes: {
				'/.maps': '.maps',
				'/bower_components': 'bower_components'
			},
			middleware: conf.proxy ? proxy('http://lede.lan/ubus') : undefined
		},
		open: false
	});
}

function copyFiles(done) {
	gulp.src([path.join(conf.paths.src, conf.paths.app, 'view/**/*'),
		path.join(conf.paths.src, conf.paths.app, 'controller/**/*'),
		path.join(conf.paths.src, conf.paths.app, 'icons/**/*'),
		path.join(conf.paths.src, conf.paths.app, 'proto/**/*')],
		{ base: conf.paths.src })
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
		.pipe($.htmlmin({ collapseWhitespace: true }))
		.pipe($.angularTemplatecache('templateCache.js', {
			module: conf.ngModule,
			root: conf.paths.app
		}))
		.pipe(gulp.dest(conf.paths.tmp));
}

function build() {
	const partials = gulp.src(path.join(conf.paths.tmp, 'templateCache.js'), { read: false });
	const opts = {
		starttag: '<!-- inject:partials -->',
		ignorePath: conf.paths.tmp,
		addRootSlash: false
	};

	const htmlFilter = $.filter(path.join(conf.paths.tmp, '**/*.html'), { restore: true });
	const jsFilter = $.filter(path.join(conf.paths.tmp, '**/*.js'), { restore: true });
	const cssFilter = $.filter(path.join(conf.paths.tmp, '**/*.css'), { restore: true });


	return gulp.src(path.join(conf.paths.tmp, conf.paths.mainHtml))

		.pipe($.inject(partials, opts))
		.pipe($.useref({}, lazypipe().pipe($.sourcemaps.init, { loadMaps: true })
		               .pipe($.if, path.join(conf.paths.src, conf.paths.app, '**/*.js'),
						          $.insert.wrap('(function() {\n\'use strict\';\n', '})();\n'))))

		.pipe(jsFilter)
		.pipe($.if('**/luci-ng.js', // don't annotate libs
		           $.ngAnnotate({ remove: true, add: true, single_quotes: true })))
		.pipe($.uglify({ preserveComments: 'license' })) // but minify everything
		.pipe(jsFilter.restore)

		.pipe(cssFilter)
		.pipe($.if('**/luci-ng.css', // don't prefix libs css
													$.autoprefixer()))
		.pipe($.cssnano()) // but minify everything
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
		.pipe($.angularGettext.compile({ format: 'json' }))
		.pipe(gulp.dest(path.join(conf.paths.dist, 'translations/')));
}
