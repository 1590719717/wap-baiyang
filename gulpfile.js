/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/11/28
 * @description gulp 打包文件
 */

var config = require('./config.js');       // 项目平台配置文件

var fs = require('fs');
var path = require('path');

var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var PLUGIN_NAME = 'wap gulp package';

var gulp = require('gulp');                                         // gulp 基础插件
var htmlmin = require('gulp-htmlmin');                              // html 压缩插件
var imagemin = require('gulp-imagemin');                            // 图片压缩工具
var less = require('gulp-less');                                    // less压缩工具
var uglify = require('gulp-uglify');                                // js压缩工具

var ejs = require("ejs");                                           // ejs模板

var lessPluginCleanCss = require('less-plugin-clean-css');

var colors = require("colors");                                     // 控制台输出颜色修改

// 源文件路径
var dir_src = './src/';

// 所有任务与回调函数列表
var globalTasks = {};

// 静态资源版本号
var url_version = Date.now();

// 修改静态资源版本号
var changeVersion = function (callback) {
    url_version = Date.now();

    if (config) {
        forEachIn(config, function (name, conf) {
            conf.version = url_version;
        });
    }

    console.log('  √  '.green + '资源版本号已更新');

    callback && callback();

};

var forEachIn = function (object, callback) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            if (callback(key, object[key]) === false) {
                break;
            }
        }
    }
};

// alias 文件列表
var alias = null;

// 获取 alias 文件列表
var createAlias = function (callback) {

    // js遍历路径
    var js_path = dir_src + 'js';

    var getAllFiles = function (root) {
        var res = [],
            files = fs.readdirSync(root);

        files.forEach(function (file) {
            var pathname = root + '/' + file
                , stat = fs.lstatSync(pathname);

            if (!stat.isDirectory()) {
                res.push('"' + file.replace('.js', '') + '":"' + pathname.replace(js_path + '/', '') + '?v=' + url_version + '"');
            } else {
                res = res.concat(getAllFiles(pathname));
            }
        });

        return res
    };

    // 将 alias json字符串存储到Config对象
    alias = '{' + getAllFiles(js_path).join(',') + '}';

    forEachIn(config, function (name, conf) {
        conf.alias = alias;
    });

    console.log('  √  '.green + 'alias列表已生成');

    callback && callback();
};

// 将html文件内的静态资源替换cdn路径
var sourceSet = function (html, cdn) {

    if (typeof cdn !== 'string') {
        cdn = '';
    }

    html = html.replace(/\b(src|href)="([^"#?]+)\.(css|js|png|jpg|gif)(\?[^"]+)?"/img, function (match, attr, dir, src, version) {
        if (!/^http|\/\//.test(dir)) {

            if (/\/$/.test(cdn) && /^\//.test(dir)) {
                cdn = cdn.replace(/\/$/, '');
            } else if (!/\/$/.test(cdn) && !/^\//.test(dir)) {
                cdn += '/';
            }

            var url = attr + '="' + cdn + dir + '.' + src;

            if (/^png|jpg|gif$/.test(src)) {
                url += (version || '') + '"';
            } else {
                url += '?v=' + url_version + '"';
            }
            return url;
        } else {
            return match;
        }
    });

    return html;
};

// 内置标签解析方法
var tempConvert = function (code, config) {

    config.require = function (dir, param) {
        var file_dir = path.resolve(dir_src, dir);
        var code = fs.readFileSync(path.relative('./', file_dir));

        if (/\.(html|ejs)$/.test(dir)) {

            var renderData = {};

            forEachIn(config, function (key, value) {
                if (({}).toString.call(value) === '[object String]') {
                    renderData[key] = value;
                }
            });

            if (param && ({}).toString.call(param) === '[object Object]') {
                forEachIn(param, function (key, value) {
                    renderData[key] = value;
                });
            }

            code = ejs.render(code.toString(), renderData);

        }


        return code.toString();
    };

    return code.replace(/\{\{((\}(?!\})|[^\}])+)\}\}/g, function (str, value) {
        value = value.trim();

        var func = new Function('Config', 'var require = Config.require;return ' + value);
        return func(config);
    })
};

// html合并压缩
var html_pipe = function (config, dist, callback) {
    gulp.src(dir_src + '*.{html,php}', {base: dir_src})
        .pipe(through.obj(function (file, enc, callback) {

            if (file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
                return callback();
            }

            var htmlString = file.contents.toString();
            htmlString = tempConvert(htmlString, config);
            htmlString = sourceSet(htmlString, config.cdn_url);


            if (file.isBuffer()) {
                file.contents = new Buffer(htmlString);
            }

            // 确保文件进入下一个 gulp 插件
            this.push(file);

            // 告诉 stream 引擎，我们已经处理完了这个文件
            callback();

        }))
        .pipe(htmlmin({                             // 压缩html文件
            minifyCSS: true,                        // 压缩css
            removeComments: true,                   // 删除html注释
            minifyJS: true,                         // 压缩js
            caseSensitive: true,                    // 区分大小写
            collapseBooleanAttributes: true,        // 删除布尔属性值
            collapseWhitespace: true                // 关闭错误的标签
        }))
        .pipe(gulp.dest(dist))
        .on('end', function () {
            console.log('  √  '.green + 'HTML压缩合并完成');
            callback && callback();
        });
};

