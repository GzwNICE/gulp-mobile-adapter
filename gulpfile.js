var gulp = require('gulp')
var del = require('del')
var browserSync = require('browser-sync')
var reload = browserSync.reload
var gutil = require('gulp-util')
var concat = require('gulp-concat')
var miniCSS = require('gulp-clean-css')
var miniJS = require('gulp-uglify')
var rename = require('gulp-rename')
var es3ify = require('gulp-es3ify')
var htmlmin = require('gulp-htmlmin')
var gulpRemoveHtml = require('gulp-remove-html')
var removeEmptyLines = require('gulp-remove-empty-lines')
var rev = require('gulp-rev') //对文件名加MD5后缀
var revCollector = require('gulp-rev-collector')
var runSequence = require('run-sequence')
var postcss = require('gulp-postcss')
var adaptive = require('postcss-adaptive')

// 清理dist目录
gulp.task('clear', function(cb) {
  del(
    ['dist/js/**/*', 'dist/css/**/*', 'dist/imgs/**/*', '!dist/index.html'],
    cb
  )
})

// http服务器
gulp.task('serve', function() {
  browserSync({
    ui: false,
    server: {
      baseDir: 'src',
      index: '/pages/question.html'
    },
    notify: false,
    ghostMode: false,
    port: 8080,
    open: 'external'
  })
})

// js压缩合并
gulp.task('mini-js', function() {
  return gulp
    .src('src/js/**.js')
    .pipe(es3ify())
    .pipe(
      miniJS({
        ie8: true,
        mangle: true, //类型：Boolean 默认：true 是否修改变量名
        compress: true //类型：Boolean 默认：true 是否完全压缩
      })
    )
    .pipe(rev()) //文件名加MD5后缀
    .pipe(gulp.dest('dist/js'))
    .pipe(
      rev.manifest({
        path: 'rev-manifest-js.json'
      })
    )
    .pipe(gulp.dest('src/.rev'))
})

// css压缩ss
gulp.task('mini-css', function() {
  var processors = [adaptive({ remUnit: 75, autoRem: true })]
  return gulp
    .src('src/css/**.css')
    .pipe(postcss(processors))
    .pipe(miniCSS({ compatibility: 'ie8' }))
    .pipe(rev()) //文件名加MD5后缀
    .pipe(gulp.dest('dist/css'))
    .pipe(
      rev.manifest({
        path: 'rev-manifest-css.json'
      })
    )
    .pipe(gulp.dest('src/.rev'))
})

// 替换js src
gulp.task('js', ['mini-js'], function() {
  return gulp
    .src(['src/.rev/rev-manifest-js.json', 'src/pages/*.html'])
    .pipe(revCollector())
    .pipe(gulp.dest('dist/pages'))
})

// 替换css src
gulp.task('css', ['mini-css'], function() {
  var options = {
    removeComments: true, //清除HTML注释
    collapseWhitespace: true, //压缩HTML
    collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
    removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
    removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
    minifyJS: true, //压缩页面JS
    minifyCSS: true //压缩页面CSS
  }
  return gulp
    .src(['src/.rev/rev-manifest-css.json', 'src/pages/*.html'])
    .pipe(revCollector())
    .pipe(gulpRemoveHtml()) //清除特定标签
    .pipe(removeEmptyLines({ removeComments: true })) //清除空白行
    .pipe(htmlmin(options))
    .pipe(gulp.dest('dist/pages/'))
    .pipe(gulp.dest('dist/pages'))
})

// 拷贝图片
gulp.task('copy', function() {
  return gulp.src(['src/imgs/**']).pipe(gulp.dest('dist/imgs/'))
})

// 监听
gulp.task('watch', function() {
  gulp.watch('src/pages/**', reload)
  gulp.watch('src/js/**', reload)
  gulp.watch('src/css/**', reload)
  gulp.watch('src/imgs/**', reload)
})

/*开发环境*/
gulp.task('default', ['serve', 'watch'])

/*生产环境*/
gulp.task('build', runSequence(['clear', 'js', 'css', 'copy']))
