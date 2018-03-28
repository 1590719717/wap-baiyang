/*!
 * @author wentaini@163.com yuchunfeng
 * @date 2016/7/01
 * @description 我的订单
 */


define('user-order',['exbind', 'widget', 'event', 'popup', 'mvvm', 'ajax', 'member'],function (require, exports) {
    var exbind = require('exbind');
    var widget = require('widget');
    var event = require('event');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var member = require('member');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var  vmData =  MVVM.define('user-order', {
        type : 'all' ,         //订单类型
        page: 1,              //页码
        size: 10,             //每页长度
        count: 0,          //当前状态订单数量
        list: null,              //当前订单列表
        //删除订单
        delectOrder: function(order_sn){//删除订单

            popup.confirm('确认删除订单？', function() {
                popup.loading('show');
                ajax({
                    type: 'post',
                    url: Config.url + 'background/order/order_delete',
                    data: {
                        order_sn:order_sn,
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if (data && data.code == 200) {

                            popup.success('删除成功');

                            vmData.page = 1 ;
                            getData();

                        } else if (data && (data.code == 201)) {
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

            }, {
                cancelText: '取消',
                confirmText: '确定'
            });

        },
        //取消订单
        cancelOrder: function(order_sn){//取消订单

            popup.confirm('确认取消订单？', function() {
                popup.loading('show');
                ajax({
                    type: 'post',
                    url: Config.url + 'background/order/order_cancel',
                    data: {
                        order_sn: order_sn,
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if (data && data.code == 200) {

                            popup.success('取消成功');

                            vmData.page = 1 ;
                            getData();

                        } else if (data && (data.code == 201)) {
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

            }, {
                cancelText: '取消',
                confirmText: '确定'
            });

        },
        //确认收货
        confirmOrder: function(order_sn,is_refunding){//确认收货
            popup.confirm(is_refunding == 1?'该订单中存在有退款记录，确定收货将关闭退款?':'确认收货？', function() {
                popup.loading('show');
                ajax({
                    type: 'post',
                    url: Config.url + 'background/order/order_status_deal',
                    data: {
                        order_sn: order_sn,   //订单id
                        status: 'shipped', //只支持 shipped:待收货 evaluating:待评价
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if (data && data.code == 200) {

                            vmData.page = 1 ;
                            getData();

                        } else if (data && (data.code == 201)) {
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

            }, {
                cancelText: '取消',
                confirmText: '确定'
            });

        }

    });

    var getData = function(callback) {
        popup.loading('show');
        ajax({
            type: 'post',
            url: Config.url + 'background/order/user_order_list',
            data: {
                status: vmData.type,
                page: vmData.page,
                size: vmData.size,                   //每页长度
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200){

                    vmData.count = data.data.pageCount ;

                    if(vmData.page == 1){
                        vmData.list = [].concat(data.data.orderList);
                    }else {
                        vmData.list = vmData.list.concat(data.data.orderList);
                    }

                    callback && callback();

                } else if(data && data.code == 201) {

                    // 未登录
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                } else if(data && data.code == 100006 && vmData.page == 1){
                    vmData.list = [] ;

                } else {
                    popup.error(data?data.message:this.url + ' Error') ;
                }
            },
            error: function() {
                popup.error(this.url + ' Error');

            }
        });
    };


    // 滑动到底部则自动更新
    var winHeight = window.innerHeight + 100,
        scrollWrap = document.getElementById('order_content'),
        scrollLock = false,
        timer;

    scrollWrap.addEventListener('scroll', function() {

        if(!scrollLock){
            clearTimeout(timer);
            timer = setTimeout(function() {

                if( scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && vmData.page < vmData.count ){
                    lastScroll =  scrollWrap.scrollTop  ;
                    vmData.page += 1;
                    scrollLock = true;
                    getData(function() {
                        scrollLock = false;
                    });
                }
            }, 20);
        }

    });


    // 根据URL参数跳转栏目
    var pageRouter = (function() {

        var currentPage = null;

        return function() {
            var hash = location.hash.substr(1);

            var type = hash || 'all';
            vmData.type = type ;
            vmData.page = 1;
            var click_a = document.querySelectorAll('.order-nav a');
            [].slice.call(click_a || []).forEach(function(item){
                item.classList.remove('active');
            });

            try{
                document.querySelector('.order-nav a.'+type).classList.add('active');
                document.querySelector('.order-nav').classList.remove('hide');
            }catch(e){
                document.querySelector('.order-nav').classList.add('hide');
            }
            getData();
        }
    })();


    // 栏目切换事件
    window.addEventListener('hashchange', function() {
        pageRouter();
    });

    member.onLogin(function(){
        pageRouter();
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

