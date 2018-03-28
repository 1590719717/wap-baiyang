/*!
 * @author lixiaoxiao@baiyjk.com
 * @date 2017/5/12
 * @description 拼团订单
 */
define('group-order',['exbind', 'widget', 'event', 'popup', 'mvvm', 'ajax', 'member'],function (require, exports) {
    var exbind = require('exbind');
    var widget = require('widget');
    var event = require('event');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var member = require('member');
	
	var config = window.Config;
	var platform = config.platform;
	
    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });
	
	var ajaxList = {
		// 获取订单列表
        getOrderList: function(param,handler){
            
            ajax({
                type: 'post',
                url: Config.url + 'fgroup/group/get_order_list',
                data: {
                    order_status: param.order_status,   //all：全部 paying：待付款 await:待成团 shipping:待发货 shipped: 待收货 evaluating:待评价 refund:退款/售后
                    page: param.page,                   //页码
                    size: param.size,                   //每页长度
                    order_type:param.order_type,        //拼团类型
                    token: member.token
                },
                dataType: 'json',
                success: function(data) {

                    handler && handler(data);
                },
                error: function() {
                    handler && handler();
                }
            });
        }
	}
	
    // 全部订单
    var orderAll = {
        vmData: MVVM.define('group-order', {
            page:1,              //页码
            size:10,             //每页长度
            count:null,          //当前状态订单数量
            list:[],              //当前订单列表

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

                                orderAll.orderList(1);

                            } else if (data && (data.code == 201)) {
                                // 未登录
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function() {
                            popup.error('InterFace Error');
                        }
                    });

                }, {
                    cancelText: '取消',
                    confirmText: '确定'
                });
            },
            cancelOrder: function(order_sn){//取消订单

                popup.confirm('确认取消订单？', function() {
                    popup.loading('show');
                    ajax({
                        type: 'post',
                        url: Config.url + 'fgroup/order/order_cancel',
                        data: {
                            order_sn: order_sn,
                            token: member.token
                        },
                        dataType: 'json',
                        success: function(data) {
                            popup.loading('hide');

                            if (data && data.code == 200) {

                                popup.success('取消成功');

                                orderAll.orderList(1);

                            } else if (data && (data.code == 201)) {
                                // 未登录
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                            } else if(data && data.code == 20){
                                window.location = 'user-order.html#all';
                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function() {
                            popup.error('InterFace Error');
                        }
                    });

                }, {
                    cancelText: '取消',
                    confirmText: '确定'
                });

            },
            confirmOrder: function(order_sn){//确认收货

                popup.confirm('确认收货？', function() {
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

                                orderAll.orderList(1);

                            } else if (data && (data.code == 201)) {
                                // 未登录
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function() {
                            popup.error('InterFace Error');
                        }
                    });

                }, {
                    cancelText: '取消',
                    confirmText: '确定'
                });

            }
        }),
        type:'',          //请求类型all：全部 paying：待付款 shipping:待发货 shipped: 待收货 evaluating:待评价 refund:退款/售后
        isReady: true,      //是否请求列表

        orderList: function(type, callback){
            /**
             * @type {int} 1.刷新 2.追加
             */

            var that = this;
            if(type == 1){
                that.vmData.page = 1;
            }

            popup.loading('show');

            ajaxList.getOrderList({
                order_status:that.type,
                order_type:5,
                page:that.vmData.page,
                size:that.vmData.size
            },function(data) {
                popup.loading('hide');
                that.isReady = false;
                if(data && data.code == 200){
                    that.vmData.count = Number(data.data.order_count) || 0;

                    if(type == 1){
                        that.vmData.list = [].concat(data.data.order_list);
                    }else if(type == 2){
                        that.vmData.list = that.vmData.list.concat(data.data.order_list);
                    }
                    that.isReady = true;

                    document.querySelector('.order-not-none').classList.remove('hide');
                    document.querySelector('.order-none').classList.add('hide');

                    callback && callback();

                } else if(data && data.code == 201) {

                    // 未登录
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                } else if(data && data.code == 100006 && type == 1){
                    document.querySelector('.order-not-none').classList.add('hide');
                    document.querySelector('.order-none').classList.remove('hide');

                }
            });
        },

        //监听滑动分页请求
        orderScroll: function(){

            var that = this;
            // 滑动到底部则自动更新
            var winHeight = window.innerHeight + 100,
                scrollLock = false,
                timer;

            exbind.register('order-scroll', 'scroll', function(e) {

                if(!scrollLock){
                    var scrollWrap = this;

                    if(that.isReady == false){
                        return;
                    }
                    clearTimeout(timer);

                    timer = setTimeout(function() {

                        if(that.isReady == false){
                            clearTimeout(timer);
                        }

                        if(parseInt(scrollWrap.scrollTop) + winHeight >= scrollWrap.scrollHeight && that.vmData.page < (that.vmData.count / that.vmData.size)){
                            that.vmData.page+=1;
                            scrollLock = true;
                            that.orderList(2, function() {
                                scrollLock = false;
                            });
                        }
                    }, 20);
                }

            });
        },
        init: function(type) {
            /**
             * @type {string} 请求类型all
             */
            var that = this;

            that.type = type;

            that.orderList(1);

            that.orderScroll();

        }
    }


    // 根据URL参数跳转栏目
    var pageRouter = (function() {

        var currentPage = null;

        return function() {
            var hash = location.hash.substr(1);

            var type = hash || 'all';
            var click_a = document.querySelectorAll('.order-nav a');
            [].slice.call(click_a || []).forEach(function(item){
                item.classList.remove('active');
            });

            try{
                document.querySelector('#'+type).classList.add('active');
                document.querySelector('.order-nav').classList.remove('hide');

            }catch(e){
                document.querySelector('.order-nav').classList.add('hide');
            }

            orderAll.init(type);

        }

    })();


    // 栏目切换事件
    window.addEventListener('hashchange', function() {
        pageRouter();
    });

    member.onLogin(function() {
        pageRouter();
    });
	
	if (platform.isFromWx || platform.isFromQQ) {
        // 微信全站绑定分享
        require.async('group-share', function (Share) {
			
            // 绑定分享
            var shareObject = Share({
                title: '海量爆款低价拼团，爱拼才会赢！',
                description: '母婴尖货、家庭常备用药、居家生活用品，千种爆款，低价开团！拼越多，赚越多！',
                img: config.cdn + 'images/icon-download.png',
                url: seajs.data.cwd + 'group-list.html',
                type: 'link'
            });

        });
    }
	
	// 订单倒计时
    exbind.register('count-down', 'load', function (e) {
        var elem = this,
            param = e.param;
            console.log(param.time)
        if (param.time ) {                  // 订单时间
            
            var timeCount = param.time*1000;
            var timer = null;

            var hour = 0;
            var minutes = 0;
            var seconds = 0;
            var setTimeCountDown = function() {
                timeCount -= 1000;

                minutes = Math.floor((timeCount % 3600000) / 60000);
                seconds = Math.floor((timeCount % 60000) / 1000);

                minutes = minutes < 10 ? '0' + minutes : minutes;
                seconds = seconds < 10 ? '0' + seconds : seconds;
                elem.innerHTML = minutes + ':' + seconds;

                if(timeCount <= 0) {
                	location.reload();
                    clearInterval(timer);
                }
            };

            if (timeCount > 0) {
                timer = setInterval(setTimeCountDown, 1000);
                setTimeCountDown();
            }
        }
    });
    // 开团倒计时
    exbind.register('group-down', 'load', function (e) {
        var elem = this,
            param = e.param;
        if (param.time) {
        	var timestamp = Date.parse(new Date());
            var timeCount = param.time*1000 - timestamp;
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

                elem.innerHTML =  hour + ':' + minutes + ':' + seconds;

                if(timeCount <= 0) {
                	location.reload();
                    clearInterval(timer);
                }
            };

            if (timeCount > 0) {
                timer = setInterval(setTimeCountDown, 1000);
                setTimeCountDown();
            }
        }
    });

});