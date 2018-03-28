/*!
 * @author kunkunsiwa
 * @date 2017/1/11
 * @description 积分商城签到页
 */

define('integral-exchange', ['ajax', 'member', 'popup', 'mvvm', 'exbind', 'widget','public'], function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup= require('popup');
    var MVVM = require('mvvm');
    var widget = require('widget');
    var Public = require('public');

    var in_app = Config.platform.isFromBaiYangApp ;

    // 会员登录事件
    member.onLogout(function () {
        vmDate.show_login = 2 ;
        if( !in_app ){
            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
        }
    });

    var vmDate = MVVM.define('detail-exchange',{

        page: 1 ,                  // 页码
        size: 10,                  // 每页数量
        total : 0 ,                 // 总数
        exchange_list: [] ,        //数据
        is_none : false,           //数据为空时的标志

        exchange_recommend:[] ,    //超值兑换

        show_login: 0 ,

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

        // 获取兑换记录
        get_data_list: function(callback) {

            ajax({
                type: 'post',
                url: Config.url + 'background/integral/exchange_detail',
                data: {
                    token: member.token,
                    page: vmDate.page ,
                    pagesize: vmDate.size
                },
                dataType: 'json',
                beforeSend: function() {
                    popup.loading('show');
                },
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){

                        if( Public.isArray(data.data.exchange) ){

                            data.data.exchange.forEach(function(item){
                                item.exchange_time = Public.getDateString(item.exchange_time, 'Y-M-D H:I');
                                item.exchange_integral = Number( item.exchange_integral );
                            });

                        }

                        vmDate.exchange_list = vmDate.exchange_list.concat(data.data.exchange);
                        vmDate.total = Math.ceil(data.data.total / vmDate.size) ;

                        callback && callback();

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

                    }else if( data.code == 30001 ) {

                        if( vmDate.page == 1 ){

                            vmDate.is_none = true ;
                            vmDate.integral_recommend();

                        }

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
        //数据  超值兑换
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

                        data.data.exchange_recommend.forEach(function(item){
                            item.coupon.value = Number(item.coupon.value);
                        });
                        vmDate.exchange_recommend =  data.data.exchange_recommend ;

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

        init: function() {

            vmDate.get_data_list();

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

                            vmDate.get_data_list(function() {
                                scrollLock = false;
                            });
                        }
                    }, 20);
                }

            });
        }

    });

    //会员登录事件
    member.onLogin(function () {
        vmDate.show_login = 1 ;

        vmDate.init();
    });


});
