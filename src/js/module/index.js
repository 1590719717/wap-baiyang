/*!
 * @author liyuelong1020@gmail.com
 * @date 15-5-21 下午4:04
 * @version 1.0.0
 * @description index
 */

define('index', ['ajax', 'mvvm','member', 'app-url'], function (require, exports) {
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var member = require('member');
    var appUrl = require('app-url');

    var config = window.Config;
    var platform = config.platform;

    // 页面弹窗fix禁止滚动
    var fixPage = function(is_fix) {
        if(!!is_fix){
            document.documentElement.classList.add('fixed-popup');
        } else {
            document.documentElement.classList.remove('fixed-popup');
        }
    };


    var vmData = MVVM.define('index', {
        flag_close: 0,
        // 登录状态
        loginState: false,
        // 首页轮播图广告位
        scrollImg: '',
        // 广告图
        picBanner: '',
        // 新品推荐
        newGoods: '',
        // 今日新上
        special: '',
        // 母婴用品
        baby: '',
        // 女性健康
        woman: '',
        // 男性健康
        man: '',
        // 家庭药箱
        medicine: '',
        // 营养滋补
        nourishing: '',
        // 医疗器械
        apparatus: '',

        // 获取首页快捷入口
        handy_entry: null ,

        //是否是触屏机
        is_touch_machine: platform.isFromBYTouchMachine,

        is_show_code: false,
        //显示二维码
        showCode: function () {
            vmData.is_show_code = true;
            fixPage(true);
        },
        // 关闭二维码
        closeCode: function () {
            vmData.is_show_code = false;
            fixPage();
        },
        //长时间未操作的标志
        is_long_operation: false,

        // 是否隐藏头部app引导
        //is_hide_top: (!!Number(sessionStorage.getItem("_is_close_app_")) && !platform.isFromBYTouchMachine) || platform.isFromBaiYangApp,
        is_hide_top: !platform.isFromBYTouchMachine ,

        is_scroll_hide: false,

        // 关闭头部app引导
        closeGuide: function() {
            vmData.is_hide_top = true;
            sessionStorage.setItem("_is_close_app_", "1");
        }

    });


    // 广告位id
    var blockId = [
        2,                // 首页轮播图广告位

        3,               // 左上广告图
        4,               // 左下广告图
        5,               // 右广告图1
        6,               // 右广告图2
        7,               // 右广告图3

        8,               // 新品推荐

        9,               // 今日新上
        // 营养保健
        10,               // 文字广告
        16,               // 商品推荐
        // 美妆个护
        11,               // 文字广告
        17,               // 商品推荐
        // 母婴用品
        12,               // 文字广告
        18,               // 商品推荐
        // 中西药品
        13,               // 文字广告
        19,               // 商品推荐
        // 营养滋补
//      14,               // 文字广告
//      20,                // 商品推荐
//      // 医疗器械
//      15,               // 文字广告
//      21                // 商品推荐
    ];

    var renderData = function (data) {
        var scrollImg = [],                             // 首页轮播图广告位
            picBanner = ['', '', '', '', ''],     // 广告图
            newGoods = [],                              // 新品推荐
            special = [],                               // 今日新上
            baby = {},                                  // 母婴用品
            woman = {},                                 // 女性健康
            man = {},                                   // 男性健康
            medicine = {},                              // 家庭药箱
            nourishing = {},                            // 营养滋补
            apparatus = {};                             // 医疗器械

        var setArrLen = function (arr, len) {
            if (arr.length > len) {
                arr.length = len;
            } else {
                for (var i = 0, l = len - arr.length; i < l; i++) {
                    arr.push('');
                }
            }
        };

        var classify = {};
        // 首页轮播图广告位
        classify[blockId[0]] = function (item) {
            if (item.spread && item.spread.length) {
                scrollImg = item.spread;
            }
        };
        // 广告图
        classify[blockId[1]] = function (item) {
            if (item.spread && item.spread.length) {
                picBanner[0] = item.spread[0];
            }
        };
        classify[blockId[2]] = function (item) {
            if (item.spread && item.spread.length) {
                picBanner[3] = item.spread[0];
            }
        };
        classify[blockId[3]] = function (item) {
            if (item.spread && item.spread.length) {
                picBanner[1] = item.spread[0];
            }
        };
        classify[blockId[4]] = function (item) {
            if (item.spread && item.spread.length) {
                picBanner[2] = item.spread[0];
            }
        };
        classify[blockId[5]] = function (item) {
            if (item.spread && item.spread.length) {
                picBanner[4] = item.spread[0];
            }
        };
        // 新品推荐  1424
        classify[blockId[6]] = function (item) {
            if (item.spread && item.spread.length) {
                newGoods = item.spread;
            }
        };
        // 今日新上  1443
        classify[blockId[7]] = function (item) {
            if (item.spread && item.spread.length) {
                special = item.spread;
            }
        };
        // 母婴用品
        classify[blockId[8]] = function (item) {
            if (item.spread && item.spread.length) {
                baby.keyword = item.spread;
                setArrLen(baby.keyword, 6);
            }
        };  // 1426,
        classify[blockId[9]] = function (item) {
            if (item.spread && item.spread.length) {
                baby.goods = item.spread;
            }
        };  // 1427,
        // 女性健康
        classify[blockId[10]] = function (item) {
            if (item.spread && item.spread.length) {
                woman.keyword = item.spread;
                setArrLen(woman.keyword, 6);
            }
        }; // 1428,
        classify[blockId[11]] = function (item) {
            if (item.spread && item.spread.length) {
                woman.goods = item.spread;
            }
        }; // 1429,
        // 男性健康
        classify[blockId[12]] = function (item) {
            if (item.spread && item.spread.length) {
                man.keyword = item.spread;
                setArrLen(man.keyword, 6);
            }
        }; // 1430,
        classify[blockId[13]] = function (item) {
            if (item.spread && item.spread.length) {
                man.goods = item.spread;
            }
        }; // 1431,
        // 家庭药箱
        classify[blockId[14]] = function (item) {
            if (item.spread && item.spread.length) {
                medicine.keyword = item.spread;
                setArrLen(medicine.keyword, 6);
            }
        }; // 1432,
        classify[blockId[15]] = function (item) {
            if (item.spread && item.spread.length) {
                medicine.goods = item.spread;
            }
        }; // 1433,
        // 营养滋补
        classify[blockId[16]] = function (item) {
            if (item.spread && item.spread.length) {
                nourishing.keyword = item.spread;
                setArrLen(nourishing.keyword, 6);
            }
        }; // 1434,
        classify[blockId[17]] = function (item) {
            if (item.spread && item.spread.length) {
                nourishing.goods = item.spread;
            }
        }; // 1435,
        // 医疗器械
        classify[blockId[18]] = function (item) {
            if (item.spread && item.spread.length) {
                apparatus.keyword = item.spread;
                setArrLen(apparatus.keyword, 6);
            }
        }; // 1436,
        classify[blockId[19]] = function (item) {
            if (item.spread && item.spread.length) {
                apparatus.goods = item.spread;
            }
        }; // 1437

        if (data && data.length) {
            data.forEach(function (item) {
                classify[item.id] && classify[item.id](item);
            });

            vmData.scrollImg = scrollImg;
            vmData.picBanner = picBanner;
            vmData.newGoods = newGoods;
            vmData.special = special;
            vmData.baby = baby;
            vmData.woman = woman;
            vmData.man = man;
            vmData.medicine = medicine;
            vmData.nourishing = nourishing;
            vmData.apparatus = apparatus;
        }
    };

    var loading = document.getElementById('loading');
    // 获取首页数据
    ajax({
        type: 'post',
        url: config.url + 'wap/home_page/home_page',
        data: {
            token: member.token ,
            position_id: blockId.join(',')
        },
        dataType: 'json',
        cache: function (data) {
            loading.style.display = 'none';

            if (data && data.code == 200) {
                renderData(data.data);
            }
        },
        success: function (data) {
            loading.style.display = 'none';

            if (data && data.code == 200) {
                renderData(data.data);
            }
        },
        error: function () {
            //loading.style.display = 'none';
        }
    });

    var renderNav = function(data) {
        loading.style.display = 'none';

        if (data && data.code == 200 && data.data.length) {

            data.data.forEach(function(item) {
                if(platform.isFromBaiYangApp) {
                    item.href = 'href="' + appUrl.wap_to_app(item.location) + '"';
                } else {
                    item.href = '';
                    var href = appUrl.app_to_wap(item.location);
                    for(var attr in href){
                        if(href.hasOwnProperty(attr)){
                            item.href += attr + '=' + href[attr] + ' ';
                        }
                    }
                }

            });

            vmData.handy_entry = data.data ;

        } else {
            vmData.handy_entry = [] ;
        }
    };

    // 获取首页快捷入口
    ajax({
        type: 'post',
        url: config.url + 'background/home_page/handy_entry',
        data: {
            token: member.token
        },
        dataType: 'json',
        cache: renderNav,
        success: renderNav,
        error: function () {
            vmData.handy_entry = [] ;
        }
    });


    // 头部滚动跟着变色
    var topSearch = document.getElementById('top-search'),
        scrollWrap = document.body,
        topBanner = scrollWrap.querySelector('.top-scroll'),
        opacityFlag = 0,
        topHeight = topBanner.scrollHeight ;
        setTopState = function() {
            var top = scrollWrap.scrollTop;

            if(!topHeight){
                topHeight = topBanner.scrollHeight;
            }

            var opacity = top / topHeight;

            if (opacity < 0.05) {
                topSearch.style.cssText = '';
                opacityFlag = 0;
            } else if (opacity < 1) {
                topSearch.style.background = 'rgba(243,90,145,' + opacity + ')';
                opacityFlag = opacity;
            } else if (opacity > 1 && opacityFlag < 1) {
                opacityFlag = 1;
                topSearch.style.background = 'rgba(243,90,145,1)';
            }

            if(top > 0 && !vmData.is_scroll_hide){
                vmData.is_scroll_hide = true;
            } else if (top <= 0 && vmData.is_scroll_hide) {
                vmData.is_scroll_hide = false;
            }
        };

    document.addEventListener('scroll', setTopState);
    document.addEventListener('swipeUp', function() {
        vmData.is_scroll_hide = true;
    });
    setTopState();

    // 图片加载失败显示默认图片
    vmData.__addObserveEvent__(function () {
        [].slice.call(document.querySelectorAll('img') || []).forEach(function (img) {
            img.onerror = function () {
                if(/default-img\.png$/.test(img.src)) {
                    this.src = 'images/default-img.png';
                }
            }
        })
    });

    // 头部会员状态修改
    member.onLogin(function () {
        vmData.loginState = true;
    });
    member.onLogout(function () {
        vmData.loginState = false;
    });

    require.async(['widget'], function () {

        // 头部app跳转链接绑定
        //var btn = document.querySelector("a#btn-open-app-top");
        //var btnBottom = document.querySelector("a#btn-open-app");
        //btn.addEventListener('click', function () {
        //    try {
        //        ga('send', 'event', 'APP下载', '去下单', window.location.pathname.replace(/[^\d]/g, ''));
        //    } catch (e) {
        //    }
        //});
        //
        //btnBottom.addEventListener('click', function () {
        //    btn.click();
        //    if( platform.isFromBYTouchMachine ) {
        //        vmData.is_show_code = true ;
        //    }
        //});
        //
        //if (platform.isFromAndroid && platform.isFromWx) {
        //    btn.addEventListener('click', function () {
        //        window.location = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.baiyang.store';
        //    });
        //} else if (!platform.isFromBaiYangApp && !platform.isFromBYTouchMachine) {
        //    require.async('https://s.mlinks.cc/scripts/dist/mlink.min.js', function () {
        //        new Mlink({
        //            mlink: "http://a.mlinks.cc/AArW",
        //            button: btn,
        //            autoRedirect: false,
        //            params: {}
        //        });
        //    });
        //}

    });


});
