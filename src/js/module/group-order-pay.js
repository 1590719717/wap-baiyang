/*!
 * @author lixiaoxiao@baiyjk.com
 * @date 2017/5/16 
 * @version 2.0
 * @description 订单支付
 */

define('group-order-pay',['ajax', 'member', 'popup', 'widget', 'mvvm'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');

    var config = window.Config;
    var platform = config.platform;

    // 订单id
    var order_id = decodeURI((location.search.substr(1).match(/(^|&)order_id=([^&]*)(&|$)/) || [])[2] || '');

	//判断订单是否满员
	var f = false;
	function isFull(callback){
		ajax({
	        type: 'post',
	        url: Config.url + 'fgroup/buy_now/chk_group_fight',
	        data: {
	            order_id:order_id,
	            token: member.token
	        },
	        dataType: 'json',
	        async:false,
	        success: function(data) {
	        	if(data.code == 34622){
	        		if(data.data.state == 2){
	        			f = true;
	        		}else{
	        			f = false;
	        		}
	        	}else{
	        		f = false;
	        	}
	        	callback();
	        },
	        error: function() {
	            f = false;
	        }
	    });
	}

    // 对象遍历
    var forEachIn = function(object, callback) {
        for(var key in object){
            if(object.hasOwnProperty(key)){
                callback(key, object[key]);
            }
        }
    };

    // 订单详情
    var vmData = MVVM.define('order-pay', {
        order_id: '',                                                   // 订单id
        real_pay: '0.00',                                               // 订单金额
        product_list: [],                                               // 产品列表

        is_global: false,                                           // 是否是海外优选
        is_from_wechat: platform.isFromWx,                              //是否在微信内
        is_touch_machine: platform.isFromBYTouchMachine ,               //是否是触屏机

        code_url : '' ,                                                 //支付的二维码

        pay_result_time: null ,                                          //支付宝的支付结果， 定时器

        // 离开页面提示
        back: function(url,type) {

            if( vmData.is_pay_alipay && type == 1){
                clearTimeout(vmData.pay_result_time);
                vmData.is_pay_alipay = false ;
            } else if( vmData.is_pay_wechat && type == 1){
                clearTimeout(vmData.pay_result_time);
                vmData.is_pay_wechat = false ;
            } else {
                popup.confirm('是否取消支付<br>下单后30分钟内未支付成功，订单将被取消，请尽快完成支付。', function() {
                    window.location = url;
                }, {
                    cancelText: '继续支付',
                    confirmText: '取消支付'
                })
            }
        },

        // 支付宝支付
        alipay: function() {
            if(!vmData.is_from_wechat && !vmData.is_global){
            	isFull(function(){
	                ajax({
	                    type: 'post',
	                    url: config.url + 'wap/payment/ali_order',
	                    data: {
	                        order_id: vmData.order_id,                          // 订单id
	                        return_url: seajs.data.cwd + 'group-submit-successfully.html?order_id=' + order_id,  // 同步跳转地址
	                        show_url: seajs.data.cwd + 'group-order.html#all',   // 订单列表页
	                        token: member.token
	                    },
	                    dataType: 'json',
	                    beforeSend: function () {
	                        //满员提示信息
		                	if(f){
		                		popup.success('该团已满，正在帮您入伙中...');
		                		setTimeout(function(){
		                    		popup.loading('show');
		                    	},3000)
		                	}else{
		                		popup.loading('show');
		                	}      
	                    },
	                    success: function (data) {
	                        popup.loading('hide');
	                        if(data && data.code == 200 && data.data){
	
	                            // 跳转至支付宝支付页面
	                            var url = 'https://mapi.alipay.com/gateway.do?';
	                            var param = [];
	                            forEachIn(data.data, function(key, value) {
	                                param.push(key + '=' + encodeURIComponent(value));
	                            });
	                            window.location.replace(url + param.join('&'));
	
	                        } else {
	                            popup.error('支付失败！');
	                        }
	                    },
	                    error: function () {
	                        popup.loading('hide');
	                        popup.error('支付失败！');
	                    }
	                });
	            })
            }
        },

        // 银联支付
        other: function() {
            if(!vmData.is_from_wechat && !vmData.is_global) {
            	isFull(function(){
	                ajax({
	                    type: 'post',
	                    url: config.url + 'wap/payment/baiyangpay_unified_order',
	                    data: {
	                        order_id: vmData.order_id,                          // 订单id
	                        success_url: seajs.data.cwd + 'group-submit-successfully.html?order_id=' + order_id,  // 同步跳转地址
	                        token: member.token
	                    },
	                    dataType: 'json',
	                    beforeSend: function () {
	                        //满员提示信息
		                	if(f){
		                		popup.success('该团已满，正在帮您入伙中...');
		                		setTimeout(function(){
		                    		popup.loading('show');
		                    	},3000)
		                	}else{
		                		popup.loading('show');
		                	}
	                    },
	                    success: function (data) {
	                        popup.loading('hide');
	                        if(data && data.code == 200 && data.data){
	                            //window.location.replace(data.data);
	
	                            var form = document.createElement('form');
	                            form.setAttribute('action', data.data.new_pay_url);
	                            form.setAttribute('method', 'post');
	                            form.innerHTML = '<input type="hidden" name="prepay_id" value="' + data.data.prepay_id + '">' +
	                            '<input id="tp" name="tp_account_id" type="hidden" value="' + data.data.ylchange + '">';
	                            form.submit();
	
	                        } else {
	                            popup.error('支付失败！');
	                        }
	                    },
	                    error: function () {
	                        popup.loading('hide');
	                        popup.error('支付失败！');
	                    }
	                });
	            });
            }
        },

        appId:'',          // 微信支付 商户appid
        timeStamp:'',      // 微信支付 时间戳
        nonceStr:'',       // 微信支付 随机字符串
        wxpackage:'',      // 微信支付 package
        paySign:'',        // 微信支付 签名

        // 微信支付
        wechat_pay: function() {
            if(vmData.is_from_wechat && !vmData.is_global){
            	isFull(function(){
	                ajax({
	                    type: 'post',
	                    url: config.url + 'wap/payment/wechat_unified_order',
	                    data: {
	                        order_id: vmData.order_id,
	                        token: member.token,
	                        trade_type: 'JSAPI'
	                    },
	                    dataType: 'json',
	                    beforeSend: function () {
	                        //满员提示信息
		                	if(f){
		                		popup.success('该团已满，正在帮您入伙中...');
		                		setTimeout(function(){
		                    		popup.loading('show');
		                    	},3000)
		                	}else{
		                		popup.loading('show');
		                	}      
	                    },
	                    success: function (data) {
	                        popup.loading('hide');
	                        if(data && data.code == 200 && data.data){
	                            vmData.appId = data.data.weixin.appId ;
	                            vmData.timeStamp = data.data.weixin.timeStamp ;
	                            vmData.nonceStr = data.data.weixin.nonceStr ;
	                            vmData.wxpackage = data.data.weixin.package;
	                            vmData.paySign = data.data.weixin.paySign ;
	
	                            if (typeof(WeixinJSBridge) == "undefined"){
	                                if( document.addEventListener ){
	                                    document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
	                                }else if (document.attachEvent){
	                                    document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
	                                    document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
	                                }
	                            } else {
	                                onBridgeReady();
	                            }
	
	                        } else {
	                            popup.error(data.message);
	                        }
	                    },
	                    error: function () {
	                        popup.loading('hide');
	                        popup.error('支付失败！');
	                    }
	                });
	            })
            }
        },

        is_pay_wechat: false ,                                          //触屏机使用微信支付
        is_pay_alipay: false ,                                          //触屏机使用支付宝支付

        //触屏机选择支付方式   1：支付宝  2：微信
        chose_pay_way: function(type) {

            vmData.code_url = '' ;

            if( type == 1 ){
                // 支付宝支付
                vmData.is_pay_alipay = true ;
                zfbPay();
            } else if( type == 2){
                // 微信支付
                vmData.is_pay_wechat = true ;
                wxPay();
            } else if(type == 3){
                // 易票联微信支付
                vmData.is_pay_wechat = true ;
                yplWxPay();
            }
        },

        // 易票联支付
        ypl_pay: function(type) {

            // wxNativeOnline:微信扫码支付,unionpaywap:银联在线支付WAP版,wxpay:银联在线支付WAP版
            var pay_id = ['wxpay', 'unionquickpay'][type];

             if(vmData.is_global && pay_id) {
				isFull(function(){
	                ajax({
	                    type: 'post',
	                    url: config.url + 'wap/payment/epaylinks',
	                    data: {
	                        token: member.token,              //  token-
	                        order_id: vmData.order_id,           //  订单id
	                        return_url: seajs.data.cwd + 'group-submit-successfully.html?order_id=' + order_id,         //  同步跳转地址
	                        pay_id: pay_id              //  选择支付方式
	                    },
	                    dataType: 'json',
	                    beforeSend: function () {
	                        //满员提示信息
		                	if(f){
		                		popup.success('该团已满，正在帮您入伙中...');
		                		setTimeout(function(){
		                    		popup.loading('show');
		                    	},3000)
		                	}else{
		                		popup.loading('show');
		                	}     
	                    },
	                    success: function (data) {
	
	                        popup.loading('hide');
	
	                        if(data && data.code == 200 && data.data.url){
	                            window.location = data.data.url;
	                        } else {
	                            popup.error(data.message);
	                        }
	                    },
	                    error: function () {
	                        popup.error('支付失败！');
	                    }
	                });
	            })
            }


        }

    });

    // 易票联微信扫码支付
    var yplWxPay = function() {

        // 定时检查支付结果
        var checkPayState = function() {
            vmData.pay_result_time = setTimeout(function() {

                ajax({
                    type: 'POST',
                    url: config.url + 'wap/payment/order_is_pay',
                    data: {
                        token : member.token ,
                        is_global: Number(vmData.is_global),
                        order_id : vmData.order_id
                    },
                    dataType: 'json',
                    success: function(data) {
                        if(data && data.code == 200){

                            if(data.data.is_pay == 1){

                                clearTimeout(vmData.pay_result_time);
                                popup.success('支付成功',function() {
                                    window.location.replace('group-submit-successfully.html?order_id=' + vmData.order_id );
                                });

                            } else {
                                checkPayState();
                            }

                        }
                    }

                });
            }, 2000);
        };

        //获取触屏机微信支付二维码
        ajax({
            type: 'POST',
            url: config.url + 'wap/payment/epaylinks',
            data: {
                token: member.token,              //  token-
                order_id: vmData.order_id,           //  订单id
                return_url: seajs.data.cwd + 'group-submit-successfully.html?order_id=' + order_id,         //  同步跳转地址
                pay_id: 'wxNative'              //  返回二维码
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {

                if(data && data.code == 200){
                    var img_src = data.data.url;
                    var  img = new Image();
                    img.onload = function() {
                        popup.loading('hide');
                        vmData.code_url = img_src;
                    };
                    img.src = img_src;

                    checkPayState();
                }else{
                    popup.error(data.message);
                }
            },
            error: function() {
                popup.error('支付失败！');
            }
        });

    };

    // 微信扫码支付
    var wxPay = function() {

        // 定时检查支付结果
        var checkPayState = function() {
            vmData.pay_result_time = setTimeout(function() {
                ajax({
                    type: 'POST',
                    url: config.url + 'wap/payment/wechat_payment_check',
                    data: {
                        token : member.token ,
                        order_id : vmData.order_id

                    },
                    dataType: 'json',
                    success: function(data) {
                        if(data && data.code == 888){
                            clearTimeout(vmData.pay_result_time);
                            popup.success('支付成功',function() {
                                window.location.replace('group-submit-successfully.html?order_id=' + vmData.order_id);
                            });
                        } else if(data && data.code == 804){
                            clearTimeout(vmData.pay_result_time);
                            popup.error('支付失败');
                        } else {
                            checkPayState();
                        }
                    }
                });
            }, 2000);
        };

        //获取触屏机微信支付二维码
        ajax({
            type: 'POST',
            url: config.url + 'wap/payment/wechat_unified_order',
            data: {
                token : member.token ,
                order_id : vmData.order_id ,
                trade_type: 'NATIVE'

            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {

                if(data && data.code == 200){
                    var img_src = data.data.qr_url + '?' + Date.now() ;
                    var  img = new Image();
                    img.onload = function() {
                        popup.loading('hide');
                        vmData.code_url = img_src;
                    };
                    img.src = img_src;

                    checkPayState();
                }else{
                    popup.error(data.message);
                }
            },
            error: function() {
                popup.error('支付失败！');
            }
        });

    };

    // 支付宝扫码支付
    var zfbPay = function() {

        // 定时检查支付结果
        var checkPayState = function() {
            vmData.pay_result_time = setTimeout(function() {
                ajax({
                    type: 'POST',
                    url: config.url + 'wap/payment/ali_order_query',
                    data: {
                        token : member.token ,
                        order_id : vmData.order_id

                    },
                    dataType: 'json',
                    success: function(data) {
                        if(data && data.code == 888){
                            clearTimeout(vmData.pay_result_time);
                            popup.success('支付成功',function() {
                                window.location.replace('group-submit-successfully.html?order_id=' + vmData.order_id);
                            });
                        } else if(data && data.code == 804){
                            clearTimeout(vmData.pay_result_time);
                            popup.error('支付失败');
                        } else {
                            checkPayState();
                        }
                    }
                });
            }, 2000);
        };

        //获取触屏机支付宝的支付二维码
        ajax({
            type: 'POST',
            url: config.url + 'wap/payment/ali_order_qrpay',
            data: {
                token : member.token ,
                order_id : vmData.order_id

            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {

                if(data && data.code == 200){
                    var img_src = data.data.qr_url + '?' + Date.now() ;
                    var  img = new Image();
                    img.onload = function() {
                        popup.loading('hide');
                        vmData.code_url = img_src;
                    };
                    img.src = img_src;

                    checkPayState();
                }else{
                    popup.error(data.message);
                }
            },
            error: function() {
                popup.error('支付失败！');
            }
        });

    };

    // h5调用微信支付
    function onBridgeReady(){

        WeixinJSBridge.invoke(
            'getBrandWCPayRequest',

            {
                "appId" : vmData.appId,               //公众号名称，由商户传入
                "timeStamp": vmData.timeStamp,         //时间戳，自1970年以来的秒数
                "nonceStr" : vmData.nonceStr,         //随机串
                "package" : vmData.wxpackage,
                "signType" : 'MD5',                        //微信签名方式：
                "paySign" : vmData.paySign      //微信签名
            },
            function(res){

                if(res.err_msg == "get_brand_wcpay_request:ok" ) {
                    window.location.replace('group-submit-successfully.html?order_id=' + order_id);
                } else if(res.err_msg == "get_brand_wcpay_request:fail" ) {
                    popup.error('支付失败');
                }
            }
        );
    }


    if(order_id){

        popup.loading('show');

        // 会员登录登出事件
        member.onLogin(function() {

            // 获取订单详情
            member.getOrderDetail({
                order_id: order_id            // 订单id

            }, function(data) {
                popup.loading('hide');

                if(data && data.code == 200 && data.data){
                    if(data.data.orderInfo.order_status == 'paying') {

                        // 如果是待付款的订单则加载支付方式
                        vmData.order_id = data.data.orderInfo.order_sn;
                        vmData.real_pay = data.data.orderInfo.left_unpaid;
                        vmData.is_global = data.data.is_global;

                    } else {
                        // 跳转到订单详情
                        window.location = 'group-order-detail.html?id=' + data.data.orderInfo.order_sn;
                    }
                } else {
                    popup.error(data ? data.message : '订单参数错误！', function() {
                        window.location = 'group-order.html';
                    });
                }
            });

        });

    } else {
        // 返货购物车
        popup.error('订单参数错误！', function() {
            window.location = 'group-order.html';
        });
    }

    // 会员登录登出事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
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

});