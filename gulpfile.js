'use strict';

var gulp = require('gulp'),
    less = require('gulp-less'),               // 编译less
    plumber = require('gulp-plumber'),         // 监听代码出错时不中断执行
    del = require('del'),                      // 删除文件
    rename = require('gulp-rename'),           // 重命名
    runSequence = require('gulp-sequence'),    // 让任务按顺序执行，因为gulp任务执行是异步的，所以需要gulp-sequence。
    fileinclude = require('gulp-file-include'),// 模版复用
    browserSync = require('browser-sync'),     // 浏览器同步测试 http://www.browsersync.cn/
    spritesmith = require('gulp.spritesmith'), // 雪碧图 https://github.com/twolfson/gulp.spritesmith
    gulpif = require('gulp-if'),               // 在管道中使用if判断
    replace = require('gulp-replace'),         // https://www.npmjs.com/package/gulp-replace
    buffer = require('vinyl-buffer'),
    merge = require('merge-stream'),
    reload = browserSync.reload,

    argv = require('yargs').argv,              // https://www.npmjs.com/package/yargs
    // _ = require('lodash'),
    path = require('path'),

    htmlmin = require('gulp-htmlmin'),         // 压缩html和页面的css、javascript
    cleanCSS = require('gulp-clean-css'),      // 压缩css https://github.com/scniro/gulp-clean-css
    uglify = require('gulp-uglify'),           // 压缩js
    imagemin = require('gulp-imagemin'),       // 压缩image

    config = require('./config.js');

var util = {
    replaceGlobalVar: function() {
        return replace(/(__\w+__)/g, function($1) {
            var value = config.globals[$1];
            if (value !== undefined) {
                return value;
            }
            return $1;
        })
    }
}

var gulpFun = {
    /* html 打包 */
    buildHtml: function() {
        var src = arguments[0],
            dest = arguments[1],
            env = arguments[2]; // true为开发环境，false为生产环境。

        var options = {
            removeComments: true,               // 清除HTML注释
            collapseWhitespace: true,           // 压缩HTML
            collapseBooleanAttributes: true,    // 省略布尔属性的值 <input checked="true"/> ==> <input />
            removeEmptyAttributes: true,        // 删除所有空值属性 <input id="" /> ==> <input />
            removeScriptTypeAttributes: true,   // 删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true,// 删除<style>和<link>的type="text/css"
            minifyJS: true,                     // 压缩页面JS
            minifyCSS: true                     // 压缩页面CSS
        };

        gulp.src(src)
            .pipe(util.replaceGlobalVar())
            .pipe(rename({
                dirname: ''
            }))
            .pipe(fileinclude({
                prefix: '@@',
                basepath: '@file'
            }))
            .pipe(gulpif(!env, htmlmin(options)))
            .pipe(gulp.dest(dest));
    },

    /* css 打包 */
    buildStyle: function() {
        var src = arguments[0],
            dest = arguments[1],
            env = arguments[2];

        gulp.src(src)
            .pipe(less())
            .pipe(plumber())
            .pipe(gulpif(!env, cleanCSS()))
            .pipe(gulp.dest(dest));
    },

    /* js 打包 */
    buildJs: function() {
        var src = arguments[0],
            dest = arguments[1],
            env = arguments[2];

        gulp.src(src)
            // .pipe(gulpif(!env, uglify()))  //es6语法报错。先用webpack打包再压缩。
            .pipe(gulp.dest(dest));
    },

    /* img打包 */
    buildImage: function() {
        var src = arguments[0],
            dest = arguments[1],
            env = arguments[2];

        // 拷贝图片
        gulp.src(src)
            .pipe(gulpif(!env, imagemin()))
            .pipe(gulp.dest(dest));

        // 雪碧图
        var spriteData = gulp.src(config.src.imagesSprite).pipe(spritesmith({
            // cssTemplate: 'handlebarsInheritance.scss.handlebars',
            imgPath: '../images/sprite.png',// css中引用的雪碧图
            cssFormat: 'less',              // 输出文件类型sass，less，css，json
            imgName: 'sprite.png',          // 输出图片名
            cssName: 'sprite.less'          // 输出样式名
        }));
        var imgStream = spriteData.img
            .pipe(buffer())
            .pipe(gulpif(!env, imagemin()))
            .pipe(gulp.dest(dest)); // 图片输出路径

        // Pipe CSS stream through CSS optimizer and onto disk
        var cssStream = spriteData.css
            // .pipe(csso())
            .pipe(gulp.dest('./src/styles/')); // 样式输出路径

        // Return a merged stream to handle both `end` events
        return merge(imgStream, cssStream);
    },

    /* delete */
    delete: function(cb){
        var dirPath = config.env ? config.develop.dirPath : config.production.dirPath;
        return del([dirPath], cb);
    },

    /* md5打包 */
    buildMd5: function() {

    },

    /* server */
    server: function(env, cb) {
        var baseDir = env ? config.develop.dirPath : config.production.dirPath;
        browserSync({
            server: {
                // index: 'modules/buttons.html',
                baseDir: baseDir
            },
            port: 9999,
            // browser: ["chrome", "firefox"],
            startPath: 'modules/index.html'
        });
        runSequence('del:dist', 'build:images', 'build:styles', ['build:html', 'build:js', 'build:fonts'], cb);
        gulp.watch('./src/styles/**/*.*', ['build:styles']).on('change', reload);
        gulp.watch('./src/modules/**/*.html', ['build:html']).on('change', reload);
        gulp.watch('./src/js/**/*.js', ['build:js']).on('change', reload);
    }
};

// 编译html
gulp.task('build:html', function() {
    var dest = config.env ? config.develop.output.pages : config.production.output.pages;
    gulpFun.buildHtml(config.src.pages, dest, config.env);
});

// 编译less
gulp.task('build:styles', function() {
    var dest = config.env ? config.develop.output.styles : config.production.output.styles;
    gulpFun.buildStyle(config.src.styles, dest, config.env);
});

// 编译js
gulp.task('build:js', function() {
    var dest = config.env ? config.develop.output.js : config.production.output.js;
    gulpFun.buildJs(config.src.js, dest, config.env);
});

// 编译images
gulp.task('build:images', function() {
    var dest = config.env ? config.develop.output.images : config.production.output.images;
    gulpFun.buildImage(config.src.images, dest, config.env);
});

// 编译fonts
gulp.task('build:fonts', function() {
    // gulp.src(config.dev.fonts)
    //     .pipe(gulp.dest(config.output.fonts));
});

// 删除文件
gulp.task('del:dist', function(cb) {
    return gulpFun.delete(cb);
});

// 服务器 - 开发环境
gulp.task('develop', function(cb) {
    gulpFun.server(config.env, cb);
});

// 服务器 - 生产环境
gulp.task('production', function(cb){
    config.env = false;
    config.globals.__ENV__ = false;
    gulpFun.server(config.env, cb);
});

// 说明
gulp.task('help', function() {
    // console.log('   gulp build          文件打包');
    // console.log('   gulp watch          文件监控打包');
    // console.log('   gulp server         测试server');
    // console.log('   gulp -m <module>    部分模块打包（默认全部打包）');
    console.log('   gulp help           gulp参数说明');
    console.log('   gulp production     生产环境');
    console.log('   gulp develop        开发环境（默认开发环境）');
});
