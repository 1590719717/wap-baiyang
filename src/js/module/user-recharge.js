/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/27 027
 * @description Description
 */

define('user-recharge',['ajax', 'member', 'popup', 'widget', 'mvvm', 'router'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var router = require('router');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    // 对象遍历
    var forEachIn = function(object, callback) {
        for(var key in object){
            if(object.hasOwnProperty(key)){
                callback(key, object[key]);
            }
        }
    };

    var vmData = MVVM.define('user-recharge', {

        title: '充值' ,                //标题
        is_recharge: true ,            //是否是充值页面

        chosen: 100 ,                 //选择的金额 1:100 2:200 3:300 4:500 5:800 6:1000
        money_finally: 0,             // 发送的金额 实际金额
        money_txt:'',

        is_common : 1 ,             //是否勾选百洋用户协议
        is_right: true ,            //充值金额是否满足条件
        is_fromWx: Config.platform.isFromWx , //是否在微信内
        isFromBYTouchMachine: Config.platform.isFromBYTouchMachine , //是否在触屏机内
        pay_type:Config.platform.isFromWx?'wechat':'alipay',                   //alipay:支付宝支付，wechat：微信公众号支付，chinapay：银联支付

        order_id :'' ,                        //订单流水号

        appId:'',          // 微信支付 商户appid
        timeStamp:'',      // 微信支付 时间戳
        nonceStr:'',       // 微信支付 随机字符串
        wxpackage:'',      // 微信支付 package
        paySign:'',        // 微信支付 签名

        is_can_pay:true ,  //是否可以支付

        //选择支付方式
        setPayWay: function(type) {

            if( (vmData.pay_type == 'alipay' && Number( vmData.money_finally ) > 500000 ) || (vmData.pay_type == 'wechat' && Number( vmData.money_finally ) > 300000 ) ) {
                vmData.is_can_pay = false ;
            } else {
                vmData.is_can_pay = true ;
            }

        },

        // 充值选项被选中状态
        setMoney: function(id) {
            vmData.money_txt = '' ;
            if( id != vmData.chosen ) {
                vmData.is_right = true ;
                vmData.chosen = id ;
            } else {
                vmData.chosen = 0 ;
                vmData.is_right = false ;
            }
        },

        //充值
        balancePay: function() {
            if( vmData.is_right ) {
                if( vmData.is_common != 1) {
                    popup.error('请阅读同意《百洋商城余额用户协议》');

                } else {
                    vmData.money_finally =  vmData.chosen > 0 ? vmData.chosen : vmData.money_txt ;

                    if( (vmData.pay_type == 'alipay' && Number( vmData.money_finally ) > 500000 ) || (vmData.pay_type == 'wechat' && Number( vmData.money_finally ) > 300000 ) ) {
                        vmData.is_can_pay = false ;
                    } else {
                        vmData.is_can_pay = true ;
                    }

                    router.route('?balance-pay') ;
                }
            }
        },

        //发起支付
        payMoney: function() {

            if( vmData.is_can_pay ) {

                if( vmData.pay_type == 'chinapay' &&  Number( vmData.money_finally ) > 500000 ) {
                    popup.confirm('您充值金额过大，是否继续充值？', function() {
                        rechargePay();
                    }, {
                        cancelText: '关闭',
                        confirmText: '继续支付'
                    })

                } else {
                    rechargePay();
                }

            }

        }

    });

    // 支付
    function rechargePay() {
        ajax({
            type: 'POST',
            url: Config.url + 'wap/payment/balance_recharge',
            data: {
                token : member.token ,
                money : vmData.money_finally,
                pay_type: vmData.pay_type ,
                successurl : seajs.data.cwd + 'user-recharge-success.html'
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200 && data.data ){

                    // 银联支付
                    if( vmData.pay_type == 'chinapay' ){
                        var form = document.createElement('form');
                        form.setAttribute('action', data.data.new_pay_url);
                        form.setAttribute('method', 'post');
                        form.innerHTML = '<input type="hidden" name="prepay_id" value="' + data.data.prepay_id + '">' +
                        '<input id="tp" name="tp_account_id" type="hidden" value="' + data.data.tp_account_id + '">';
                        form.submit();

                        // 支付宝支付
                    } else if( vmData.pay_type == 'alipay'  ) {

                        // 跳转至支付宝支付页面
                        var url = 'https://mapi.alipay.com/gateway.do?';
                        var param = [];
                        forEachIn(data.data, function(key, value) {
                            param.push(key + '=' + encodeURIComponent(value));
                        });
                        window.location.replace(url + param.join('&'));

                        //微信支付
                    } else if( vmData.pay_type == 'wechat'  ) {

                        vmData.order_id =  data.data.re_no ;   //订单号

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
                    }

                } else {
                    popup.error(data?data.message:this.url + ' Error');

                }
            } ,
            error: function () {
                popup.error(this.url + ' Error');
            }
        });
    }

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
                    window.location = 'user-recharge-success.html?re_no=' + vmData.order_id ;
                } else if(res.err_msg == "get_brand_wcpay_request:fail" ) {
                    popup.error('支付失败');
                }
            }
        );
    }


    //检测输入的金额是否合理
    var money_inp = document.getElementById('money_inp') ;
    money_inp.addEventListener('input', function() {
        vmData.chosen = 0 ;
        setTimeout(function() {

            if(/^[1-9]\d*$/.test(vmData.money_txt) && Number(vmData.money_txt) >= 100 ) {
                vmData.is_right = true ;
            } else {
                vmData.is_right = false ;
            }

        }, 30);

    });
    money_inp.addEventListener('focus',function() {

        if( !vmData.money_txt ) {
            vmData.chosen = 0 ;
            vmData.is_right = false ;
        }

    });

    router.register('', function() {
        vmData.title = '充值' ;
        vmData.is_recharge = true ;

    }, 1 );

    router.register('?balance-comment', function() {
        vmData.title = '余额用户协议' ;
        vmData.is_recharge = false ;

    }, 0 , 0);

    router.register('?balance-pay', function() {
        vmData.title = '支付方式' ;
        vmData.is_recharge = false ;

    }, 0 , 0);

});