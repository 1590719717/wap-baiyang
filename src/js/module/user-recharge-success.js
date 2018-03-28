/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/27 027
 * @description Description
 */

define('user-recharge-success',['ajax', 'member', 'popup', 'widget', 'exbind', 'mvvm' , 'public'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var exbind = require('exbind');
    var MVVM = require('mvvm');
    var Public = require('public');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var order_id = Public.getSearchParam('re_no');

    var vmData = MVVM.define('user-recharge-success', {
        orderId: order_id ,                 //订单号
        money: 0 ,                          //金额
        pay_way: '',                        //支付方式
        pay_status: -1 ,                     //支付状态  0：支付失败  1：支付成功
        getData: function() {

            ajax({
                type: 'POST',
                url: Config.url + 'wap/payment/get_recharge_result',
                data: {
                    token : member.token ,
                    re_no : order_id
                },
                dataType: 'json',
                beforeSend: function() {
                    popup.loading('show');
                },
                success: function(data) {
                    popup.loading('hide');  

                    if(data && data.code == 200){
                        vmData.money = data.data.money ;
                        vmData.pay_way = data.data.chinaname ;
                        vmData.pay_status = data.data.status ;

                    } else {
                        popup.error(data?data.message:this.url + ' Error');
                    }
                } ,
                error: function () {
                    popup.error(this.url + ' Error');
                }
            });
        }
    });

    member.onLogin(function() {
        vmData.getData();
    });

});