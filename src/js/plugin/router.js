/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/12/13 013
 * @description 单页应用页面路由插件
 *
 * html 多页面定义：
 * <div page-router="my_page_1.html?param=1"></div>
 * <div page-router="my_page_1.html?id=1001"></div>
 *
 * 注意：如果省略 pathname 则默认为当前页面
 *
 *
 * route(url, ignore)                                   // 手动路由到指定页面
 * onChange(handler)                                    // 添加页面切换回调事件
 * config(option)                                       // 配置页面切换样式
 * registerNode(node, url)                              // 手动注册DOM节点页面
 * register(url, callback[, is_default, is_route])      // js定义页面动作
 *
 *
 * @url [String] 页面url，例如 my_page_1.html?param=1
 * @is_route [Boolean] 是否需要初始化定位到当前页面
 * @is_default [Boolean] 当前页面是否是页面
 * @callback [Function] 页面回调方法
 * @ignore [Boolean] 是否取消加入历史记录
 * @handler [Function] 事件回调函数，返回页面url
 * @option [Object] 页面切换样式配置
 * @option.hideStyle [String] 页面显示样式，例如 'display:none'
 * @option.showStyle [String] 页面隐藏样式，例如 'display:block'
 *
 *
 * 例如：register('my_page_1.html?param=1', function() {
 *      log('this is my_page_1.html');
 * });
 *
 */

define('router', ['public', 'event'], function (require, exports) {

    var Public = require('public');
    var event = require('event');

    // 当前页面url
    var pathname = location.pathname;

    // 历史记录
    var historyQueue = [];

    // 路由页面列表
    var routerList = {};

    // 当前页面
    var currentPage = null;

    // 默认页面
    var defaultPage = null;

    var pageTimer = null;

    // 页面切换样式配置
    var Options = {
        hideStyle: 'display: none',
        showStyle: ''
    };

    // 翻页事件回调函数数组
    var RouteHandler = [];

    // 格式化url
    var normalizeURL = function (url) {
        var url_arr = url.split('#')[0].split('?');           // 删除hash，分割查询参数

        // url为空则默认为当前页面
        if (!url_arr[0]) {
            url_arr[0] = pathname;
        }

        var script = document.createElement('script');
        script.src = url_arr[0];

        var result_url = script.src;

        if (url_arr[1]) {

            // 格式化查询参数
            var search_param = decodeURIComponent(url_arr[1]).split('&');

            search_param.sort(function (a, b) {
                return a > b;
            });

            result_url += '?' + search_param.join('&');
        }

        script = null;

        return result_url;

    };

    // 判断两个路由地址是否相同
    var isSameURL = function (url, page_url) {
        var url_arr_1 = url.split('#')[0].split('?');
        var url_arr_2 = page_url.split('#')[0].split('?');

        var pathname_1 = (url_arr_1[0].match(/[^\/]+\.html?/g) || []).pop();
        var pathname_2 = (url_arr_2[0].match(/[^\/]+\.html?/g) || []).pop();

        return  (pathname_1 == pathname_2 ||
            (!pathname_1 && pathname_2 == pathname) ||
            (!pathname_2 && pathname_1 == pathname)) &&
            (url_arr_1[1] == url_arr_2[1]);

    };

    // 判断路由地址是否在路由列表中
    var isInRouteList = function (url) {
        var is_same = null;

        Public.forEachIn(routerList, function (name) {
            if (isSameURL(url, name)) {
                is_same = name;
                return false;
            }
        });

        return is_same;
    };

    // 页面路由（页面url）
    var pageRoute = function (url, ignore) {
        url = url || '';

        var key = normalizeURL(url);

        if (currentPage) {
            currentPage.elem.style.cssText = Options.hideStyle;
        }

        var page = routerList[key] || defaultPage;

        if (page) {
            page.elem.style.cssText = Options.showStyle;

            // 如果历史记录与最后一条不相同则触发事件
            if(currentPage != page){
                // 插入历史记录
                if(!ignore && (!historyQueue.length || normalizeURL(historyQueue[historyQueue.length - 1]) != key)){
                    historyQueue.push(url);
                    window.history.pushState(url, null, page.is_route ? url : window.location);
                }
            }

            // 触发页面回调
            if (Public.isFunction(page.handler)) {
                page.handler(page);
            }

        }

        RouteHandler.forEach(function(handler) {
            handler(page);
        });

        currentPage = page;

    };

    // 注册页面节点
    var registerNode = function(node, url) {
        var key = normalizeURL(url);

        if (!routerList[key]) {
            routerList[key] = {};
        }

        routerList[key].name = key;
        routerList[key].elem = node;
        routerList[key].url = url;

        node.style.cssText = Options.hideStyle;
    };

    // 获取路由页面节点
    [].slice.call(document.querySelectorAll('[page-router]')).forEach(function (item) {
        registerNode(item, item.getAttribute('page-router'));
        item.removeAttribute('page-router')
    });

    // 绑定链接跳转事件，如果是页内跳转则定位到路由页面
    document.body.addEventListener('click', 'a', function (e) {
        var href = this.getAttribute('href');

        if(!/^javascript:/.test(href)){
            var url = isInRouteList(normalizeURL(href));

            if (url) {
                e.stopPropagation();
                e.preventDefault();
                pageRoute(href);
            }
        }


    });

    // 监听返回按钮
    window.addEventListener("popstate", function (event) {

        var state = historyQueue.pop();
        var current_page = historyQueue.length ? historyQueue[historyQueue.length - 1] : '';

        if (state) {
            pageRoute(current_page, true);
        } else {
            pageRoute(event.state, true);
        }

    });


    return {

        // 根据url跳转到指定页面
        route: function(url, ignore) {
            pageRoute(url, !!ignore);
        },

        // 页面切换事件
        onChange: function(handler) {
            if(Public.isFunction(handler)){
                RouteHandler.push(handler);
            }
        },

        // 配置切换样式
        config: function(option) {
            if(Public.isObject(option)){
                Public.forEachIn(Options, function(key) {
                    if(option[key]) {
                        Options[key] = option[key];
                    }
                });

                Public.forEachIn(routerList, function(key, router) {
                    if(router != currentPage){
                        router.elem.style.cssText = Options.hideStyle;
                    } else {
                        router.elem.style.cssText = Options.showStyle;
                    }
                });
            }
        },

        // 注册页面对应DOM节点
        registerNode: registerNode,

        // 注册页面回调方法（页面url，回调函数， 是否默认页面）
        register: function (url, callback, is_default, is_route) {

            var key = normalizeURL(url);

            is_route = (typeof is_route === 'undefined' ? true : !!is_route);
            is_default = (typeof is_default === 'undefined' ? false : !!is_default);


            if (Public.isString(key) && Public.isFunction(callback) && routerList[key]) {

                // 页面回调函数
                routerList[key].handler = callback;

                // 是否需要加入路由列表
                routerList[key].is_route = is_route;

                if (is_route && isSameURL(key, normalizeURL(location.href))) {
                    // 优先url路由页面
                    pageRoute(url, true);
                }

                if(is_default){
                    defaultPage = routerList[key];
                }
            }

            clearTimeout(pageTimer);

            pageTimer = setTimeout(function() {
                if(!currentPage) {
                    pageRoute(null, true);
                }
            }, 10);

        }
    };
});

