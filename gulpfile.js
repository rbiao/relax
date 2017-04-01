var gulp = require('gulp'),
    less = require('gulp-less'),                                        // 编译less
    plumber = require('gulp-plumber'),                                  // 监听代码出错时不中断执行
    del = require('del'),                                               // 删除文件
    rename = require('gulp-rename'),                                    // 重命名
    cleanCSS = require('gulp-clean-css'),                               // 压缩css https://github.com/scniro/gulp-clean-css
    runSequence = require('gulp-sequence'),                             // 让任务按顺序执行，因为gulp任务执行是异步的，所以需要gulp-sequence。
    fileinclude  = require('gulp-file-include'),                        // 模版复用
    browserSync = require('browser-sync'),                              // 浏览器同步测试 http://www.browsersync.cn/
    gulpif = require('gulp-if'),
    spritesmith = require('gulp.spritesmith'),                          // 雪碧图 https://github.com/twolfson/gulp.spritesmith
    buffer = require('vinyl-buffer'),
    merge = require('merge-stream'),
    reload = browserSync.reload;

var paths = {
    dev: {
        images: './src/images/*.*',
        fonts: './src/fonts/**/*.*',
        styles: [
            './src/styles/style.less'
        ],
        pages: ['./src/modules/**/*.html']
    },
    output: {
        fonts: './dist/fonts',
        images: './dist/images',
        styles: './dist/styles',
        pages: './dist/modules'
    }
}

// 雪碧图
gulp.task('sprite', function() {
    var spriteData = gulp.src('./src/images/slice/*.png').pipe(spritesmith({
        // cssTemplate: 'handlebarsInheritance.scss.handlebars',
        imgPath: '../images/sprite.png',        // css中引用的雪碧图
        cssFormat: 'less',                      // 输出文件类型sass，less，css，json
        imgName: 'sprite.png',                  // 输出图片名
        cssName: 'sprite.less'                  // 输出样式名
    }));
    var imgStream = spriteData.img
        .pipe(buffer())
        // .pipe(imagemin())
        .pipe(gulp.dest('./dist/images')); //图片输出路径

    // Pipe CSS stream through CSS optimizer and onto disk
    var cssStream = spriteData.css
        // .pipe(csso())
        .pipe(gulp.dest('./src/styles')); // 样式输出路径

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
});

// 编译html
gulp.task('build:html', function() {
    gulp.src(paths.dev.pages)
        .pipe(rename({ dirname: '' }))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest(paths.output.pages));
});

// 编译less
gulp.task('build:styles', function() {
    gulp.src(paths.dev.styles)
        .pipe(less())
        .pipe(plumber())
        .pipe(gulp.dest(paths.output.styles))
        .pipe(cleanCSS())
        .pipe(rename(function(path){
            path.basename +='.min';
        }))
        .pipe(gulp.dest(paths.output.styles));
})

// 编译js
gulp.task('build:js', function() {
    gulp.src('./src/js/**')
        .pipe(gulp.dest('./dist/js'));
})


//编译images
gulp.task('build:images', function() {
    gulp.src(paths.dev.images)
        .pipe(gulp.dest(paths.output.images))
})


//编译fonts
gulp.task('build:fonts', function() {
    gulp.src(paths.dev.fonts)
        .pipe(gulp.dest(paths.output.fonts))
})


// 删除文件
gulp.task('del:dist', function (cb) {
    return del(['dist/**'], cb);
});

// 服务器
gulp.task('server', function(cb) {
    browserSync({
        server: {
            baseDir: './dist',
            // index: 'modules/buttons.html'
        },
        port: 9999,
        // browser: ["chrome", "firefox"],
        startPath: "modules/index.html"
    });
    runSequence('del:dist', 'build:styles', [ 'build:html', 'build:images', 'build:js', 'build:fonts', 'sprite'], cb);
})

gulp.task('default', ['server'], function(){
    gulp.watch('./src/styles/**/*.*', ['build:styles']).on('change', reload);
    gulp.watch('./src/modules/**/*.html', ['build:html']).on('change', reload);
    gulp.watch('./src/js/**/*.js', ['build:js']).on('change', reload);
});


