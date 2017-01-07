'use strict';

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const path = require('path');
const del = require('del');
const proxy = require('http-proxy-middleware');
const $ = require('gulp-load-plugins')(); //load all gulp-* modules
$.wiredep = require('wiredep').stream;
// load configuration files
const pkg = require('./package.json');
const conf = require('./gulp.json');


// clean: clean output & tmp directory
gulp.task('clean', (done) => {
	del([conf.paths.dist, conf.paths.tmp]);
	done();
});


gulp.task(inject);

gulp.task('build', gulp.parallel(copyFiles, gulp.series('inject', build)));

gulp.task('serve', gulp.series('inject', watch, serveDev));
gulp.task('serve:dist', gulp.series('build', serveDist));


// serve: web server with proxy, for development
function serveDev() {
	browserSync.init({
		server: {
			baseDir: [conf.paths.tmp, conf.paths.src],
			index: conf.paths.mainHtml,
			routes: {
				'/bower_components': 'bower_components'
			},
			middleware: proxy('http://lede.lan/ubus')
		},
		open: false
	});
}

function serveDist() {
	browserSync.init({
		server: {
			baseDir: [conf.paths.dist],
			index: conf.paths.mainHtml,
			middleware: proxy('http://lede.lan/ubus')
		},
		open: false
	});
}

// lint: lint js files
gulp.task('lint', () => {
	return gulp.src([path.join(conf.paths.src, '**/*.js')])
		.pipe($.eslint({
			fix: true
		}))
		.pipe($.eslint.format())
		.pipe(gulp.dest(conf.paths.tmp));
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
		.pipe($.rename({
			extname: '.min.js'
		}))
		.pipe($.sourcemaps.write('maps'))
		.pipe(gulp.dest(conf.paths.dist))
		.pipe(gulp.dest(conf.paths.tmp));
});


function inject() {
	const css = gulp.src(path.join(conf.paths.src, '**/*.css'), {
		read: false
	});
	const js = gulp.src([
		path.join(conf.paths.src, conf.paths.app, '*.js')
  ], {
		read: false
	});

	const opts = {
		ignorePath: [conf.paths.src, conf.paths.tmp],
		addRootSlash: false
	};

	return gulp.src(path.join(conf.paths.src, conf.paths.mainHtml))
		.pipe($.inject(css, opts))
		.pipe($.inject(js, opts))
		.pipe($.wiredep(Object.assign({}, conf.wiredep)))
		.pipe(gulp.dest(conf.paths.tmp))
		.pipe(browserSync.stream());
}


function build() {
	return gulp.src(path.join(conf.paths.tmp, conf.paths.mainHtml))
		.pipe($.useref())
		.pipe($.if('*.js_', $.ngAnnotate({
			remove: true,
			add: true,
			single_quotes: true
		})))
		.pipe(gulp.dest(conf.paths.dist))
		.pipe(browserSync.stream());
}

function copyFiles() {
	return gulp.src([path.join(conf.paths.src, conf.paths.app, 'view/**/*'),
									 path.join(conf.paths.src, conf.paths.app, 'controller/**/*'),
									 path.join(conf.paths.src, conf.paths.app, 'icons/**/*'),
									 path.join(conf.paths.src, conf.paths.app, 'proto/**/*'),
									], {
			base: conf.paths.src
		})
		.pipe(gulp.dest(conf.paths.dist));

}


function reloadBrowserSync(done) {
  browserSync.reload();
  done();
}

function watch(done) {
  gulp.watch([path.join(conf.paths.src, conf.paths.mainHtml),
							'bower.json',
							path.join(conf.paths.src, '**/*.js'),
						 ], 'inject');

  //gulp.watch(conf.path.src('app/**/*.html'), gulp.series('partials', reloadBrowserSync));
  //gulp.watch([conf.path.src('**/*.css')], gulp.series('styles'));
  done();
}
