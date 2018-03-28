/*!
 * @author 余春凤
 * @date 2017/1/10
 * @description 积分商城首页
 */

define('integral-index', ['ajax', 'member', 'popup', 'mvvm', 'exbind', 'widget'], function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var widget = require('widget');

    var in_app = Config.platform.isFromBaiYangApp;

    if(in_app){
        //隐藏分享按钮
        require.async('app-bridge', function(bridge) {
            bridge.showShareButton(function() {},{"show":false});

        });
    }


    var vmDate = MVVM.define('integral-index',{

        headimgurl:'',            //用户头像
        point:0,                  //用户积分
        banner:[],                //广告轮播图
        exchange_recommend:[],    //超值兑换
        page: 1 ,                //积分换好礼的页数
        size: 10 ,               //积分换好礼的每页的数量
        total: 0,                 //积分换好礼的总数量
        exchange_gift:[],         //积分换好礼

        //跳转到app首页
        go_app_index: function() {

             if(in_app) {

                 require.async('app-bridge', function(bridge) {
                     bridge.jumpToAppHomePage(function() {
                     });

                 });

             } else {
                 window.location = 'index.html' ;
             }
        },

        //数据  用户积分
        integral_info: function() {
            ajax({
                type: 'post',
                url: Config.url + 'background/integral/user_integral_info',
                data: {
                    token: member.token
                },
                dataType: 'json',
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){
                        vmDate.headimgurl = data.data.user_info.headimgurl ;
                        vmDate.point =  data.data.user_info.point ;

                    } else if( data.code == 201 ) {

                        popup.error('您还未登录', function () {

                            if( in_app ){
                                require.async('app-bridge', function(bridge) {
                                    bridge.loginApp(function(token) {},{});
                                });

                            } else {
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                            }

                        });

                    } else {
                        popup.error(data.message);
                    }
                },
                error: function() {
                    popup.loading('hide');
                    popup.error('加载失败！');
                }
            });
        } ,

        //数据  超值好礼和广告图
        integral_recommend: function() {
            ajax({
                type: 'post',
                url: Config.url + 'background/integral/homepage_user_info',
                data: {
                    token: member.token
                },
                dataType: 'json',
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){

                        vmDate.banner = data.data.banner ;

                        data.data.exchange_recommend.forEach(function(item){
                            item.coupon.value = Number(item.coupon.value);
                        });

                        vmDate.exchange_recommend =  data.data.exchange_recommend ;

                    } else {
                        popup.error(data.message);
                    }
                },
                error: function() {
                    popup.loading('hide');
                    popup.error('加载失败！');
                }
            });
        } ,

        //积分换好礼数据
        integral_exchange_gift: function ( callback ) {
            ajax({
                type: 'post',
                url: Config.url + 'background/integral/homepage',
                data: {
                    token: member.token ,
                    page: vmDate.page ,
                    size: vmDate.size
                },
                dataType: 'json',
                success: function(data) {

                    popup.loading('hide');

                    if(data && data.code == 200){

                        data.data.exchange.forEach(function(item){
                            item.coupon.value = Number(item.coupon.value);
                        });

                        vmDate.exchange_gift = vmDate.exchange_gift.concat(data.data.exchange);
                        vmDate.total = Math.ceil(data.data.total / vmDate.size) ;

                        callback && callback();

                    }else if( data.code == 30001 ) {

                    } else {
                        popup.error(data.message);
                    }
                },
                error: function() {
                    popup.loading('hide');
                    popup.error('加载失败！');
                }
            });
        },

        //登录
        go_login: function() {

            if( in_app ){

                require.async('app-bridge', function(bridge) {
                    bridge.loginApp(function(token) {},{});

                });

            } else {
                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
            }

        },

        init: function() {

            popup.loading('show');

            vmDate.integral_recommend();
            vmDate.integral_exchange_gift();

            // 滑动到底部则自动更新
            var scrollWrap = document.body,
                winHeight = window.innerHeight + 100,
                scrollLock = false,
                timer;

            document.addEventListener('scroll', function () {

                if(!scrollLock) {
                    clearTimeout(timer);

                    timer = setTimeout(function() {
                        if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight  && vmDate.page < vmDate.total ){

                            vmDate.page += 1 ;
                            scrollLock = true;

                            vmDate.integral_exchange_gift(function() {
                                scrollLock = false;
                            });
                        }
                    }, 20);
                }

            });

        }

    });

    // 会员已登录事件
    member.onLogin(function() {

        vmDate.integral_info();

    });

    vmDate.init();




});
