/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')(); // load all gulp-* modules
$.wiredep = require('wiredep').stream;

// load configuration files
const conf = require('./conf.js');


// export Gulp tasks

exports.tasks = {
	lint: lint(),
	lintErr: lint('err'),
	lintFix: lint('fix'),
	injectJs: gulp.series(prepareJs, injectJs)
};


function prepareJs() {
	return gulp.src([conf.path.src('*.js')]
		            .concat(conf.path.modules('src', '**/*.js'))
		            .concat(conf.path.assets('!', 'src', ''))
					, { base: conf.paths.src })
		.pipe($.insert.wrap(conf.closure.pre, conf.closure.post))
		.pipe($.ngAnnotate({ remove: true, add: true, single_quotes: true }))
		.pipe(gulp.dest(conf.paths.tmp));
}

function injectJs() {
	var js = gulp.src([conf.path.tmp('**/*.js'),
					   conf.path.tmp('!', 'ngMaterial.js'),
					   conf.path.tmp('!', '**/*.tmpl.js')]
					   , { read: false });

	return gulp.src(conf.path.mainHtml('tmp', ''))
		.pipe($.wiredep(Object.assign({}, conf.wiredep)))
		.pipe($.inject(js, { relative:  true }))
		.pipe(gulp.dest(conf.paths.tmp));
}


function lint(mode) {
	var fix = mode == 'fix';
	var fail = mode == 'err';
	var fixed = [];

	return linter;

	function linter(done) {
		return gulp.src([conf.path.src('**/*.js'),
			             conf.path.src('**/*.json')])
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
		$.util.log(`ESLint fixed ${fixed.length} files.`);
		for (var i = 0; i < fixed.length; i++)
			$.util.log(fixed[i]);
	}
}

