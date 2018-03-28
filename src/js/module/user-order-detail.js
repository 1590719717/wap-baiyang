/*!
 * @author wentaini@163.com  yuchunfeng
 * @date 2016/7/02
 * @description 我的订单详情
 */
define('user-order-detail', ['ajax', 'exbind', 'member', 'popup', 'widget', 'mvvm', 'public', 'router'], function (require, exports) {
    var ajax = require('ajax');
    var exbind = require('exbind');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var Public = require('public');
    var router = require('router');

    // 获取url参数
    var urlParam = (function () {
        var param = {};
        var searchArr = location.search.substr(1).split('&');
        searchArr.forEach(function (string) {
            var index = string.indexOf('=');
            if (index > -1) {
                var name = string.substr(0, index);
                var value = decodeURIComponent(string.substr(index + 1));
                name && (param[name] = value || '');
            }
        });
        return param
    })();

    var orderDetail = {

        vmData: MVVM.define('user-order-detail', {
            data: null,              //当前订单列表,
            order_status: '',       //订单状态
            is_global: 0,          //是否是海外优选
            is_logistics: false,  //是否有物流信息
            logistics_text: '',   //物流信息
            logistics_time: '',  // 物流时间
            order_invoice: 0,     // 0:订单详情页，1：发票 2：发票描述弹窗

            e_invoice_url:[],   //电子发票

            is_refunding: 0 ,    //是否出服务单  （1：需要 0：不需要）

            //时间戳 转换时间格式
            changeTime: function( time , format ) {
                return  Public.getDateString(time , format );

            },

            invoice_desc: false ,
            //显示 关于电子发票
            show_invoice_desc:function() {
                orderDetail.vmData.invoice_desc = true ;
            },

            //隐藏 关于电子发票
            hide_invoice_desc: function() {
                orderDetail.vmData.invoice_desc = false ;
            },

            // 获取手机号码(马赛克处理)
            getPhone: function(phone) {
                if(phone){
                    var phoneArr = [].slice.call(phone);
                    phoneArr.splice(3, 4, '*','*','*','*');
                    return phoneArr.join('');
                } else {
                    return '';
                }
            },

            // 身份证号马赛克处理
            getIdcard: function(card_num) {
                if(card_num){
                    var phoneArr = [].slice.call(card_num);
                    phoneArr.splice(8, 6, '*','*','*','*','*','*');
                    return phoneArr.join('');
                } else {
                    return '';
                }
            },

            //删除订单
            delectOrder: function (order_id) {

                popup.confirm('确认删除订单？', function() {
                    popup.loading('show');
                    ajax({
                        type: 'post',
                        url: Config.url + 'background/order/order_delete',
                        data: {
                            order_sn:order_id,
                            token: member.token
                        },
                        dataType: 'json',
                        success: function(data) {
                            popup.loading('hide');

                            if (data && data.code == 200) {

                                popup.success('删除成功', function () {
                                    window.location = 'user-order.html#all';
                                });

                            } else if (data && (data.code == 201)) {
                                // 未登录
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function() {
                            popup.error(this.url + ' Error');
                        }
                    });

                }, {
                    cancelText: '取消',
                    confirmText: '确定'
                }) ;

            },

            //取消订单
            cancelOrder: function (order_id) {

                popup.confirm('确认取消订单？', function() {
                    popup.loading('show');
                    ajax({
                        type: 'post',
                        url: Config.url + 'background/order/order_cancel',
                        data: {
                            order_sn: order_id,
                            token: member.token
                        },
                        dataType: 'json',
                        success: function(data) {
                            popup.loading('hide');

                            if (data && data.code == 200) {

                                popup.success('取消成功', function () {
                                    orderDetail.orderDetail();
                                });

                            } else if (data && (data.code == 201)) {
                                // 未登录
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function() {
                            popup.error(this.url + ' Error');
                        }
                    });

                }, {
                    cancelText: '取消',
                    confirmText: '确定'
                }) ;

            },

            //确认订单
            confirmOrder: function (order_id) {
                //确认收货
                popup.confirm( orderDetail.vmData.is_refunding==1?'该订单中存在有退款记录，确定收货将关闭退款?':'确认收货?' , function() {
                    popup.loading('show');
                    ajax({
                        type: 'post',
                        url: Config.url + 'background/order/order_status_deal',
                        data: {
                            order_sn: order_id,   //订单id
                            status: 'shipped', //只支持 shipped:待收货 evaluating:待评价
                            token: member.token
                        },
                        dataType: 'json',
                        success: function(data) {
                            popup.loading('hide');

                            if (data && data.code == 200) {

                                orderDetail.orderDetail();

                            } else if (data && (data.code == 201)) {
                                // 未登录
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function() {
                            popup.error('加载失败！');
                        }
                    });

                }, {
                    cancelText: '取消',
                    confirmText: '确定'
                }) ;

            }

        }),

        orderDetail: function () {
            var that = this;
            // 获取订单详情
            var getDetail = function (param) {
                var detailParam;
                if(param.order_sn){
                    detailParam = {
                        order_sn: param.order_sn,   //订单id
                        token: member.token
                    };
                } else if(param.prescription_id) {
                    detailParam = {
                        prescription_id: param.prescription_id,   // 处方单id
                        token: member.token
                    };
                }
                detailParam && ajax({
                    type: 'post',
                    url: Config.url + 'background/order/order_detail',
                    data: detailParam,
                    dataType: 'json',
                    beforeSend: function() {
                        popup.loading('show');
                    },
                    success: function(data) {
                        popup.loading('hide');
                        if (data && data.code == 200) {

                            that.vmData.data = data.data;
                            if( data.data.orderInfo.e_invoice_url.length ){
                                that.vmData.e_invoice_url = data.data.orderInfo.e_invoice_url.split(",") ;
                            }
                            that.vmData.is_global = Number(data.data.is_global) ;
                            that.vmData.order_status = data.data.orderInfo.status ;
                            that.vmData.is_logistics = data.data.orderInfo.is_show_logisticsbutton ;


                            //最新物流信息
                            if( data.data.orderInfo.last_logistics) {
                                that.vmData.logistics_text = data.data.orderInfo.last_logistics.context ;
                                that.vmData.logistics_time = data.data.orderInfo.last_logistics.time ;
                            }

                            that.vmData.is_refunding  = data.data.notice_has_service ;

                        } else if (data && data.code == 201 ) {
                            // 未登录
                            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                        } else if (data && data.code == 100006 ) {
                            // 订单已删除
                            window.location.replace('user-order.html');

                        } else {

                            if (param.prescription_id) {
                                // 处方单列表
                                window.location.replace('user-prescription-details.html?id=' + param.prescription_id);

                            } else {
                                popup.error(data.message, function () {
                                    // 订单列表
                                    window.location.replace('user-order.html');
                                });
                            }
                        }
                    },
                    error: function() {
                        popup.error(this.url + ' Error');
                    }
                });

            };

            if (urlParam.id) {

                // 通过 订单id 获取订单
                getDetail({
                    order_sn: urlParam.id
                });

            } else if (urlParam.cfid) {
                // 通过处方单获取订单

                if (urlParam.username && urlParam.code) {

                    // 从易复诊跳转过来自带账号密码则先登录
                    member.login({
                        account: urlParam.username,
                        password: urlParam.code,
                        is_yfz: 1
                    }, function (data) {
                        if (data && data.code == 200) {
                            getDetail({
                                prescription_id: urlParam.cfid
                            });
                        } else {
                            popup.error(data ? data.message : '登录失败！', function () {
                                window.location = 'login.html';
                            });
                        }
                    });
                } else {
                    getDetail({
                        prescription_id: urlParam.cfid
                    });
                }
            }

        },

        init: function () {
            var that = this;
            that.orderDetail();
        }
    };

    // 订单倒计时
    exbind.register('count-down', 'load', function (e) {
        var elem = this,
            timeCount = Number(e.param.time) * 1000;

        if (timeCount && timeCount > 0) {
            var timer = null;

            var hour = 0;
            var minutes = 0;
            var seconds = 0;
            var setTimeCountDown = function() {
                timeCount -= 1000;

                hour = Math.floor(timeCount / 3600000);
                minutes = Math.floor((timeCount % 3600000) / 60000);
                seconds = Math.floor((timeCount % 60000) / 1000);

                minutes = minutes < 10 ? '0' + minutes : minutes;
                seconds = seconds < 10 ? '0' + seconds : seconds;

                elem.innerHTML =  hour + '小时' + minutes + '分' + seconds + '秒';

                if(timeCount <= 0) {
                    clearInterval(timer);
                }
            };

            if (timeCount > 0) {
                timer = setInterval(setTimeCountDown, 1000);
                setTimeCountDown();
            }
        }
    });

    // 易复诊 会员登录
    var yfz_login = function() {

        member.login({
            account: urlParam.username,
            password: urlParam.code,
            is_yfz: 1
        }, function(data) {

            if (data && data.code == 200) {
                orderDetail.init();

            } else {
                popup.error(data ? data.message: '登录失败！', function() {
                    window.location = 'login.html';
                });
            }

        }, true);


    } ;

    // 退出登录
    var logout = function() {

        if( urlParam.cfid && urlParam.username && urlParam.code ) {

            // 通过处方单获取订单
            member.offLogin(logout);

            // 如果会员已登录则退出登录
            member.logout(function() {
                if( Config.platform.isFromWx ){
                    member.wx_auth();

                } else {
                    yfz_login();
                }

            });

        } else {
            orderDetail.init();
        }
    };

    member.onLogin(logout);

    // 会员登录事件
    member.onLogout(function () {

        if( urlParam.cfid  && urlParam.username && urlParam.code) {

            // 通过处方单获取订单
            member.offLogin(logout);
            // 会员登录
            yfz_login();

        }  else {
            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
        }

    });

    // 订单详情
    router.register('', function() {

        if( orderDetail.vmData.invoice_desc ){
            orderDetail.vmData.invoice_desc = false ;
        }

    } , 1  );

    //查看电子发票
    router.register('?invoice_list', function() {} , 0 , 0 );


});