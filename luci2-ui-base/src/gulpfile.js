/* eslint-env node, es6 */

'use strict';

const gulp = require('gulp');

// load tasks from subfolder and register them
const gtask = require('require-dir')('./gulp');

for (var f in gtask)
	if (gtask[f].tasks)
		for (var t in gtask[f].tasks)
			gulp.task(t, gtask[f].tasks[t]);

/** Add combined task declarations **/

gulp.task('clean', gulp.series('clean'));	// remove output & tmp directory
gulp.task('lint:fix', gulp.series('lintFix'));	// fix linting errors in place

gulp.task('inject', gulp.series('copyHtml', 'injectCss', 'injectJs', 'injectMaterial'));

gulp.task('dist', gulp.parallel('svg', 'copyAssets',
	              gulp.series('lintErr', 'inject', 'injectPartials', 'build')));

gulp.task('serve', gulp.series('svg', 'inject', 'serveDev'));
gulp.task('serve:dist', gulp.series('dist', 'serveDist'));
