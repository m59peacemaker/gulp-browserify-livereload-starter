var gulp       = require('gulp');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var watchify   = require('watchify');
var del        = require('del');
var liveServer = require('live-server');
var es         = require('event-stream');
var concat     = require('gulp-concat');
var buffer     = require('vinyl-buffer')
var pkg        = require('./package.json');
var config     = pkg.build;

/* TODO:
 watch copy files and copy on change
*/

gulp.task('default', ['build-live']);
gulp.task('clean', clean);
gulp.task('build', function() {
  copyToBuild();
  js();
});
gulp.task('build-live', function() {
  devServer();
  copyToBuild();
  js({
    watch: true
  });
});

function clean() {
  del([
    config.dest+'/**',
    '!'+config.dest
  ]);
}

function devServer() {
  liveServer.start({
      port: 8081,
      host: '0.0.0.0',
      root: config.dest,
      open: false,
      file: 'index.html'
  });
}

function js(opts) {
  opts = Object.assign({
    deps: [],
    watch: false
  }, opts);

  var bundler = browserify(config.browserify);
  ;

  function bundle() {
    console.log('Building JS...');
    var depStream = gulp.src(config.jsDeps);
    var bundleStream = bundler.bundle()
      .on('error', function(err) {
        console.log(err.message);
        this.emit('end');
      })
      .pipe(source('index.js'))
    ;
    return es.merge(depStream, bundleStream)
      .pipe(buffer())
      .pipe(concat('index.js'))
      .pipe(gulp.dest(config.dest))
      .on('end', function() { 
        console.log('JS complete.'); 
      })
    ;
  }

  if (opts.watch) {
    bundler = watchify(bundler)
      .on('update', bundle);
  }

  return bundle();
}

function copyToBuild() {
  return gulp.src(config.copy, {base: './src'}).pipe(gulp.dest(config.dest));
}
