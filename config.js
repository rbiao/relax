module.exports = {
    globals: {
        __ENV__: true
    },
    env: true, //默认true。 true为开发环境，false为生产环境。
    src: {
        images: './src/images/*.*',
        imagesSprite: './src/images/slice/*.png',
        fonts: './src/fonts/**/*.*',
        styles: [
            './src/styles/style.less'
        ],
        pages: [
            './src/modules/**/*.html',
            '!./src/modules/components/**/*.html',
            '!./src/modules/layout/**/*.html'
        ],
        js: './src/js/**'
    },
    develop: {
        dirPath: './dist/develop',
        output: {
            fonts: './dist/develop/fonts',
            images: './dist/develop/images',
            styles: './dist/develop/styles',
            pages: './dist/develop/modules',
            js: './dist/develop/js'
        }
    },
    production: {
        dirPath: './dist/production',
        output: {
            fonts: './dist/production/fonts',
            images: './dist/production/images',
            styles: './dist/production/styles',
            pages: './dist/production/modules',
            js: './dist/production/js'
        }
    }
}
