/*!
 * @author kunkunsiwa
 * @date 2017/1/11
 * @description 积分商城签到页
 */

define('integral-detail', ['ajax', 'member', 'popup', 'mvvm', 'exbind', 'widget', 'router','public'], function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var widget = require('widget');
    var Public = require('public');

    var in_app = Config.platform.isFromBaiYangApp ;
    // 会员登录事件
    member.onLogout(function () {
        vmDate.show_login = 2;
        if( !in_app ){
            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
        }

    });

    // 页面内部跳转路由
    var pageRouter = Public.stateRouter(function(page) {
        if(page == 'show_rule') {
            vmDate.show_login = 1;
        }
    });

    var vmDate = MVVM.define('detail-data',{

        show_login: 0,        //未登录时      1:已登录  2:未登录
        page: 1 ,                  // 页码
        size: 10,                  // 每页数量
        total : 0 ,                //总数
        detail_list : [] ,                 // 返回的list
        current_point: 0,           //当前积分
        is_none: false ,
        is_show_rule: false,        //是否显示规则

        //获取用户积分
        user_info: function() {
            ajax({
                type: 'post',
                url: Config.url + 'background/integral/user_integral_info',
                data: {
                    token: member.token                               //token
                },
                dataType: 'json',
                success: function (data) {
                    popup.loading('hide');

                    if (data && data.code == 200) {

                        vmDate.current_point = data.data.user_info.point ;

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
                error: function () {
                    popup.loading('hide');
                    popup.error('加载失败！');
                }
            });
        },

        //获取积分详情信息列表
        get_data_list: function( callback ) {

            ajax({
                type: 'post',
                url: Config.url + 'background/integral/integral_detail',
                data: {
                    token: member.token,
                    page: vmDate.page ,
                    pagesize: vmDate.size
                },
                dataType: 'json',
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){

                        if( Public.isArray(data.data.exchange) ){
                            data.data.exchange.forEach(function(item){
                                item.add_time = Public.getDateString(item.add_time, 'Y-M-D H:I');
                            });
                        }

                        vmDate.detail_list = vmDate.detail_list.concat(data.data.exchange);
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
        },

        rule_point: 0 ,    //积分比例
        //积分比例 接口
        get_rule: function() {

            ajax({
                type: 'post',
                url: Config.url + 'background/integral/points_rule',
                data: {},
                dataType: 'json',
                success: function (data) {

                    if (data && data.code == 200) {

                        vmDate.rule_point = data.data[0].order_return_points ;

                    } else {
                        popup.error(data.message);
                    }
                },
                error: function () {
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

        // 页面跳转
        pageRouter: function(page) {
            vmDate.show_login = 3;
            pageRouter(page);
        },

        init: function() {

            popup.loading('show');

            vmDate.user_info();
            vmDate.get_data_list();
            vmDate.get_rule();

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
                            scrollLock = true;
                            vmDate.page += 1 ;
                            vmDate.get_data_list(function() {
                                scrollLock = false;
                            });
                        }
                    }, 30);
                }

            });

        }

    });

    member.onLogin(function () {
        vmDate.show_login = 1;
        vmDate.init();
    });


});