// 图片压缩
var images_pipe = function (src, dist, callback) {
    var image_stream = gulp.src([dir_src + src], {base: dir_src})
        .pipe(imagemin([imagemin.gifsicle(), imagemin.jpegtran(), imagemin.optipng(), imagemin.svgo()]));

    image_stream.pipe(gulp.dest(dist)).on('end', function () {
        console.log('  √  '.green + '图片压缩完成,路径：' + src.yellow);
        callback && callback();
    });
};


// less压缩
var css_pipe = function (src, config, dist, callback) {
    var css_stream = gulp.src([dir_src + src], {base: dir_src})
        .pipe(through.obj(function (file, enc, callback) {

            if (file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
                return callback();
            }

            if (file.isBuffer()) {
                file.contents = new Buffer(tempConvert(file.contents.toString(), config));
            }

            // 确保文件进入下一个 gulp 插件
            this.push(file);

            // 告诉 stream 引擎，我们已经处理完了这个文件
            callback();

        }))
        .pipe(less({
            plugins: [new lessPluginCleanCss()]
        }));

    css_stream.pipe(gulp.dest(dist)).on('end', function () {
        console.log('  √  '.green + 'CSS编译压缩完成,路径：' + src.yellow);
        callback && callback();
    });
};


// 压缩js
var js_pipe = function (src, config, dist, callback) {

    gulp.src([
        dir_src + src
    ], {base: dir_src})
        .pipe(through.obj(function (file, enc, callback) {

            if (file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
                return callback();
            }

            if (file.isBuffer()) {
                file.contents = new Buffer(tempConvert(file.contents.toString(), config));
            }

            // 确保文件进入下一个 gulp 插件
            this.push(file);

            // 告诉 stream 引擎，我们已经处理完了这个文件
            callback();

        }))
        .pipe(uglify())
        .pipe(gulp.dest(dist))
        .on('end', function () {
            console.log('  √  '.green + 'JS压缩完成,路径：' + src.yellow);
            callback && callback();
        });

};


// 监听修改
var watch_pipe = function (dist) {

    // 预处理任务列表
    var task_arr = [];
    // 计时器，防止重复执行任务
    var task_timer = null;
    // 执行列表任务
    var run_task = function () {

        clearTimeout(task_timer);

        task_timer = setTimeout(function () {

            console.log('\n任务队列开始： '.cyan + '打包环境 ' + dist.magenta + '，时间 ' + String(new Date().toLocaleString()).yellow + '\n');

            // 记录任务执行时间长
            var timeStamp = Date.now();

            var temp = {};

            // 任务列表去重
            var tasks = task_arr.filter(function (item) {
                if (!temp[item]) {
                    temp[item] = true;
                    return true;
                } else {
                    return false;
                }
            });

            task_arr.length = 0;

            var run = function(name) {
                if(globalTasks[name]){
                    globalTasks[name](function() {
                        var next = tasks.shift();
                        if(next){
                            run(next);
                        } else {
                            console.log('\n------------- ' + dist.magenta + ' 所有任务已完成！耗时 '.cyan +
                                String(((Date.now() - timeStamp) / 1000).toFixed(2)).yellow + ' s'.yellow +
                                ' -------------\n\n');
                        }
                    });
                } else {
                    console.error('globalTasks[' + name + '] 未定义！');
                }
            };

            run(tasks.shift());

        }, 300);
    };

    [
        {
            dir: '*.{html,php}',                                            // 监听路径
            task: ['version', 'html_' + dist]           // 执行的任务列表
        },
        {
            dir: 'images/*.{png,gif,jpg,svg}',
            task: ['images_' + dist]
        },
        {
            dir: '*.{png,gif,jpg,svg,ico}',
            task: ['image_ico_' + dist]
        },
        {
            dir: 'theme/**/**/*.{png,gif,jpg,svg}',
            task: ['image_theme_' + dist]
        },
        {
            dir: 'css/*.less',
            task: ['css_' + dist, 'version', 'html_' + dist]
        },
        {
            dir: 'theme/**/**/*.less',
            task: ['css_theme_' + dist, 'version', 'html_' + dist]
        },
        {
            dir: 'js/*.js',
            task: ['version', 'html_' + dist, 'alias', 'js_' + dist]
        },
        {
            dir: 'js/module/*.js',
            task: ['js_module_' + dist, 'version', 'html_' + dist, 'alias', 'js_' + dist]
        },
        {
            dir: 'js/plugin/*.js',
            task: ['js_plugin_' + dist, 'version', 'html_' + dist, 'alias', 'js_' + dist]
        },
        {
            dir: 'theme/*.js',
            task: ['js_theme_' + dist, 'version', 'html_' + dist]
        }
    ].forEach(function (item) {

            gulp.watch(dir_src + item.dir, function () {

                task_arr.push.apply(task_arr, item.task);
                run_task();

            }).on('added', function (event) {
                console.log(event.path.green + ' was ' + event.type.red);
            }).on('deleted', function (event) {
                console.log(event.path.green + ' was ' + event.type.red);
            }).on('change', function (event) {
                console.log(event.path.green + ' was ' + event.type.red);
            }).on('renamed', function (event) {
                console.log(event.path.green + ' was ' + event.type.red);
            });

        });
};


