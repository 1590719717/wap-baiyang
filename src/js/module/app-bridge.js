/*
 * @Author: lixiaoxiao@huobi.com 
 * @Date: 2018-05-09 17:06:26 
 * @Last Modified by:   lixiaoxiao@huobi.com 
 * @Last Modified time: 2018-05-09 17:06:26 
 */

define('app-bridge', [], function (require, exports) {
    var platform = Config.platform;

    var Event = (function () {
        var events = {};

        return {
            add: function (event, handler) {
                if (!events[event]) {
                    events[event] = [];
                }
                if (({}).toString.call(handler) === '[object Function]') {
                    events[event].push(handler);
                }
            },
            fire: function (event, data, context) {
                if (events[event] && events[event].length) {
                    events[event].forEach(function (handler) {
                        handler.call(context || null, data);
                    });
                }
            },
            del: function (event, handler) {
                if (events[event]) {
                    if (handler) {
                        for (var i = 0, len = events[event].length; i < len; i++) {
                            if (handler === events[event][i]) {
                                break;
                            }
                        }
                        events[event].splice(i, 1);
                    } else {
                        events[event].length = 0;
                    }
                }
            }
        };
    })();

    var BYAPPBridge = null;

    /*这段代码是固定的，必须要放到js中*/
    function setupWebViewJavascriptBridge(callback) {
        if (platform.isFromAndroid) {
            if (window.WebViewJavascriptBridge) {
                callback(WebViewJavascriptBridge)
            } else {
                document.addEventListener(
                    'WebViewJavascriptBridgeReady',
                    function () {
                        callback(WebViewJavascriptBridge)
                    },
                    false
                );
            }
        }
        if (platform.isFromIos) {
            if (window.WebViewJavascriptBridge) {
                return callback(WebViewJavascriptBridge);
            }
            if (window.WVJBCallbacks) {
                return window.WVJBCallbacks.push(callback);
            }
            window.WVJBCallbacks = [callback];
            var WVJBIframe = document.createElement('iframe');
            WVJBIframe.style.display = 'none';
            WVJBIframe.src = 'wvjbscheme://__BRIDGE_LOADED__';
            document.documentElement.appendChild(WVJBIframe);
            setTimeout(function () {
                document.documentElement.removeChild(WVJBIframe)
            }, 0);
        }
    }

    /*与OC交互的所有JS方法都要放在此处注册，才能调用通过JS调用OC或者让OC调用这里的JS*/
    setupWebViewJavascriptBridge(function (bridge) {
        if (platform.isFromAndroid) {
            bridge.init(function (message, responseCallback) {
                var data = {
                    'test': 123
                };
                responseCallback(data);
            });
        }

        BYAPPBridge = bridge;

        Event.fire('bridge_ready', bridge);

    });


    return {
        // APP设置token事件
        getToken: function (callback) {

            var callHandler = function (bridge) {
                bridge.callHandler('getUserToken', {
                    'param': ''
                }, callback);
            };

            if (({}).toString.call(callback) === '[object Function]') {
                if (BYAPPBridge) {
                    callHandler(BYAPPBridge);
                } else {
                    Event.add('bridge_ready', callHandler);
                }

            }

        },

        // 调用app登录事件
        loginApp: function (callback, param) {

            var callHandler = function (bridge) {
                bridge.callHandler('loginApp', param, callback);
            };

            if (({}).toString.call(callback) === '[object Function]') {
                if (BYAPPBridge) {
                    callHandler(BYAPPBridge);
                } else {
                    Event.add('bridge_ready', callHandler);
                }

            }

        },

        //{"show":true }
        //隐藏app 分享按钮
        showShareButton: function (callback, param) {
            var callHandler = function (bridge) {
                bridge.callHandler('showShareButton', param, callback);
            };

            if (({}).toString.call(callback) === '[object Function]') {
                if (BYAPPBridge) {
                    callHandler(BYAPPBridge);
                } else {
                    Event.add('bridge_ready', callHandler);
                }

            }
        },

        //方法：调起app的分享控件，并且分享对应的设置内容（内容包括分享点击的url，分享的图片icon，分享的内容，分享的标题，share_image_url单独分享图片的链接）
        // share_name_list 分享的途径 数组  ["QQ","QQZone","WechatSession","WechatTimeline","QrCode","CopyLink"]
        // 分享图片只有三个分享途径：
        //  bridge.shareInApp(function() {
        //    js调用该方法成功后，js想做的操作
        // },{"share_image_url":"图片url","share_name_list":["QQ","WechatSession","WechatTimeline"]});
        // 分享页面 ：
        // bridge.shareInApp(function() {
        //  //js调用该方法成功后，js想做的操作
        // },{"share_url":"分享点击的url","share_icon":"分享的图片icon","share_title":"分享标题","share_detail":"分享副标题"});
        shareInApp: function (callback, param) {

            var callHandler = function (bridge) {
                bridge.callHandler('shareInApp', param, callback);
            };

            if (({}).toString.call(callback) === '[object Function]') {
                if (BYAPPBridge) {
                    callHandler(BYAPPBridge);
                } else {
                    Event.add('bridge_ready', callHandler);
                }
            }

        },

        //跳转到app首页
        jumpToAppHomePage: function (callback) {

            var callHandler = function (bridge) {
                bridge.callHandler('jumpToAppHomePage', {
                    'param': ''
                }, callback);
            };

            if (({}).toString.call(callback) === '[object Function]') {
                if (BYAPPBridge) {
                    callHandler(BYAPPBridge);
                } else {
                    Event.add('bridge_ready', callHandler);
                }

            }

        },
        // 获取app udid
        getUdid: function (callback) {

            var callHandler = function (bridge) {
                bridge.callHandler('getUDIDInfoFromApp', {
                    'param': ''
                }, callback);
            };

            if (({}).toString.call(callback) === '[object Function]') {
                if (BYAPPBridge) {
                    callHandler(BYAPPBridge);
                } else {
                    Event.add('bridge_ready', callHandler);
                }

            }

        }
    };

});