/*!
 * @author liyuelong1020@gmail.com yuchunfeng
 * @date 2016/7/6 006
 * @description 订单支付
 */

define('order-submit-successfully',['ajax', 'member', 'popup', 'widget', 'mvvm', 'exbind'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var exbind = require('exbind');

    // 会员登出事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    // 订单id
    var order_id = decodeURI((location.search.substr(1).match(/(^|&)order_id=([^&]*)(&|$)/) || [])[2] || '');
    var platform = Config.platform ;
    // 订单详情
    var vmData = MVVM.define('order-pay', {
        order_id: '',           // 订单id
        real_pay: '0.00',       // 订单金额

        order_status: '',       // 订单状态
        rx_exist: 0,            // 是否是处方药
        payment_id : 0 ,        //支付方式

        bottom_link: '',         // 底部广告链接
        bottom_img: '',         // 底部广告图片

        is_touch_machine: platform.isFromBYTouchMachine ,      //是否是触屏机
        is_popup_logout: false ,  // 是否显示退出登录的弹窗
        is_click_popup : false ,  // 5s后自动出现弹窗后，点击继续购物后，将不会再出现退出弹窗

        click_url: '' ,          //点击继续购物按钮的跳转链接
        time_count: null ,       //定时器

        is_focus: 1 ,        //是否关注公众号  1：已关注 0：未关注
        is_from_wx: platform.isFromWx,  //是否在微信内

        is_parent: 0 ,        //是否拆单 0否  1是

        // 返回首页
        view_url: function(url) {
            if( vmData.is_touch_machine && !vmData.is_click_popup){
                clearTimeout(vmData.time_count);
                vmData.is_popup_logout = true ;
                if( url ){
                    vmData.click_url = url ;
                }
            } else {
                window.location.replace(url);
            }
        },

        //继续购物
        goBuy: function(){
            if( vmData.click_url ){
                window.location.replace( vmData.click_url );
            } else {
                vmData.is_popup_logout = false ;
                vmData.is_click_popup = true ;
                window.location.replace('index.html');
            }

        } ,

        //返回首页
        goExit: function() {
            popup.loading('show');
            member.logout(function(data) {
                popup.loading('hide');

                if(data && data.code == 200){
                    window.location = 'index.html';
                }
            }) ;
        }

    });

    // 获取订单详情
    var getOrderInfo = function(order_id) {
        ajax({
            type: 'post',
            url: Config.url + 'background/order/order_detail',
            data: {
                order_sn: order_id,            // 订单id
                token: member.token
            },
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function (data) {
                popup.loading('hide');

                if(data && data.code == 200 && data.data){
                    vmData.rx_exist = data.data.rx_exist;       // 是否是处方药 0：不是  1：是
                    vmData.order_id = data.data.orderInfo.order_sn;    //订单号
                    vmData.payment_id = data.data.orderInfo.payment_id ;   //支付方式
                    vmData.is_parent = data.data.orderInfo.is_parent ;

                    if( vmData.payment_id == 3 || vmData.payment_id == 1 || vmData.payment_id == 2 || vmData.payment_id == 5 || vmData.payment_id == 6 ) {
                        vmData.real_pay =  data.data.orderInfo.left_unpaid ;

                    } else if( vmData.payment_id == 7 ) {
                        //余额全额支付
                        vmData.real_pay =  data.data.orderInfo.balance_price ;

                    } else {
                        vmData.real_pay =  data.data.orderInfo.left_unpaid ;
                    }

                    vmData.order_status = data.data.orderInfo.status;

                    // 订单支付成功监测代码
                    if(data.data.rx_exist != 1 || data.data.orderInfo.status != 'paying') {
                        try {
                            ga('require', 'ecommerce');

                            ga('ecommerce:addTransaction', {
                                'id': data.data.orderInfo.order_sn,                       // 订单ID
                                'revenue': data.data.orderInfo.left_unpaid,               // 订单总额
                                'affiliation': [(member.userInfo ? member.userInfo.phone: ''), data.data.orderInfo.callback_phone].join(',')       // 账户绑定的手机号,收货人的手机号.
                            });

                            data.data.goodsList.forEach(function(product) {
                                ga('ecommerce:addItem', {
                                    'id': data.data.orderInfo.order_sn,       // 订单ID
                                    'name': product.goods_name,               // 商品名称
                                    'sku': product.goods_id,                  // 商品编号
                                    'price': product.unit_price,              // 商品价格
                                    'quantity': product.goods_number          // 商品数量
                                });
                            });

                            ga('ecommerce:send');

                        } catch (e) {
                            console.error(e)
                        }
                    }

                } else {
                    popup.error(data ? data.message : '订单参数错误！', function() {
                        window.location.replace('user-order.html');
                    });
                }
            },
            error: function () {
                popup.error(this.url + ' Error');
            }
        });
    };

    //  会员登录
    member.onLogin(function() {

        if(order_id ){
            getOrderInfo(order_id);
        } else {
            // 返回订单中心
            popup.error('订单参数错误！', function() {
                window.location.replace('user-order.html');
            });
        }

        // 判断用户是否已关注公众号
        if( !platform.isFromBYTouchMachine && !platform.isFromBaiYangApp ) {
            ajax({
                type: 'post',
                url: Config.url + 'wechat/notify/subscribe',
                data: {
                    token: member.token
                },
                dataType: 'json',
                success: function (data) {
                    popup.loading('hide');
                    if(data && data.code == 200 ){
                        vmData.is_focus = data.data.is_subscribe ;
                    }
                } ,
                error: function () {

                }
            });
        }

        // 获取底部广告位
        ajax({
            type: 'post',
            url: Config.url + 'wap/payment/pay_success_ad',
            data: {
                token: member.token
            },
            dataType: 'json',
            success: function (data) {
                popup.loading('hide');
                if(data && data.code == 200 && data.data && data.data.spread && data.data.spread[0]){
                    var spread = data.data.spread[0];
                    if(spread.location || spread.image_url) {
                        vmData.bottom_link = spread.location;
                        vmData.bottom_img = spread.image_url;
                    }
                }
            } ,
            error: function () {

            }
        });

    });

    //触屏机5秒后自动出现退出弹窗
    if( vmData.is_touch_machine && !vmData.is_popup_logout){

        vmData.time_count = setTimeout(function() {
            vmData.is_popup_logout = true ;
        },5000);
    }

    // 点击灰色弹层 隐藏弹窗
    var popup_focus = document.getElementById('popup_focus');
    popup_focus.addEventListener('click', function(e) {
        var focus_content = document.getElementById('focus_content');
        if(!focus_content.isEqualNode(e.target) && !focus_content.contains(e.target)){
            vmData.is_focus = 1 ;
        }
    });


});