if (config) {


    // 修改资源版本号
    globalTasks['version'] = changeVersion;

    // 获取 seajs alias 文件列表
    globalTasks['alias'] = createAlias;

    // 全局编译方法
    var default_task = [];

    forEachIn(config, function (dist, conf) {

        var dir = 'dist_' + dist;

        default_task.push(dist);

        // html合并压缩
        globalTasks['html_' + dist] = function (callback) {
            html_pipe(conf, dir, callback);
        };

        // 图片压缩
        globalTasks['images_' + dist] = function (callback) {
            images_pipe('images/*.{png,gif,jpg,svg}', dir, callback);
        };
        globalTasks['image_ico_' + dist] = function (callback) {
            images_pipe('*.{png,gif,jpg,svg,ico}', dir, callback);
        };
        globalTasks['image_theme_' + dist] = function (callback) {
            images_pipe('theme/**/**/*.{png,gif,jpg,svg}', dir, callback);
        };


        // less 压缩
        globalTasks['css_' + dist] = function (callback) {
            css_pipe('css/*.less', conf, dir, callback);
        };
        globalTasks['css_theme_' + dist] = function (callback) {
            css_pipe('theme/**/**/*.less', conf, dir, callback);
        };


        // js 压缩
        globalTasks['js_module_' + dist] = function (callback) {
            js_pipe('js/module/*.js', conf, dir, callback);
        };
        globalTasks['js_plugin_' + dist] = function (callback) {
            js_pipe('js/plugin/*.js', conf, dir, callback);
        };
        globalTasks['js_' + dist] = function (callback) {
            js_pipe('js/*.js', conf, dir, callback);
        };
        globalTasks['js_theme_' + dist] = function (callback) {
            js_pipe('theme/*.js', conf, dir, callback);
        };


        // 监听列表
        gulp.task('watch_' + dist, function () {
            watch_pipe(dist);
        });

        // 默认任务列表
        gulp.task(dist, function () {

            console.log('\n任务队列开始： '.cyan + '打包环境 ' + dist.magenta + '，时间 ' + String(new Date().toLocaleString()).yellow + '\n');

            // 记录任务执行时间长
            var timeStamp = Date.now();

            // 任务数量
            var taskLen = 8;
            // 任务完成后显示提示信息
            var allFinishedCall = function() {
                if(--taskLen < 1){
                    console.log('\n------------- ' + dist.magenta + ' 所有任务已完成！耗时 '.cyan +
                        String(((Date.now() - timeStamp) / 1000).toFixed(2)).yellow + ' s'.yellow +
                        ' -------------\n\n');

                }
            };

            // 修改资源版本号
            changeVersion(allFinishedCall);

            // 压缩css
            css_pipe('css/*.less', conf, dir, function () {
                // html合并压缩
                html_pipe(conf, dir, allFinishedCall);
            });
            // 压缩主题css
            css_pipe('theme/**/**/*.less', conf, dir, allFinishedCall);

            // module 和 plugin js压缩完成后生成 Alias 列表
            var isFinishJs = 0;
            var finishJsCallback = function () {
                isFinishJs++;
                if (isFinishJs == 2) {
                    // 生成 Alias 列表
                    createAlias(function () {
                        // 压缩config.js
                        js_pipe('js/*.js', conf, dir, allFinishedCall);
                    });
                }
            };
            js_pipe('js/module/*.js', conf, dir, finishJsCallback);
            js_pipe('js/plugin/*.js', conf, dir, finishJsCallback);
            // 主题js
            js_pipe('theme/*.js', conf, dir, allFinishedCall);

            // 图片压缩
            images_pipe('images/*.{png,gif,jpg,svg}', dir, allFinishedCall);
            images_pipe('*.{png,gif,jpg,svg,ico}', dir, allFinishedCall);
            images_pipe('theme/**/**/*.{png,gif,jpg,svg}', dir, allFinishedCall);

            // 监听修改 watch
            watch_pipe(dist);


        });

    });

    // 默认任务
    gulp.task('default', default_task, function () {
        // console.log('运行所有任务： '.cyan + '时间 ' + String(new Date().toLocaleString()).yellow + '\n');
    });

}

