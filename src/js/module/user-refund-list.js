/*!
 * @author wentaini@163.com yuchunfeng
 * @date 2016/7/01
 * @description 我的订单
 */


define('user-refund-list',['exbind', 'widget', 'event', 'popup', 'mvvm', 'ajax', 'member','public'],function (require, exports) {
    var exbind = require('exbind');
    var widget = require('widget');
    var event = require('event');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var member = require('member');
    var Public = require('public');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var order_sn = Public.getSearchParam('order_sn') ;

    var vmData =  MVVM.define('refund-list', {

        order_sn : order_sn ,   //订单号
        pageSize : 10 ,         //每页条数
        pageStart : 1,          //页数
        total : 0 ,             //总数
        data_list: null ,
        //撤销申请退款
        cancelRefund: function(order_sn,service_sn) {

            popup.confirm('确认撤销申请？', function() {
                popup.loading('show');
                ajax({
                    type: 'post',
                    url: Config.url + 'background/order/cancel_refund_apply',
                    data: {
                        order_sn: order_sn,
                        service_sn:service_sn,
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if (data && data.code == 200) {
                            popup.success('撤销成功');
                            vmData.pageStart = 1 ;
                            getData();


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

    var getData = function( callback ) {

        popup.loading('show');
        var para = {
            'pageSize': vmData.pageSize,
            'pageStart': vmData.pageStart,
            'token': member.token
        };

        if( vmData.order_sn.length ) {
            para.order_sn = vmData.order_sn ;
        }

        ajax({
            type: 'post',
            url: Config.url + 'background/order/get_service_list',
            data: para,
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200){

                    vmData.total = data.data.pageCount ;

                    if( vmData.pageStart == 1 ){
                        vmData.data_list = [].concat(data.data.list)  ;
                    } else {
                        vmData.data_list = vmData.data_list .concat(data.data.list)  ;
                    }

                    callback && callback();

                } else if(data && data.code == 201) {
                    // 未登录
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                } else if(data && data.code == 100006 && vmData.pageStart == 1){
                    vmData.data_list = [] ;

                } else {
                    popup.error(data?data.message:this.url + ' Error') ;
                }
            },
            error: function() {
                popup.error(this.url + ' Error');

            }
        });
    } ;

    // 滑动到底部则自动更新
    var winHeight = window.innerHeight + 100,
        scrollWrap = document.getElementById('refund_list'),
        scrollLock = false,
        timer;

    scrollWrap.addEventListener('scroll', function () {
        if(!scrollLock){
            clearTimeout(timer);
            timer = setTimeout(function() {
                if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && vmData.pageStart < vmData.total){
                    vmData.pageStart += 1;
                    scrollLock = true;
                    getData(function() {
                        scrollLock = false;
                    });
                }
            }, 20);
        }

    });

    member.onLogin(function(){
        getData();
        //订单商品滑动
        exbind.register('product-list-swipe', 'load', function(e) {
            var node = this,
                listElem = node.children[0],
                scrollDiff = 0;
            node.addEventListener('swipeLeft', function(e) {
                e.stopPropagation();
                e.preventDefault();
            }).addEventListener('swipeRight', function(e) {
                e.stopPropagation();
                e.preventDefault();
            }).addEventListener('swipe', function(e) {
                e.stopPropagation();
                e.preventDefault();
                //大于4个才滑动
                if( listElem.children.length > 4 ){
                    listElem.style.transform = listElem.style.webkitTransform = 'translateX(' + (e.data.diffX.keys(0) - scrollDiff) + 'px)';
                }

            }).addEventListener('swipeEnd', function(e) {
                //大于4个才滑动
                if( listElem.children.length > 4 ) {
                    scrollDiff = scrollDiff - e.data.diffX.keys(0);
                    if(scrollDiff < 0 ){
                        scrollDiff = 0;
                    } else if(scrollDiff + node.offsetWidth > listElem.scrollWidth) {
                        scrollDiff = listElem.scrollWidth - node.offsetWidth ;
                        scrollDiff = scrollDiff > 0 ? scrollDiff : 0 ;
                    }
                    listElem.style.transform = listElem.style.webkitTransform = 'translateX(' + (-scrollDiff) + 'px)';
                }
            });
        });
    });

});

