/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/14 014
 * @description Exbind 扩展插件
 */

define('widget', ['exbind', 'event', 'member', 'public', 'ajax', 'popup', 'router', 'mvvm', 'app-url'], function (require, exports) {
    var exbind = require('exbind');
    var event = require('event');
    var member = require('member');
    var Public = require('public');
    var ajax = require('ajax');
    var popup = require('popup');
    var router = require('router');
    var MVVM = require('mvvm');
    var appUrl = require('app-url');

    var win = window,
        dom = document,
        html = dom.documentElement,
        body = dom.body,
        config = win.Config,
        localCache = win.localCache,
        platform = config.platform;

    // 页面弹窗fix禁止滚动
    var fixPage = function (is_fix) {
        if (!!is_fix) {
            html.classList.add('fixed-popup');
        } else {
            html.classList.remove('fixed-popup');
        }
    };


    // 获取url参数
    var urlParam = Public.getUrlParam();

    // 头部公共弹出菜单
    exbind.register('menu', 'load', function (e) {
        var btn = this,
            menu = dom.getElementById(e.param.id || 'top-nav'),
            isOpen = false;

        if (menu) {
            btn.addEventListener('touchstart', function (e) {
                e.stopPropagation();
                e.preventDefault();
                menu.style.display = isOpen ? 'none' : 'block';
                isOpen = !isOpen;
            });
            menu.addEventListener('click', function (e) {
                menu.style.display = 'none';
                isOpen = false;
            });
            dom.addEventListener('touchstart', function (e) {
                if (!menu.isEqualNode(e.target) && !menu.contains(e.target)) {
                    menu.style.display = 'none';
                    isOpen = false;
                }
            });
        }

    });

    /* 日历控件
     * param： range 日历选择范围 1：只能选择今天以前的日期  2：只能选择今天以后的日期
     */
    exbind.register('calendar', 'load', function (e) {
        var param = e.param,
            node = this;

        require.async('calendar', function (Calendar) {
            var option = {
                'target': node,               // 触发日历的HTML节点
                'event': 'click',             // 触发事件
                'format': 'Y-M-D'             // 日期格式
            };

            if (param.range == '1') {
                option.max = new Date();       // 最大日期
            } else if (param.range == '2') {
                option.min = new Date();      // 最小日期
            }

            new Calendar(option)
        });
    });

    /*
     * 搜索弹窗
     * is_global: 是否是海外优选
     * keyword:   默认关键词(如果没有传递则从url获取)
     * */
    exbind.register('search', 'load', (function () {

        var searchPopup = (function () {

            var isReady = false, searchCall = [], keyInput, vmData;

            var temp = '<div class="wrap search-wrap box" vm-controller="search">' +
                '<form class="search-box" id="form-search">' +
                '<a href="javascript:history.back();" class="btn-close">&times;</a>' +
                '<input id="key-input" type="text" vm-value="key" class="search-input" placeholder="请输入关键词进行搜索"/>' +
                '<a href="javascript:;" vm-on-click="search()" class="btn-search"><i class="icon icon-search"></i></a>' +
                '</form>' +

                '<section class="flex">' +
                '<div class="flex-content" vm-html="hot_key+history_key+word_list+key+flag_name">' +
                '<script type="text/html">' +
                '<% if(!word_list || !word_list.length){ %>' +
                '<% if(history_key && history_key.length){ %>' +
                '<h3 class="title clear">' +
                '<span class="pull-left">最近搜索</span>' +
                '<span vm-on-click="clear_history()" class="pull-right"><i class="icon-trash"></i></span>' +
                '</h3>' +
                '<ul class="keyword-list clear">' +
                '<% history_key.forEach(function(item) { %>' +
                '<li><a href="javascript:;" vm-on-click="search(\'<%= item %>\')"><%= unescape(item) %></a></li>' +
                '<% }); %>' +
                '</ul>' +
                '<% } %>' +
                '<h3 class="title clear">' +
                '<span class="pull-left">热门搜索</span>' +
                '</h3>' +
                '<ul class="keyword-list clear">' +
                '<% if(hot_key && hot_key.length){ %>' +
                '<% hot_key.forEach(function(item) { %>' +
                '<li><a href="javascript:;" vm-on-click="search(\'<%= item %>\')"><%= unescape(item) %></a></li>' +
                '<% }); %>' +
                '<% } %>' +
                '</ul>' +
                '<% } else { %>' +
                '<ul class="word-tip">' +
                '<% word_list.forEach(function(item) { %>' +
                '<li class="row">' +
                '<a href="javascript:;" class="col-8" vm-on-click="search(\'<%= item.name %>\')"><%= unescape(item.name) %></a>' +
                '<span class="col-4">约<%= item.result_count %>条</span>' +
                '</li>' +
                '<% }); %>' +
                '</ul>' +
                '<% } %>' +
                '</script>' +
                '</div>' +
                '</section>' +
                '</div>';


            var layout = dom.getElementById('search-layout');

            if (!layout) {
                layout = dom.createElement('article');
                layout.className = 'search-layout';
                layout.id = 'search-layout';
                layout.style.display = 'none';
                body.appendChild(layout);
            }


            // 获取历史搜索
            var getHistory = function () {
                var historyStr = localCache.getItem('_history_search_') || '';
                var history = String(historyStr).split(',').filter(function (item) {
                    var word = item.trim();
                    return word && !/^undefined|null$/.test(word);
                });

                if (history && history.length) {
                    if (history && history.length > 15) {
                        history.length = 15;
                    }
                    return history;
                } else {
                    return [];
                }

            };

            // 设置历史搜索
            var setHistory = function (key) {
                var historyArr = getHistory();

                if (historyArr.indexOf(key) >= 0) {
                    historyArr.splice(historyArr.indexOf(key), 1);
                }
                historyArr.unshift(key);

                if (historyArr.length) {
                    localCache.setItem('_history_search_', historyArr.join(','));
                }
            };

            var search = function (key) {
                setHistory(escape(String(key).trim()));

                searchCall.forEach(function (func) {
                    func(key);
                });
            };

            // 获取搜索词提示
            var wordXHR = null;
            var searchWord = function () {

                ({}).toString.call(wordXHR) === '[object XMLHttpRequest]' && wordXHR.abort();

                wordXHR = ajax({
                    type: 'post',
                    url: Config.url + 'background/Search/search_word',
                    data: {
                        token: member.token,
                        searchName: vmData.key
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data && data.data && Number(data.data[0].result_count) > 0) {
                            vmData.word_list = data.data.map(function (item) {
                                vmData.flag_name = item.name;
                                item.name = escape(item.name);
                                return item;
                            });

                        } else {
                            vmData.word_list = [];
                        }
                    }
                });

            };


            var ready = function () {

                if (!isReady) {
                    isReady = true;

                    MVVM.template.helper('unescape', unescape);

                    layout.innerHTML = temp;

                    // 输入框
                    keyInput = dom.getElementById('key-input');

                    vmData = MVVM.define('search', {
                        key: '',                        // 输入关键词
                        hot_key: [],                    // 热搜词
                        word_list: [],                  // 搜索词提示
                        history_key: getHistory(),      // 历史搜索
                        search: function (key) {            // 点击搜索
                            search(key ? unescape(key) : vmData.key);
                        },
                        clear_history: function () {     // 清除历史记录
                            popup.confirm('确认删除搜索记录？', function () {
                                vmData.history_key = [];
                                localCache.removeItem('_history_search_');
                            });
                        },
                        flag_name: ''                     //搜索词结果返回结果 flag
                    });

                    // 获取热搜词
                    ajax({
                        type: 'post',
                        url: Config.url + 'wap/search/hotsearch',
                        data: {
                            token: member.token
                        },
                        dataType: 'json',
                        cache: function (data) {
                            if (data && data.data && data.data.length) {
                                vmData.hot_key = data.data.map(function (item) {
                                    return escape(item);
                                });
                            }
                        },
                        success: function (data) {
                            if (data && data.data && data.data.length) {
                                vmData.hot_key = data.data.map(function (item) {
                                    return escape(item);
                                });
                            }
                        }
                    });

                    setTimeout(function () {
                        keyInput.focus();
                    }, 1000);

                    // 搜索词提示
                    var inputTimer = null;
                    keyInput.addEventListener('input', function () {
                        clearTimeout(inputTimer);
                        inputTimer = setTimeout(function () {
                            searchWord();
                        }, 300);
                    });

                    // 表单提交搜索
                    dom.getElementById('form-search').addEventListener('submit', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        search(vmData.key);
                    });
                }


            };

            return {
                elem: layout,

                onSearch: function (handler) {
                    searchCall.push(handler);
                },

                show: function (keyword) {

                    layout.style.display = 'block';

                    ready();
                    vmData && (vmData.key = keyword || '');

                },
                hide: function () {
                    layout.style.display = 'none';
                    keyInput && keyInput.blur();

                }
            }

        })();


        return function (e) {
            var btn = this;
            var is_global = e.param.is_global || '';
            var keyword = e.param.keyword || '';

            // 默认搜索词
            !keyword && (keyword = urlParam.keyword);

            searchPopup.onSearch(function (keyword) {
                win.location = '/product-list.html?keyword=' + encodeURIComponent(keyword) + '&is_global=' + encodeURIComponent(is_global);
            });

            //点击打开弹窗
            btn.addEventListener('click', function () {
                searchPopup.show(keyword);
                router.route('?search');
            });

            router.registerNode(searchPopup.elem, '?search');

            router.register('?search', (function () {

                // 页面切换事件
                router.onChange(function (page) {

                    if (!page || !/\?search/.test(page.name)) {
                        // 如果是当前页面
                        searchPopup.hide();
                        fixPage();
                    }

                });

                return function () {
                    searchPopup.show(keyword);
                    fixPage(true);
                }

            })(), 0, 0);
        };

    })());

    // 小能客服
    exbind.register('ntkf', 'load', function (e) {
        var btn = this;

        /*
         * type:             // 客服类型
         * itemid:           // 商品id
         * itemparam:        // 商品接口扩展字段
         * orderid:          // 订单ID
         * orderprice:       // 订单总价
         * */
        var param = e.param;

        // 客服类型
        var customer = [
            'by_1000_1461118467943',    // 售前咨询
            'by_1000_1461721806492',    // 售后咨询
            'by_1000_1461118352684'     // 药师咨询
        ];

        // 打开小能客服
        var openNTKF = function () {
            require.async('//dl.ntalker.com/js/b2b/ntkfstat.js?siteid=by_1000', function () {
                var type = param.type && customer[Number(param.type)] ? customer[Number(param.type)] : customer[0];
                NTKF.im_openInPageChat(type);
            });
        };

        win.NTKF_PARAM = {
            erpparam: platform.isFromWx ? '85' : '91',
            siteid: "by_1000",                              //企业ID，必填,为固定值
            settingid: "by_1000_1461118467943",             //客服接待组配置ID，必填
            uid: '',                                        //用户ID，未登录可以为空，但是不能给null，uid赋予的值在显示到小能客户端
            uname: '',                                      //用户名，未登录可以为空，但是不能给null，uname赋予的值显示到小能客户端
            isvip: 0,                                       //是否为vip用户，0代表非会员，1代表会员，取值显示到小能客户端
            userlevel: ''                                   //网站自定义会员级别，1-N，可根据选择判断，取值显示到小能客户端
        };

        // 客服参数
        param.itemparam && (NTKF_PARAM.itemparam = param.itemparam);
        param.itemid && (NTKF_PARAM.itemid = param.itemid);
        param.orderid && (NTKF_PARAM.orderid = param.orderid);
        param.orderprice && (NTKF_PARAM.orderprice = param.orderprice);

        // 获取会员信息
        member.onLogin(function () {
            NTKF_PARAM.isvip = 1;
            NTKF_PARAM.uid = member.userInfo.phone;
            NTKF_PARAM.uname = member.userInfo.nickname;
            NTKF_PARAM.userlevel = 1;
        });

        // 点击打开小能客服
        btn.addEventListener('click', function () {
            // 监测代码
            try {
                if (param.type && param.type == 2) {
                    ga('send', 'event', '咨询药师', '在线咨询', win.location.pathname.replace(/[^\d]/g, ''));
                } else {
                    ga('send', 'event', '咨询药师', '点击咨询', win.location.pathname.replace(/[^\d]/g, ''));
                }

            } catch (e) {
            }

            openNTKF();
        });
    });

    // toggle class
    exbind.register('toggle', 'load', function (e) {
        var node = this,
            className = e.param.class,
            eventName = e.param.event || 'click',
            eventTarget = e.param.target,
            hasClass = [].slice.call(node.classList).indexOf(className) > -1;

        var handler = function () {
            if (hasClass) {
                node.classList.remove(className);
            } else {
                node.classList.add(className);
            }
            hasClass = !hasClass;
        };

        if (eventTarget) {
            node.addEventListener(eventName, eventTarget, handler);
        } else {
            node.addEventListener(eventName, handler);
        }
    });

    /**
     * 全选复选框
     * 控件名称：data-act="select"
     * 控件参数：data-param="class=@class&type=@type"
     *
     * @class：需要全选的复选框按钮组的class名称
     * @type：全选类型  1（只有全部按钮选中，全选按钮才会勾上）|2（只要有一个按钮选中，全选按钮就会勾上）
     */
    exbind.register('select', 'load', function (e) {
        var elem = this,
            inputGroup,
            name = e.param['class'],
            type = e.param['type'] || 1;

        if (name) {
            inputGroup = [].slice.call(dom.querySelectorAll('input[type="checkbox"].' + name));

            elem.__select_down__ = function (isChecked) {
                // 向下全选事件
                inputGroup.forEach(function (input) {
                    input.checked = isChecked;
                    // 向下全选事件
                    input.__select_down__ && input.__select_down__(isChecked);
                });
            };

            // 绑定点击事件
            elem.off('click.select').on('click.select', function () {
                var isChecked = this.checked;
                // 向下全选事件
                elem.__select_down__ && elem.__select_down__(isChecked);
                // 向上全选事件
                elem.__select_up__ && elem.__select_up__(isChecked);
            });

            inputGroup.forEach(function (input) {
                input.__select_up__ = function (isChecked) {
                    var isSelectAll = isChecked;
                    if (type == '1') {
                        inputGroup.forEach(function (input) {
                            if (!input.checked) {
                                isSelectAll = false;
                            }
                        });
                    } else if (type == '2') {
                        inputGroup.forEach(function (input) {
                            if (input.checked) {
                                isSelectAll = true;
                            }
                        });
                    }
                    elem.checked = isSelectAll;

                    // 向上全选事件
                    elem.__select_up__ && elem.__select_up__(isSelectAll);
                };
                input.off('click.select').on('click.select', function () {
                    var isChecked = this.checked;
                    // 向下全选事件
                    input.__select_down__ && input.__select_down__(isChecked);
                    // 向上全选事件
                    input.__select_up__ && input.__select_up__(isChecked);
                });

                input.__select_up__(input.checked);
            });
        }
    });

    /* tab选项卡
     * tab标题类名 js-tab-title
     * tab内容类名 js-tab-content
     *
     */
    exbind.register('tab', 'load', function () {
        var node = this;

        var tabTitle = [].slice.call(node.querySelectorAll('.js-tab-title'));
        var tabContent = [].slice.call(node.querySelectorAll('.js-tab-content'));

        var currentTitle = tabTitle[0], currentContent = tabContent[0];

        tabTitle.forEach(function (title, index) {
            title.addEventListener('click', function () {
                currentTitle.classList.remove('active');
                currentTitle = title;
                currentTitle.classList.add('active');

                currentContent.classList.add('hide');
                currentContent = tabContent[index];
                currentContent.classList.remove('hide');
            });
            title.classList.remove('active');
            tabContent[index].classList.add('hide');
        });

        currentTitle.classList.add('active');
        currentContent.classList.remove('hide');
    });

    /* 首页顶部轮播插件
     *
     * auto: 是否自动轮播 0 不自动轮播 1 自动轮播 默认1
     * */
    exbind.register('swipe', 'load', function (e) {
        var wrap = this,
            auto = !!Number(e.param.auto || 1),
            scrollIndex = Number(e.param.index) || 0,
            list = this.children[0],
            item = [].slice.call(list.children),
            winWidth = wrap.clientWidth;

        if (winWidth == 0) {
            winWidth = win.innerWidth;
        }

        if (item.length > 1) {

            var circle = dom.createElement('div'),
                circleInner = '',
                timer = null;

            circle.className = 'scroll-icon';

            list.style.width = winWidth * item.length + 'px';
            item.forEach(function (li, i) {
                circleInner += '<span' + (i == scrollIndex ? ' class="active"' : '') + '></span>';
                li.style.width = winWidth + 'px';
            });
            circle.innerHTML = circleInner;
            wrap.appendChild(circle);

            var circleItem = [].slice.call(circle.children),
                defaultItem = circleItem[scrollIndex];

            // 取消默认事件
            var preventDefault = function (e) {
                e.preventDefault();
                e.stopPropagation();
            };

            var autoScroll = function () {
                clearInterval(timer);
                // 自动轮播
                if (auto) {
                    timer = setInterval(function () {
                        scrollIndex++;
                        if (scrollIndex >= item.length) {
                            scrollIndex = 0;
                        }
                        scroll();
                    }, 3000);
                }
            };

            var scroll = function () {
                list.style.transition = list.style.webkitTransition = 'all .3s ease';
                setTimeout(function () {
                    defaultItem && defaultItem.classList.remove('active');
                    circleItem[scrollIndex].classList.add('active');
                    defaultItem = circleItem[scrollIndex];
                    list.style.transform = list.style.webkitTransform = 'translateX(' + (-winWidth * scrollIndex) + 'px)';
                    wrap.setAttribute('scroll-index', scrollIndex + 1 + '/' + item.length) ;
                }, 10);
            };

            wrap.addEventListener('touchstart', function () {
                list.style.transition = list.style.webkitTransition = 'none';
                clearInterval(timer);
            });
            wrap.addEventListener('swipe', function (e) {
                var diffX = e.data.diffX.keys(0),
                    diffY = e.data.diffY.keys(0);

                if (Math.abs(diffX) > Math.abs(diffY)) {
                    preventDefault(e);

                    list.style.transform = list.style.webkitTransform = 'translateX(' + (-winWidth * scrollIndex + diffX) + 'px)';
                }
            }).addEventListener('swipeEnd', function (e) {
                var diffX = e.data.diffX.keys(0),
                    diffY = e.data.diffY.keys(0);

                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 0) {
                        scrollIndex--;
                        if (scrollIndex < 0) {
                            scrollIndex = 0
                        }
                    } else {
                        scrollIndex++;
                        if (scrollIndex >= item.length) {
                            scrollIndex = item.length - 1;
                        }
                    }
                }

                autoScroll();
                scroll();
            }).addEventListener('swipeLeft', preventDefault)
                .addEventListener('swipeRight', preventDefault)
                .addEventListener('swipeEnd', preventDefault);

            scroll();
            autoScroll();
        } else {
            wrap.setAttribute('scroll-index', scrollIndex + 1 + '/' + item.length) ;
        }
    });

    /**
     *  图片延时加载
     *  src 延时加载图片链接
     *  style 延时加载背景图
     */
    exbind.register('lazy', 'load', (function () {
        var load_img_size = 0,
            img_arr = [];

        var load_img = function () {
            if (img_arr.length && load_img_size < 3) {
                var item = img_arr.shift(), img = null;

                if (item.type == 'src') {
                    img = item.node;
                } else if (item.type == 'style') {
                    img = new Image();
                    item.node.style.backgroundImage = 'url(/images/default-img.png)';
                }

                img.onload = img.onerror = function (e) {

                    load_img_size--;
                    load_img();

                    if (e.type == 'error') {
                        img.src = '/images/default-img.png';
                    }

                    if (item.type == 'style') {
                        item.node.style.backgroundImage = 'url(' + img.src + ')';
                    }
                };

                img.src = item.src;
                load_img_size++;
            }
        };

        return function (e) {
            var node = this,
                param = e.param;

            if (param.src) {
                img_arr.push({
                    node: node,
                    src: param.src || '/images/default-img.png',
                    type: 'src'
                });
            } else if (param.style) {
                img_arr.push({
                    node: node,
                    src: param.style || '/images/default-img.png',
                    type: 'style'
                });
            }

            load_img();
        }
    })());

    /**
     *  页脚菜单
     */
    exbind.register('footer', 'load', function () {
        var footer = this;
        var tempNode = footer.querySelector('script');
        var tempRender = tempNode && MVVM.template.compile(tempNode.innerHTML);

        // 获取首页底部入口
        var renderMenu = function (data) {
            popup.loading('hide');

            if (data && data.code == 200 && data.data.length) {

                // 获取当前URL路径
                var pathname = location.href.split('?')[0];

                data.data.forEach(function (item) {
                    var href = appUrl.app_to_wap(item.location);

                    // 获取URL路径
                    var script = document.createElement('script');
                    script.src = href.href;

                    var filename = script.src.split('?')[0];

                    item.is_current = pathname.toLowerCase() === filename.toLowerCase();


                    if(platform.isFromBaiYangApp) {

                        item.location = 'href="' + appUrl.wap_to_app(item.location) + '"';

                    } else {

                        var link = '';

                        for(var attr in href){
                            if(href.hasOwnProperty(attr)){
                                link += attr + '=' + href[attr] + ' ';
                            }
                        }

                        item.location = link;
                    }



                });

                footer.innerHTML = tempRender({main_menu: data.data});

            } else {

                footer.innerHTML = tempRender({main_menu: []});
            }

        };
        //TODO    上线时要把 position_id 改为43
        ajax({
            type: 'post',
            url: Config.url + 'background/home_page/main_menu',
            data: {
                position_id: 43,
                token: member.token
            },
            dataType: 'json',
            cache: renderMenu,
            success: renderMenu,
            error: renderMenu
        });
    });


    // 返回顶部按钮
    (function () {

        var wrap = [].slice.call(dom.querySelectorAll('.flex-content')),
            pathname = location.pathname,

        // 首页/会员中心/支付页不显示浮动菜单
            hasMenu = !/(index|user-index|integral-index|integral-sign|integral-gift|integral-exchange|integral-detail)\.html$/ig.test(pathname) &&
                (!/(order-pay|user-refund-list|user-refund-detail|user-service-schedule|user-write-logistics|user-order-refund)\.html$/ig.test(pathname) && platform.isFromBaiYangApp || !platform.isFromBaiYangApp),

            isShow = true,
            hideTimer = null;

        wrap.push(win);

        var menuWrap, btnWrap, btnMenu, menu, btnTop;
        if (platform.isFromWx || platform.isFromBaiYangApp || platform.isFromYXYApp) {
            // 微信显示更多菜单

            // 右侧菜单
            menuWrap = dom.createElement('div');
            menuWrap.className = 'nav-right';

            // 弹出菜单
            menu = dom.createElement('div');
            menu.className = 'right-nav-list hide';
            menu.innerHTML = '<a href="/index.html"><i class="icon icon-index"></i>首页</a><a href="javascript:;" data-act="search" ><i class="icon icon-search"></i>搜索</a><a href="/shopping-car.html"><i class="icon icon-car"></i>购物车</a><a href="/user-index.html"><i class="icon icon-user"></i>个人中心</a>';

            // 按钮父层
            btnWrap = dom.createElement('div');
            btnWrap.className = 'nav-item';
            menuWrap.appendChild(btnWrap);

            // 返回顶部按钮
            btnTop = dom.createElement('a');
            btnTop.setAttribute('href', 'javascript:;');
            btnTop.innerHTML = '<i class="icon icon-right-nav-top">' +
                '<svg preserveAspectRatio="xMidYMid" width="42" height="42" viewBox="0 0 42 42">' +
                '<g>' +
                '<circle cx="21" cy="21" r="20" class="cls-1"/>' +
                '<path d="M11.000,19.000 L21.000,9.000 L32.000,19.000 " class="cls-2"/>' +
                '<path d="M21.000,33.000 L21.000,11.000 " class="cls-2"/>' +
                '</g>' +
                '</svg>' +
                '</i>' +
                '<span>顶部</span>';

            // 更多菜单按钮
            btnMenu = dom.createElement('a');
            btnMenu.setAttribute('href', 'javascript:;');
            btnMenu.innerHTML = '<i class="icon icon-right-nav-more">' +
                '<svg preserveAspectRatio="xMidYMid" width="42" height="42" viewBox="0 0 42 42">' +
                '<circle cx="21" cy="21" r="20" class="cls-1"/>' +
                '<path d="M31.000,24.000 C29.343,24.000 28.000,22.657 28.000,21.000 C28.000,19.343 29.343,18.000 31.000,18.000 C32.657,18.000 34.000,19.343 34.000,21.000 C34.000,22.657 32.657,24.000 31.000,24.000 ZM21.000,24.000 C19.343,24.000 18.000,22.657 18.000,21.000 C18.000,19.343 19.343,18.000 21.000,18.000 C22.657,18.000 24.000,19.343 24.000,21.000 C24.000,22.657 22.657,24.000 21.000,24.000 ZM11.000,24.000 C9.343,24.000 8.000,22.657 8.000,21.000 C8.000,19.343 9.343,18.000 11.000,18.000 C12.657,18.000 14.000,19.343 14.000,21.000 C14.000,22.657 12.657,24.000 11.000,24.000 Z" class="cls-2"/>' +
                '</svg>' +
                '</i>' +
                '<span>更多</span>';

            if (hasMenu) {
                menuWrap.appendChild(menu);
                btnWrap.appendChild(btnMenu);

                // 点击显影菜单
                btnMenu.addEventListener('click', function () {
                    menu.classList.toggle('hide');
                    btnMenu.classList.toggle('active');
                });

                dom.addEventListener('touchstart', function (e) {
                    if (!menuWrap.isEqualNode(e.target) && !menuWrap.contains(e.target)) {
                        menu.classList.add('hide');
                        btnMenu.classList.remove('active');
                    }
                });
            }

            btnWrap.appendChild(btnTop);
            body.appendChild(menuWrap);

        } else {
            // 只显示返回顶部菜单

            btnTop = dom.createElement('a');
            btnTop.className = 'btn-go-top';
            btnTop.setAttribute('href', 'javascript:;');
            body.appendChild(btnTop);
        }


        var show = function () {
            isShow = true;
            btnTop.style.display = 'block';
        };

        var hide = function () {
            isShow = false;
            btnTop.style.display = 'none';
        };

        var setBtn = function (wrapItem) {
            var scrollTop = wrapItem.scrollTop;

            if (scrollTop > 10 && !isShow) {
                show();
                clearTimeout(hideTimer);
                hideTimer = setTimeout(hide, 5000);
            } else if (scrollTop <= 10 && isShow) {
                hide();
                clearTimeout(hideTimer);
            }
        };

        wrap.forEach(function (wrapItem) {
            // 如果是body滚动则滚动层为body，否则是box滚动
            var scrollWrap = wrapItem;
            if (wrapItem == win) {
                scrollWrap = body;
            }

            // 滚动离开顶部则显示返回顶部按钮
            wrapItem.addEventListener('scroll', function (e) {
                setBtn(scrollWrap);
            });
            setBtn(scrollWrap);

            // 点击返回顶部
            btnTop.addEventListener('click', function () {
                scrollWrap.scrollTop = 0;
            });
        });

    })();

    // 推广代码
    (function () {


        // cps推广代码
        var localInviteCode = '';
        try {
            localInviteCode = JSON.parse(localCache.getItem('__local_invite_code__'));
        } catch (e) {
            localInviteCode = '';
        } finally {
            if (localInviteCode &&
                localInviteCode.invite_code &&
                /^(null|undefined)$/.test(localInviteCode.invite_code)) {
                localInviteCode = '';
            }
        }

        // 如果 url 有传递 invite_code 或者本地保存的 invite_code 未过期
        if (urlParam.invite_code || (localInviteCode && localInviteCode.invite_code && Date.now() - localInviteCode.time_stamp < 86400000)) {

            var invite_code = urlParam.invite_code || (localInviteCode ? (localInviteCode.invite_code || '') : '') || '';
            var act_id = urlParam.act_id || (localInviteCode ? (localInviteCode.act_id || '') : '') || '';

            invite_code && (member.appParam.invite_code = invite_code);

            // 会员登录则将 invite_code 发送到后台
            member.onLogin(function () {
                if (member.userInfo && member.userInfo.phone) {
                    ajax({
                        type: 'get',
                        url: config.url + 'wap/cps_user/check_user',
                        data: {
                            token: member.token,
                            mobile: member.userInfo.phone,
                            invite_code: invite_code,
                            act_id: act_id
                        },
                        dataType: 'json',
                        success: function (data) {
                            localCache.removeItem('__local_invite_code__');
                        }
                    });
                }
            });

            // 会员未登录则将 invite_code 保存到本地
            member.onLogout(function () {
                localCache.setItem('__local_invite_code__', JSON.stringify({
                    invite_code: invite_code,
                    act_id: act_id,
                    time_stamp: localInviteCode ? (localInviteCode.time_stamp || '') : Date.now()
                }));
            });

        } else {
            // 删除本地的 invite_code
            localCache.removeItem('__local_invite_code__');
        }


        // 中民网/亿起发返利接口参数保存至本地
        var param;
        if (urlParam.bid && urlParam.euid && urlParam.union_id) {
            param = {
                bid: urlParam.bid,
                euid: urlParam.euid,
                union_id: urlParam.union_id,
                stamp: Date.now()
            };
        } else if (urlParam.cid && urlParam.wi && urlParam.aid) {
            param = {
                bid: urlParam.cid,
                euid: urlParam.wi,
                union_id: urlParam.aid,
                stamp: Date.now()
            };
        } else if (urlParam.channel_id && urlParam.u_id && urlParam.tracking_code) {
            param = {
                bid: urlParam.tracking_code,
                euid: urlParam.u_id,
                union_id: urlParam.channel_id,
                stamp: Date.now()
            };
        } else if (urlParam.um_id && urlParam.track_code) {
            param = {
                bid: urlParam.track_code,
                euid: '0',
                union_id: urlParam.um_id,
                stamp: Date.now()
            };
        }

        if (param) {
            localCache.setItem('__local_discount_code__', JSON.stringify(param));
        }

        if (urlParam.channel_id && urlParam.u_id && urlParam.tracking_code && urlParam.target_url) {
            win.location.replace(urlParam.target_url);
        }

        if (urlParam.um_id && urlParam.track_code && urlParam.target) {
            win.location.replace(urlParam.target);
        }

        //瑞宏抽奖活动
        var localLotteryCode = '';
        try {
            localLotteryCode = JSON.parse(localCache.getItem('__local_lottery_code__'));
        } catch (e) {
            localLotteryCode = '';
        }

        if ((urlParam.invoice_id && urlParam.coupon_id && urlParam.prize_type && urlParam.rh_openid && urlParam.sign ) || (localLotteryCode && localLotteryCode.coupon_id && localLotteryCode.prize_type && localLotteryCode.rh_openid && localLotteryCode.sign && localLotteryCode.invoice_id )) {

            // 会员登录则将 url参数 发送到后台
            member.onLogin(function () {
                ajax({
                    type: 'post',
                    url: Config.url + 'wap/ruihong_activity/add_activity_prize',
                    data: {
                        token: member.token,
                        invoice_id: urlParam.invoice_id || (localLotteryCode ? (localLotteryCode.invoice_id || '') : ''),
                        coupon_id: urlParam.coupon_id || (localLotteryCode ? (localLotteryCode.coupon_id || '') : ''),
                        type: urlParam.prize_type || (localLotteryCode ? (localLotteryCode.prize_type || '') : ''),
                        other_openid: urlParam.rh_openid || (localLotteryCode ? (localLotteryCode.rh_openid || '') : ''),
                        sign: urlParam.sign || (localLotteryCode ? (localLotteryCode.sign || '') : '')
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (data && data.code == 200) {
                            localCache.removeItem('__local_lottery_code__');
                        }
                    },
                    error: function () {
                    }
                });
            });

            // 会员未登录则将 url参数 保存到本地
            member.onLogout(function () {
                localCache.setItem('__local_lottery_code__', JSON.stringify({
                    invoice_id: urlParam.invoice_id || (localLotteryCode ? (localLotteryCode.invoice_id || '') : ''),
                    coupon_id: urlParam.coupon_id || (localLotteryCode ? (localLotteryCode.coupon_id || '') : ''),
                    prize_type: urlParam.prize_type || (localLotteryCode ? (localLotteryCode.prize_type || '') : ''),
                    rh_openid: urlParam.rh_openid || (localLotteryCode ? (localLotteryCode.rh_openid || '') : ''),
                    sign: urlParam.sign || (localLotteryCode ? (localLotteryCode.sign || '') : '')
                }));
            });
        }


    })();

    // 微信功能
    (function () {
        if (platform.isFromWx) {

            // 微信全站绑定分享
            require.async('share', function (Share) {

                // 绑定分享
                var shareObject = Share({
                    title: '百洋商城-妈妈的网上药店，青岛正规专业药房 送药上门',
                    description: '百洋商城 青岛地区 1小时送药上门 专营药品、母婴、器械、保健品 万种商品。大品牌、放心购！',
                    img: config.cdn + 'images/icon-download.png',
                    url: String(win.location).replace(/(isband|token|unionid)=([^&]*)(&|$)/ig, ''),
                    type: 'link'
                });

            });
        }
    })();

});