/*!
 * @author kunkunsiwa
 * @date 2017/1/11
 * @description 积分商城签到页
 */

define('integral-gift', ['ajax', 'member', 'popup', 'mvvm', 'exbind', 'widget','public'], function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var Public = require('public');
    var MVVM = require('mvvm');
    var widget = require('widget');


    var in_app = Config.platform.isFromBaiYangApp ;
    var gid = Public.getSearchParam('gift_id');

    var vmDate = MVVM.define('gift-data', {

        gift_data: '',                     //结果集
        need_points: 0,                       //所需积分
        user_point: 0,                        //用户实际的积分
        is_enough:false,                      //积分是否够
        points_gifts_name: '',                   //礼品名称

        //获取优惠券详情
        gift_info: function() {

            ajax({
                type: 'post',
                url: Config.url + 'background/integral/gifts_detail',
                data: {
                    token: member.token,                               //token
                    gid: gid                                    //礼品id
                },
                dataType: 'json',
                beforeSend: function () {
                    popup.loading('show');
                },
                success: function (data) {
                    popup.loading('hide');

                    if (data && data.code == 200) {
                        data.data.value = Number(data.data.value);
                        vmDate.gift_data = data.data ;
                        vmDate.need_points = Number(data.data.need_points);
                        vmDate.points_gifts_name = data.data.points_gifts_name ;

                        if( vmDate.user_point >= vmDate.need_points ) {
                              vmDate.is_enough = true ;
                        }

                    } else {
                        popup.error(data.message);
                    }

                },
                error: function () {
                    popup.loading('hide');
                    popup.error('接口请求失败！');
                }
            });
        },

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

                        vmDate.user_point = Number(data.data.user_info.point) ;

                        if( vmDate.user_point >= vmDate.need_points ) {
                            vmDate.is_enough = true ;
                        }

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

        //去登录事件
        goLogin: function() {

            if( in_app ){
                require.async('app-bridge', function(bridge) {
                    bridge.loginApp(function(token) {},{});
                });

            } else {
                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
            }

        } ,

        //兑换
        exchange_gift: function() {

            popup.confirm('确定使用'+ vmDate.need_points +'积分<br/>兑换'+ vmDate.points_gifts_name +'吗', function() {
                 //立即兑换
                ajax({
                    type: 'post',
                    url: Config.url + 'background/integral/exchange_gifts',
                    data: {
                        token: member.token,                        //token
                        gid: gid                                    //礼品id
                    },
                    dataType: 'json',
                    beforeSend: function () {
                        popup.loading('show');
                    },
                    success: function (data) {

                        popup.loading('hide');

                        if (data && data.code == 200) {

                            var exchange_success_id = data.data.user_coupon ;

                            popup.confirm('','查看');
                            popup.confirm('兑换成功<br/>可以在兑换列表中查看', function() {

                               window.location = 'integral-exchange.html' ;

                            }, {
                                cancelText: '好的',
                                confirmText: '查看'
                            }) ;

                        } else {

                            popup.error(data.message);

                        }

                    },
                    error: function () {
                        popup.loading('hide');
                        popup.error('加载失败！');
                    }
                });

            }, {
                cancelText: '取消',
                confirmText: '确定'
            }) ;





        }

    });

    vmDate.gift_info();

    member.onLogin(function(){
        vmDate.user_info();
    });


});
