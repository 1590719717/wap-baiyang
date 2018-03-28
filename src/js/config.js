/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/3/31
 * @version 1.0.0
 * @description config
 */

// 引入 seajs
{{require('js/plugin/sea.js')}}

// 本地缓存机制
(function(localCache, sessionCache, cookieCache, win, dom, ls, ss) {

    // 是否支持 localStorage
    var is_support = typeof ls !== 'undefined' &&  typeof ss !== 'undefined';

    try {
        ls.setItem('test_ls', '1');
        ls.removeItem('test_ls');
        ss.setItem('test_ls', '1');
        ss.removeItem('test_ls');
    } catch (e) {
        is_support = false;
    }

    // 获取缓存
    var getItem = function(storage) {
        if(storage && is_support){
            return function(name) {
                return storage.getItem(name);
            }
        } else {
            return function(name) {
                var reg = new RegExp('(^|; )' + name + '=([^;]*)(;|$)');
                return unescape((dom.cookie.match(reg) || [])[2] || '');
            }
        }
    };

    // 设置缓存
    var setItem = function(storage) {
        if(storage && is_support){
            return function(name, value) {
                storage.setItem(name, value);
            }
        } else {

            return function(name, value, date) {

                var domain = '', path = '; path=/', expires = '';

                var hosts = /^(\w+\.)?(\w+)\.(\w+)$/.exec(location.host);

                if(date){
                    expires = '; expires=' + date.toGMTString();
                }

                if(hosts){
                    domain = '; domain=' + hosts[2] + '.' + hosts[3];
                }

                dom.cookie = name + '=' + escape(value) + expires + path + domain;
            }
        }
    };

    // 删除缓存
    var removeItem = function(storage) {
        if(storage && is_support){
            return function(name) {
                storage.removeItem(name);
            }
        } else {
            return function(name) {
                var date = new Date('1970/1/1');
                this.setItem(name, '', date);
            }
        }
    };

    // 清除所有缓存
    var clear = function(storage) {
        if(storage && is_support){
            return function() {
                storage.clear();
            }
        } else {
            return function() {
                var cookie = this;
                var keys = dom.cookie.match(/[^ =;]+(?=\=)/g);
                var date = new Date('1970/1/1');

                if (keys && keys.length) {
                    keys.forEach(function(name) {
                        cookie.setItem(name, '', date);
                    });
                }
            }
        }
    };

    win[localCache] = {
        is_support_ls: is_support,
        setItem: setItem(ls),
        getItem: getItem(ls),
        removeItem: removeItem(ls),
        clear: clear(ls)
    };

    win[sessionCache] = {
        is_support_ss: is_support,
        setItem: setItem(ss),
        getItem: getItem(ss),
        removeItem: removeItem(ss),
        clear: clear(ss)
    };

    win[cookieCache] = {
        setItem: setItem(),
        getItem: getItem(),
        removeItem: removeItem(),
        clear: clear()
    };

})('localCache', 'sessionCache', 'cookieCache', window, document, localStorage, sessionStorage);

