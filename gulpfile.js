'use strict';

var gulp = require('gulp'),
    less = require('gulp-less'), // 编译less
    plumber = require('gulp-plumber'), // 监听代码出错时不中断执行
    del = require('del'), // 删除文件
    rename = require('gulp-rename'), // 重命名
    cleanCSS = require('gulp-clean-css'), // 压缩css https://github.com/scniro/gulp-clean-css
    runSequence = require('gulp-sequence'), // 让任务按顺序执行，因为gulp任务执行是异步的，所以需要gulp-sequence。
    fileinclude = require('gulp-file-include'), // 模版复用
    browserSync = require('browser-sync'), // 浏览器同步测试 http://www.browsersync.cn/
    spritesmith = require('gulp.spritesmith'), // 雪碧图 https://github.com/twolfson/gulp.spritesmith
    gulpif = require('gulp-if'), // if判断
    buffer = require('vinyl-buffer'),
    merge = require('merge-stream'),
    reload = browserSync.reload,

    argv = require('yargs').argv,
    _ = require('lodash'),
    path = require('path'),

    config = require('./config.json');



argv.a = 10;

var gulpFun = {
    /* html 打包 */
    buildHtml: function() {
        var src = arguments[0],
            dest = arguments[1],
            flag = arguments[2];

        gulp.src(src)
            .pipe(rename({
                dirname: ''
            }))
            .pipe(fileinclude({
                prefix: '@@',
                basepath: '@file'
            }))
            .pipe(gulp.dest(dest));
    },

    /* css 打包 */
    buildStyle: function() {
        var src = arguments[0],
            dest = arguments[1],
            flag = arguments[2];

        gulp.src(src)
            .pipe(less())
            .pipe(plumber())
            .pipe(gulp.dest(dest))
            .pipe(cleanCSS())
            .pipe(rename(function(path) {
                path.basename += '.min';
            }))
            .pipe(gulp.dest(dest));
    },

    /* js打包 */
    buildJs: function() {
        var src = arguments[0],
            dest = arguments[1],
            flag = arguments[2];

        gulp.src(src)
            .pipe(gulp.dest(dest));
    },

    /* img打包 */
    buildImg: function() {
        // 拷贝图片
        gulp.src(config.dev.images)
            .pipe(gulp.dest(config.output.images));

        // 雪碧图
        var spriteData = gulp.src('./src/images/slice/*.png').pipe(spritesmith({
            // cssTemplate: 'handlebarsInheritance.scss.handlebars',
            imgPath: '../images/sprite.png', // css中引用的雪碧图
            cssFormat: 'less', // 输出文件类型sass，less，css，json
            imgName: 'sprite.png', // 输出图片名
            cssName: 'sprite.less' // 输出样式名
        }));
        var imgStream = spriteData.img
            .pipe(buffer())
            // .pipe(imagemin())
            .pipe(gulp.dest(config.output.images)); //图片输出路径

        // Pipe CSS stream through CSS optimizer and onto disk
        var cssStream = spriteData.css
            // .pipe(csso())
            .pipe(gulp.dest(config.output.styles)); // 样式输出路径

        // Return a merged stream to handle both `end` events
        return merge(imgStream, cssStream);
    },

    /* md5打包 */
    buildMd5: function() {}
};

// 编译html
gulp.task('build:html', function() {
    gulpFun.buildHtml(config.dev.pages, config.output.pages);
});

// 编译less
gulp.task('build:styles', function() {
    gulpFun.buildStyle(config.dev.styles, config.output.styles);
});

// 编译js
gulp.task('build:js', function() {
    gulpFun.buildJs(config.dev.js, config.output.js);
});

//编译images
gulp.task('build:images', function() {
    gulpFun.buildImg();
});

//编译fonts
gulp.task('build:fonts', function() {
    gulp.src(config.dev.fonts)
        .pipe(gulp.dest(config.output.fonts));
});

// 删除文件
gulp.task('del:dist', function(cb) {
    return del(['dist/**'], cb);
});

// 服务器
gulp.task('server', function(cb) {
    browserSync({
        server: {
            // index: 'modules/buttons.html',
            baseDir: './dist'
        },
        port: 9999,
        // browser: ["chrome", "firefox"],
        startPath: 'modules/index.html'
    });
    runSequence('del:dist', 'build:styles', ['build:html', 'build:images', 'build:js', 'build:fonts'], cb);
});

gulp.task('default', ['server'], function() {
    gulp.watch('./src/styles/**/*.*', ['build:styles']).on('change', reload);
    gulp.watch('./src/modules/**/*.html', ['build:html']).on('change', reload);
    gulp.watch('./src/js/**/*.js', ['build:js']).on('change', reload);
});


// 说明
gulp.task('help', function() {
    console.log('   gulp build          文件打包');
    console.log('   gulp watch          文件监控打包');
    console.log('   gulp help           gulp参数说明');
    console.log('   gulp server         测试server');
    console.log('   gulp -p             生产环境（默认生产环境）');
    console.log('   gulp -d             开发环境');
    console.log('   gulp -m <module>    部分模块打包（默认全部打包）');
});
