var gulp       = require('gulp')
var watchify   = require('watchify')
var browserify = require('browserify')
var hmr        = require('browserify-hmr')
var source     = require('vinyl-source-stream')
var path       = require('path')
var del        = require('del')
var Server     = require('dust-server')
var pkg        = require('./package.json')
var config     = pkg.build

var server = Server({
  root: config.dest
})

gulp.task('default', ['build-live-hmr'])
gulp.task('clean', clean)
gulp.task('build', function() {
  copyToBuild()
  js()
})
gulp.task('build-live-hmr', function() {
  server.listen(config.server.port)
  watchCopy()
  js({
    watch: 'hmr'
  })
})
gulp.task('build-live', function() {
  server.listen(config.server.port)
  watchCopy()
  js({
    watch: true
  })
})

function watchCopy() {
  return gulp.watch(config.copy, {base: './src'}, function(event) {
    copyToBuild().on('end', function() {
      path.extname(event.path).toLowerCase() === '.css' ? server.refreshCSS() : server.reload()
    })
  })
}

function clean() {
  del([
    config.dest+'/**',
    '!'+config.dest
  ])
}

function js(opts) {
  opts = Object.assign({
    watch: false
  }, opts)

  opts.watch && (config.browserify.debug = true)

  var bundler = browserify(config.browserify)

  function bundle() {
    console.log('Building JS...')
    return bundler.bundle()
      .on('error', function(err) {
        console.log(err.message)
        this.emit('end')
      })
      .pipe(source('index.js'))
      .pipe(gulp.dest(config.dest))
      .on('end', function() {
        console.log('JS complete.')
        if (opts.watch && opts.watch !== 'hmr') {
          server.reload()
        }
      })
  }

  if (opts.watch) {
    bundler = watchify(bundler)
      .on('update', bundle)
    if (opts.watch === 'hmr') {
      bundler.plugin(hmr, config.hmr || {})
    }
  }

  bundle()
}

function copyToBuild() {
  return gulp.src(config.copy, {base: './src'}).pipe(gulp.dest(config.dest))
}
