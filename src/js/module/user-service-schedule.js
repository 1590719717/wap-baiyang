/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/27 027
 * @description Description
 */

define('user-service-schedule',['member', 'ajax', 'mvvm', 'popup', 'widget','public'],function (require, exports) {
    var member = require('member');
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var popup = require('popup');
    var widget = require('widget');
    var Public = require('public');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var service_sn = Public.getSearchParam('service_sn');    //服务单号

    var mvData = MVVM.define('service-logistics',{
        service_sn : service_sn,
        order_sn : '' ,
        service_time: '',
        service_data : [] ,
        status: 0 ,                //服务单状态   4:填写物流 5:修改物流
        is_can_cancel: 0 ,         //是否有撤销按钮 1：有撤销按钮  0： 没有
        is_show_wl: 0 ,            //是否显示填写/修改物流的按钮 育学园订单不显示   0 不显示 1显示

        //撤销申请退款
        cancelRefund: function() {
            popup.confirm('确认撤销申请？', function() {
                popup.loading('show');
                ajax({
                    type: 'post',
                    url: Config.url + 'background/order/cancel_refund_apply',
                    data: {
                        order_sn: mvData.order_sn,
                        service_sn: mvData.service_sn,
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if (data && data.code == 200) {
                            popup.success('撤销成功');
                            window.location.href = 'user-refund-list.html' ;

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
            });

        }

    });

    member.onLogin(function() {

        ajax({
            type: 'POST',               // 请求类型
            url: Config.url + 'background/order/get_service_status_list',                   // 请求url
            data: {              // 请求参数
                token : member.token ,
                service_sn : service_sn
            },
            dataType: 'json',              // 获取的数据类型
            beforeSend: function () {
                popup.loading('show');
            },
            success: function(data) {     // 成功回调
                popup.loading('hide');
                if(data && data.code == 200){
                    mvData.order_sn = data.data.order_sn ;
                    mvData.service_time = data.data.add_time;
                    mvData.service_data = data.data.list ;
                    mvData.status = data.data.status ;
                    mvData.is_can_cancel = data.data.is_can_cancel ;
                    mvData.is_show_wl = data.data.is_show ;

                } else {
                    popup.error(data?data.message:this.url + ' Error') ;
                }
            },
            error: function() {          // 失败回调
                popup.error(this.url + ' Error');
            }
        });

    });

});