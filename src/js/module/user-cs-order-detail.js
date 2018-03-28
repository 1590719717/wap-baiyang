/*!
 * @author yuchunfeng
 * @date 2016/7/02
 * @description 我的订单详情
 */
define('user-cs-order-detail', ['ajax', 'exbind', 'member', 'popup', 'widget', 'mvvm', 'public'], function (require, exports) {
    var ajax = require('ajax');
    var exbind = require('exbind');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var public = require('public');

    // 会员登录事件
    member.onLogout(function () {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    // 订单id 用户id
    var order_id = public.getSearchParam('order_id'),
        user_id = public.getSearchParam('user_id');

    var orderDetail = {

        vmData: MVVM.define('user-order-detail', {
            order_id:order_id ,     //订单id
            user_id: user_id ,      //委托人id
            data: []              //当前订单列表,
        }),

        orderDetail: function () {
            var that = this;

            ajax({
                type: 'post',
                url: Config.url + 'wap/order/order_detail',
                data: {
                    order_id: order_id ,
                    user_id: user_id,
                    token: member.token
                },
                dataType: 'json',
                beforeSend: function () {
                    popup.loading('show');
                },
                success: function (data) {
                    popup.loading('hide');

                    if (data && data.code == 200) {
                        that.vmData.data = data.data;

                    } else {
                        popup.error(data.message);
                    }
                },
                error: function () {
                    popup.loading('hide');
                    popup.error('获取订单数据失败');
                }
            });

        },
        init: function () {
            var that = this;
            that.orderDetail();
        }
    };

    member.onLogin(function() {
        orderDetail.init();
    });
});