// 全站配置
(function(config, seajs, dom, win, localCache, sessionCache, cookieCache) {

    var html = dom.documentElement;


    win.Config = config;

    // ajax请求地址
    config.url = '{{Config.ajax_url}}';

    // cdn 路径
    config.cdn = '{{Config.cdn_url}}';

    // 扫码登录 appid
    config.scan_code = '{{Config.login_appid}}';

    if(!config.cdn){
        config.cdn = seajs.data.cwd;
    }

    var auth_url = '{{Config.auth_url}}';

    // 微信授权地址
    if(auth_url){

        // 添加育学园或百洋标志
        var user_mark = 'state:1*type:' + (win.localStorage.getItem('yxy_type') || 0 ) + '*userTag:' + (win.localStorage.getItem('yxy_userTag') || 0 ) + '*identifying:' + (win.localStorage.getItem('yxy_identifying') || 'baiyangwang' );

        auth_url +=  encodeURIComponent(config.url + 'wap/wechat_login/wx_callback/' +
        encodeURIComponent(location.href.replace(/^\w+:\/\//, '').replace(/[!*()]/g, '')));

        config.default_auth = auth_url + '&response_type=code&scope=snsapi_base&state=0#wechat_redirect';

        config.user_auth = auth_url + '&response_type=code&scope=snsapi_userinfo&state=' + user_mark + '#wechat_redirect';

    }


    // 设备/平台信息
    config.platform = (function() {
        var userAgent = win.navigator.userAgent;
        var platform = win.navigator.platform;

        var testResult = {
            isFromMobile: /AppleWebKit.*Mobile.*/.test(userAgent) || /i(Phone|P(o|a)d)/gi.test(platform),   // 移动端
            isFromAndroid: /android/gi.test(userAgent),                                         // 安卓
            isFromIos: /iphone|ipod|ipad|ios/gi.test(userAgent),                                // 苹果设备
            isFromWx: /MicroMessenger/gi.test(userAgent),                                       // 微信
            isFromQQ: /mobile.*qq/gi.test(userAgent),                                           // QQ
            isFromUC: /ucbrowser/gi.test(userAgent),                                            // UC
            isFromQQBrower: /mqqbrowser[^LightApp]/gi.test(userAgent),                          // QQ浏览器
            isFromQQBrowerLight: /MQQBrowserLightApp/gi.test(userAgent),                        // QQ内置浏览器
            isFromBaiYangApp: /\bbaiyang\b/gi.test(userAgent),                                  // 百洋APP
            byAppVersion: (userAgent.match(/\bBaiYang V([\d\.]+)\b/i)||[])[1] || '',            // 百洋APP版本号
            isFromYXYApp: /CYTYXY/gi.test(userAgent),                                           // 育学园APP
            isFromBYTouchMachine: /\bBaiYangTouchMachine\b/gi.test(userAgent),                  // 触屏机
            isFromWochacha: /\bWochacha\b/gi.test(userAgent),                                   // 我查查app
            isFromPc: /\bWindows|Macintosh\b/gi.test(userAgent),                                // 判断是否在PC端
            DeviceId: (userAgent.match(/\bDeviceId\/(\w+)\b/i)||[])[1] || ''                    // 触屏机设备号
        };

        var className = [], classList = html.classList;

        testResult.isFromMobile && className.push('mobile');
        testResult.isFromAndroid && className.push('android');
        testResult.isFromIos && className.push('ios');
        testResult.isFromWx && className.push('weixin');
        testResult.isFromBaiYangApp && className.push('baiyang-app');
        testResult.isFromBYTouchMachine && className.push('by-touch-machine');
        testResult.isFromWochacha && className.push('wochacha');
        testResult.isFromPc && className.push('pc-view');
        testResult.isFromYXYApp && className.push('yxy-app');

        className.length && classList.add.apply(classList, className);

        return testResult;
    })();

    var scripts = dom.scripts,
        script = scripts[scripts.length - 1],
        src = script.hasAttribute ? script.src : script.getAttribute("src", 4);

    // js 版本号
    config.version = '{{Config.version}}';

    // js 基础路径
    config.dir = src = src.match(/[^?#]*\//)[0];

    // 开启调试模式
    config.debug = !!(Number('{{Config.debug}}') && decodeURI((location.search.substr(1).match(/(^|&)(debug|debug_ajax)=([^&]*)(&|$)/) || [])[2] || ''));

    /*
    * html 缓存与js应用缓存
    *
    * appcache 缓存html文件
    * localStorage 缓存js文件
    *
    */
    var cacheName = config.version;

    // js脚本缓存对象
    var scriptCache = (function() {
        var stack = {},                                  // js 加载记录，防止重复加载
            cache_name = '__script_cache__',             // js 缓存名称
            cache;                                       // js 缓存

        // 获取缓存脚本
        try{
            cache = JSON.parse(localCache.getItem(cache_name));
        } catch (e) {
            cache = {
                version: cacheName,
                script: {}
            }
        }

        if(({}).toString.call(cache) !== '[object Object]'){
            cache = {
                version: cacheName,
                script: {}
            }
        }
        if(cache.version != cacheName || ({}).toString.call(cache.script) !== '[object Object]'){
            cache.version = cacheName;
            cache.script = {};
        }

        return {
            // 缓存对象
            cache: cache,

            // 将缓存文件写入到页面中
            get_cache: function(id) {
                if(cache.script[id] && !stack[id]){
                    stack[id] = true;
                    new Function(cache.script[id])();
                }
            },

            // 将 js 写入到缓存中
            set_cache: function(cmd) {
                if(!cache.script[cmd.id] && localCache.is_support_ls){
                    // define 函数
                    var factory = cmd.factory.toString();
                    var code = 'define("' + cmd.id + '",';

                    // 依赖关系
                    code += '["' + cmd.deps.join('","') + '"],';

                    code += factory + ')';

                    cache.script[cmd.id] = code;
                    localCache.setItem(cache_name,  JSON.stringify(cache));
                }
            }
        };
    })();


    // 预加载 js
    seajs.on('resolve', function(e) {
        if(e.id){
            scriptCache.get_cache(e.id);
        }
    });

    // js 写入到缓存
    seajs.on('define',  function(e) {
        if(e.id && !scriptCache.cache.script[e.id]){
            scriptCache.set_cache(e);
        }
    });

    /*
    * seajs配置
    *
    * charset 编码
    * base 静态资源根目录
    * alias 资源路径
    *
    */
    seajs.config({
        charset: 'utf-8',
        base: config.dir,
        alias: JSON.parse('{{Config.alias}}')
    });


    // 错误调试
    if(config.debug) {
        seajs.use('log', function(log) {
            win.onerror = function(msg, url , line){
                log("Error: " + msg, "URL: " + url, "Line: " + line);
                return false;
            };
        });
    }

    // 如果是触屏机则加载触屏机脚本
    if(config.platform.isFromBYTouchMachine){
        seajs.use('touch-machine');
    }


    /*
    * 是否支持 vw 字体单位
    * 不支持 vw 的字体根据屏幕尺寸转换成 px
    */
    var isSupportVw = false;
    if(sessionCache.getItem('__is_support_vw__')){
        isSupportVw = !!Number(sessionCache.getItem('__is_support_vw__'));
    } else {
        // 根节点字体大小设置
        var span = dom.createElement('span');
        span.style.cssText = 'display: inline-block; width: 100vw';
        dom.body.appendChild(span);

        if(span.offsetWidth == html.offsetWidth){
            sessionCache.setItem('__is_support_vw__',  1);
            isSupportVw = true;
        } else {
            sessionCache.setItem('__is_support_vw__',  0);
            isSupportVw = false;
        }

        dom.body.removeChild(span);
    }

    var setFontSize = function() {
        var pageRatio = html.offsetWidth / win.innerWidth;
        if(isSupportVw) {
            html.style.fontSize = pageRatio * 3.75 + 'vw';
        } else {
            html.style.fontSize = win.innerWidth / 100 * pageRatio * 3.75 + 'px';
        }

    };

    // 我查查app兼容代码
    if(config.platform.isFromWochacha) {
        dom.body.style.height = screen.height + 'px';

        setTimeout(function() {
            html.style.height = dom.body.style.height = win.innerHeight + 'px';
        }, 500);
    }

    // 设置页面字体大小
    win.onorientationchange = win.onresize = setFontSize;
    setFontSize();

    // 微信授权
    var wx_authorize_stamp = sessionCache.getItem('__wx_authorize__');
    var user_unionid = cookieCache.getItem('user_unionid') || localCache.getItem('user_unionid') || '';

    if(auth_url && config.platform.isFromWx && !user_unionid && !wx_authorize_stamp) {

        sessionCache.setItem('__wx_authorize__',  Date.now());

        setTimeout(function() {
            win.location = config.user_auth;
        }, 0);

    }
	win._elqQ = [];
    // 延迟加载监测代码
    win.onload = function() {
        //baidu tongji
        (function() {
            var hm = dom.createElement("script");
            hm.src = "//hm.baidu.com/hm.js?689c4766b318b421f5e819eb7da70e00";
            dom.body.appendChild(hm);
            //数据分析
            var _maq = _maq || [];
            _maq.push(['_setAccount','CCA-9527-1']);
            _maq.push(['_trackPageview']);
            win._maq = _maq;
            var Analytics = document.createElement('script');
            Analytics.type = 'text/javascript';Analytics.async = true;
            Analytics.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://')
                    + 'tmsstatic.baiyjk.com/js/analytics/myAnalytics.js';
            dom.body.appendChild(Analytics);

        })();
        //ga
        (function(win,dom,script,url,name,js){
            win['GoogleAnalyticsObject'] = name;
            win[name] = win[name] || function(){
                (win[name].q=win[name].q||[]).push(arguments)
            };
            win[name].l=1*new Date();
            js=dom.createElement(script);
            js.async=1;
            js.src=url;dom.body.appendChild(js);
        })(win,dom,'script','https://www.google-analytics.com/analytics.js?v=' + config.version,'ga');

        try{
            ga('create', 'UA-74694706-2', 'auto');
            ga('send', 'pageview');
        } catch(e) {}
        
		//GrowingIO Analytics code version 2.1
		(function(e,t,n,g,i){e[i]=e[i]||function(){(e[i].q=e[i].q||[]).push(arguments)},n=t.createElement("script"),tag=t.getElementsByTagName("script")[0],n.async=1,n.src=('https:'==document.location.protocol?'https://':'http://')+g,tag.parentNode.insertBefore(n,tag)})(window,document,"script","assets.growingio.com/2.1/gio.js","gio");
		try{
            gio('init', 'b379b70b07cdd67f', {});
            gio('send');
        } catch(e) {}
    };

})({}, seajs, document, window, localCache, sessionCache, cookieCache);

