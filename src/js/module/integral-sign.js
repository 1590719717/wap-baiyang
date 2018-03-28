/*!
 * @author 余春凤
 * @date 2017/1/10
 * @description 积分商城签到页
 */

define('integral-sign', ['ajax', 'member', 'popup', 'mvvm', 'exbind', 'widget','public'], function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var widget = require('widget');
    var Public = require('public');

    var in_app = Config.platform.isFromBaiYangApp ;

    if(in_app){
        //隐藏分享按钮
        require.async('app-bridge', function(bridge) {
            bridge.showShareButton(function() {},{"show":false});

        });
    }

    // 会员登录事件
    member.onLogout(function () {
        vmDate.show_login = 2;
        if( !in_app ){
            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
        }

    });



    var date = new Date(),
        cur_year = date.getFullYear(),                 //获取日期中的年份
        cur_month = date.getMonth(),                    //获取日期中的月份
        // 存储当前的年月日，
        today = {
            year: cur_year,
            month: cur_month,
            day: date.getDate()
        };

    var moth_txt =  (cur_month + 1 ) >= 10 ? cur_month + 1 : '0' + (cur_month + 1) ;

    var vmDate = MVVM.define('signed-data',{

        show_login: 0,        //未登录时      1:已登录  2:未登录
        is_sign: 0 ,           //是否已经签到
        point: 0 ,             //个人积分
        time_ing: 0 ,           //连续签到天数
        prompt: '',             //签到奖励提示
        rule :[] ,               // 签到规则
        tr_nums: 0,              //确定日期表格所需的行数
        day_list:{
            flag: 0,              //标志签到
            list:[]               //日历数据
        },
        sign_success: false ,    //签到成功弹窗
        sign_point: false,           //当天签到的积分

        cur_day: cur_year + "-" + moth_txt ,
        //上一月份
        pre_month_sign: function() {

            date.setMonth( cur_month - 1 );

            cur_year = date.getFullYear();
            cur_month = date.getMonth();

            vmDate.get_month_sign();

            var moth_txt =  (cur_month + 1 ) >= 10 ? cur_month + 1 : '0' + (cur_month + 1) ;
            vmDate.cur_day =  cur_year + '-' + moth_txt ;

        },
        //下一月份
        next_month_sign: function() {

            date.setMonth( cur_month + 1 );

            cur_year = date.getFullYear();
            cur_month = date.getMonth();

            vmDate.get_month_sign();

            var moth_txt =  (cur_month + 1 ) >= 10 ? cur_month + 1 : '0' + (cur_month + 1) ;
            vmDate.cur_day =  cur_year + '-' + moth_txt ;

        },

        //签到 请求接口
        sign: function() {

            if( vmDate.is_sign == 0 ){
                popup.loading('show');
                ajax({
                    type: 'post',
                    url: Config.url + 'background/integral/sign',
                    data: {
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if(data && data.code == 200){

                            vmDate.sign_success  = true ;
                            vmDate.sign_point  = data.data.integral;

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

                        } else if( data.code != 34700) {
                            popup.error(data.message);
                        }
                    },
                    error: function() {
                        popup.loading('hide');
                        popup.error('签到失败！');
                    }
                });
            }
        },

        //关闭弹窗
        close_popup: function() {

            vmDate.sign_success = false ;
            vmDate.init();

        },

        //请求每月的签到信息
        get_month_sign: function() {
            ajax({
                type: 'post',
                url: Config.url + 'background/integral/sign_calendar',
                data: {
                    token: member.token,
                    year: cur_year,
                    month: (cur_month + 1)
                },
                dataType: 'json',
                success: function(data) {

                    if(data && data.code == 200 && Public.isArray(data.data) ){

                        data.data.forEach(function (item) {
                            if( cur_year == today.year && cur_month == today.month && item.day == today.day  ) {
                                item.today = 1;
                            } else {
                                item.today = 0;
                            }
                        });

                        var first_day = new Date(cur_year, cur_month, 1);
                        var week = first_day.getDay();

                        var i = 0;
                        for(i ; i < week ; i++ ) {
                            data.data.unshift('');
                        }

                        var diff_left = data.data.length % 7 ;
                        if( diff_left > 0 ) {

                            var day_left = 7 - diff_left;
                            for(i = 0 ; i < day_left ; i++ ) {
                                data.data.push('');
                            }
                        }

                        vmDate.day_list.list = data.data ;
                        vmDate.day_list.flag  += 1 ;

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
            // 获取用户信息
            ajax({
                type: 'post',
                url: Config.url + 'background/integral/sign_page',
                data: {
                    token: member.token
                },
                dataType: 'json',
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){

                        vmDate.is_sign = data.data.is_sign ;
                        vmDate.point = data.data.point ;
                        vmDate.time_ing = data.data.inning ;
                        vmDate.prompt = data.data.prompt ;
                        vmDate.rule = data.data.rule ;

                    } else if( data.code == 201 ) {

                        popup.error('您还未登录', function () {
                            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
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

            vmDate.get_month_sign();
        }

    });


    //会员登录事件
    member.onLogin(function () {
        vmDate.show_login = 1;
        vmDate.init();

    });

});
