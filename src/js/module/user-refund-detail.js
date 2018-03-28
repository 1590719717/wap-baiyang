/*!
 * @author wentaini@163.com yuchunfeng
 * @date 2017/5/22
 * @description 退货详情
 */


define('user-refund-detail',['exbind', 'widget', 'popup', 'mvvm', 'ajax', 'member','public','router'],function (require, exports) {
    var exbind = require('exbind');
    var widget = require('widget');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var member = require('member');
    var Public = require('public');
    var router = require('router');

    var service_sn = Public.getSearchParam('service_sn') ;

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var vmData =  MVVM.define('refund-detail', {

        service_sn: service_sn ,
        order_sn : '' ,   //订单号
        data_list: {} ,

        //撤销申请退款
        cancelRefund: function() {
            popup.confirm('确认撤销申请？', function() {
                popup.loading('show');
                ajax({
                    type: 'post',
                    url: Config.url + 'background/order/cancel_refund_apply',
                    data: {
                        order_sn: vmData.order_sn,
                        service_sn: vmData.service_sn,
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if (data && data.code == 200) {
                            popup.success('撤销成功');
                            window.location.href = 'user-refund-list.html' ;

                        } else {
                            popup.error(data?data.message:this.url + ' Error');
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

        } ,

        photo_arr:[] ,        // 图片列表
        // 图片当前index
        scroll_index : 1 ,
        // 查看图片
        scrollImg: function( index ) {
            vmData.scroll_index = index ;
            router.route('?scroll_img') ;
        }

    });

    var getData = function() {

        popup.loading('show');

        ajax({
            type: 'post',
            url: Config.url + 'background/order/get_service_detail',
            data: {
                service_sn: service_sn ,
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200){
                    vmData.data_list = data.data ;
                    vmData.order_sn = data.data.order_sn ;
                    vmData.photo_arr = data.data.images ;

                } else if(data && data.code == 201) {
                    // 未登录
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                } else {
                    popup.error(data?data.message:this.url + ' Error') ;
                }
            },
            error: function() {
                popup.error(this.url + ' Error');

            }
        });
    } ;

    member.onLogin(function(){
        getData();
    });

    //评价 商品列表
    router.register('', function(){}, 1 );

    router.register('scroll_img', function(){}, 0 , 0 );

});

