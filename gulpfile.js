var gulp =       require('gulp');
var gutil =      require('gulp-util');
var uglify =     require('gulp-uglify');
var jshint =     require('gulp-jshint');
var webpack =    require('gulp-webpack');
var rename =     require('gulp-rename');
var coffee =     require('gulp-coffee');
var concat =     require('gulp-concat');
var clean =      require('gulp-clean');
var bump =       require('gulp-bump');
var header =     require('gulp-header');
                 require('gulp-grunt')(gulp);

var pkg = require('./package.json');
var banner = [
  '/*!',
  ' * <%= pkg.name %>',
  ' * version <%= pkg.version %>',
  ' * Requires jQuery 1.7.1 or higher',
  ' * <%= pkg.repository.url %>',
  ' * License: Grocery Shopping Network',
  ' *          MIT from derived work of Copyright (c) 2013 Matt Cooper: https://github.com/coop182/jquery.dfp.js  v1.0.18',
  ' */\n'
].join('\n');

gulp.task('bump_version', function(){
    return gulp.src(['./package.json', './bower.json', './component.json'])
        .pipe(bump({type: 'patch'}))
        .pipe(gulp.dest('./'));
});

gulp.task('clean', function() {
  return gulp.src('./dist/*')
    .pipe(clean({force: true}));
});

gulp.task('coffee', function() {
  return gulp.src(['./src/circplus.coffee','./src/gsndfp.coffee','./src/gsnsw2.coffee','./src/jquery.easymodal.coffee', './src/gsnadvertising.coffee'])
    .pipe(concat('gsndfp.coffee'))
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['clean', 'coffee', 'bump_version'], function() {
  return gulp.src('./dist/*.js')
    .pipe(uglify())
    .pipe(header(banner, {pkg: pkg}))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist'));
});


gulp.task('SpecRunner.update', function(){
	var target  = './test/SpecRunner.html',
        names =
            bowerFiles({includeDev: true})
            .concat([
                './src/**/*.js',
                './dist/**/*.js',
                './test/**/*Spec.js'
            ]),

		dependencies   = gulp.src(names, {read: false});
	
	return gulp.src(target)
        .pipe(inject(dependencies, {relative : true}))
		.pipe(gulp.dest('./test'));
});

gulp.task('watch', function() {
  gulp.watch('src/gsndfp.js', ['default']);
});

gulp.task('test', ['grunt-jasmine']);
