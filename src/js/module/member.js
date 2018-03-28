/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/21 021
 * @description 会员中心公共模块
 */

define('member', ['ajax', 'public'], function (require, exports) {
    var ajax = require('ajax');
    var Public = require('public');

    var config = window.Config;
    var localCache = window.localCache;
    var cookieCache = window.cookieCache;
    var platform = config.platform;

    // 将token同时保存到 localStorage 和 cookie
    var getLocalData = function(name) {
        return cookieCache.getItem(name) || localCache.getItem(name) || '';
    };
    var setLocalData = function(name, value) {
        localCache.setItem(name, value || '');
        cookieCache.setItem(name, value || '');
    };
    var delLocalData = function(name) {
        localCache.removeItem(name);
        cookieCache.removeItem(name);
    };

    // 获取url参数
    var urlParam = Public.getUrlParam();


    /* 自定义事件
    *
    * 注册事件 add(event, handler)
    * 触发事件 fire(event, data[, context])
    * 删除事件 del(event[, handler])
    *
    * @event [string]  事件名称
    * @handler [function]  回调函数
    * @data [object] 传递给回调函数的参数
    * @context [object] 函数执行的作用域
    *
    * */
    var Event = (function() {
        var events = {};

        return {
            add: function(event, handler) {
                if(!events[event]){
                    events[event] = [];
                }
                if(Public.isFunction(handler)){
                    events[event].push(handler);
                }
            },
            fire: function(event, data, context) {
                if(events[event] && events[event].length){
                    events[event].forEach(function(handler) {
                        handler.call(context || null, data);
                    });
                }
            },
            del: function(event, handler) {
                if(events[event]){
                    if(handler){
                        for(var i = 0, len = events[event].length; i < len; i++){
                            if(handler === events[event][i]){
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


    /* 会员对象
    *
    * 属性
    * @loginState [boolean] 当前用户登录状态
    * @checkState [boolean] 是否已经检测用户登录状态
    * @userInfo [object]    用户信息
    * @token [string]       请求 token (保存到 localStorage['user_token'] 中)
    *
    * 方法
    * onLogin(handler)      添加用户登录事件
    * onLogout(handler)     添加用户退出事件
    * @handler [function]   回调函数
    *
    * */
    var Member = function() {
        this.loginState = false;       // 登录状态
        this.checkState = false;       // 检测状态
        this.userInfo = null;          // 用户信息
        this.token = getLocalData('user_token');
        this.unionid = getLocalData('user_unionid');

        this.appParam = {};

        //是否是积分商城首页
        this.init();

    };

    Member.prototype = {
        constructor: Member,

        // 添加用户登录事件
        onLogin : function(handler) {
            var that = this;
            Event.add('login', handler);
            if(that.checkState && that.loginState){
                handler.call(Event);
            }
        },

        // 删除用户登录事件
        offLogin: function(handler) {
            Event.del('login', handler);
        },

        // 添加用户退出事件
        onLogout : function(handler) {
            var that = this;
            Event.add('logout', handler);
            if(that.checkState && !that.loginState){
                handler.call(Event);

            }
        },

        // 删除用户退出事件
        offLogout: function(handler) {
            Event.del('logout', handler);
        },

        // 保存token
        setToken : function(token, unionid) {

            token = String(token || '').trim();
            unionid = String(unionid || '').trim();

            if(token && !/^(undefined|null)$/i.test(token)){
                this.token = token;
                setLocalData('user_token', token || '');
            }
            if(unionid && !/^(undefined|null)$/i.test(unionid)){
                this.unionid = unionid;
                setLocalData('user_unionid', unionid || '');
            }
        },

        // 获取图形验证码
        getCaptcha : function(handler) {
            var that = this;
            ajax({
                type: 'post',
                url: config.url + 'background/login/create_captcha',
                data: {
                    token: that.token
                },
                dataType: 'json',
                success: function(data) {
                    if(data && data.code == 200){
                        handler(data.data.image_url)
                    }
                },
                error: function() {}
            });
        },

        // 检查图形验证码是否正确
        checkCaptcha : function(image_code, handler) {
            var that = this;
            ajax({
                type: 'post',
                url: config.url + 'background/login/check_img_code',
                data: {
                    token: that.token,
                    image_code: image_code.replace(/\s/g, '')
                },
                dataType: 'json',
                success: function(data) {
                    handler(data);

                },
                error: function() {
                    handler();
                }
            });
        },

        // 发送手机验证码
        sendMobileCode : function(param, handler) {
            var that = this;
            ajax({
                type: 'post',
                url: config.url + 'wap/mobile_code/send_mobile_code',
                data: {
                    token: that.token,
                    mobile: param.mobile,
                    code_type: param.code_type
                },
                dataType: 'json',
                success: function(data) {
                    handler(data);
                },
                error: function() {
                    handler(data);
                }
            });
        },

        // 检查手机验证码是否正确
        checkMobileCode : function(param, handler) {
            var that = this;
            ajax({
                type: 'post',
                url: config.url + 'wap/mobile_code/check_mobile_code',
                data: {
                    token: that.token,
                    mobile: param.mobile,
                    mobile_code: param.mobile_code
                },
                dataType: 'json',
                success: function(data) {
                    handler(data);
                },
                error: function() {
                    handler();
                }
            });
        },

        // 检查用户是否存在
        checkUserExist : function(mobile, handler) {
            var that = this;
            ajax({
                type: 'post',
                url: config.url + 'background/login/check_user_exist',
                data: {
                    token: that.token,
                    mobile: mobile
                },
                dataType: 'json',
                success: function(data) {
                    handler(data);
                },
                error: function() {
                    handler();
                }
            });
        },

        // 登录
        login : function(param, handler, isBindWx) {
            var that = this;

            isBindWx = !!isBindWx;

            ajax({
                type: 'post',
                url: config.url + 'background/login/login',
                data: {
                    account: param.account,
                    password: param.password,
                    code: (param.code || '').replace(/\s/g, ''),
                    is_yfz: Number(!!param.is_yfz),
                    token: that.token ,
                    identifying : localCache.getItem('yxy_identifying') || 'baiyangwang',
                    type : localCache.getItem('yxy_type') || '',
                    userTag : localCache.getItem('yxy_userTag') || ''
                },
                dataType: 'json',
                success: function(data) {
                    that.setToken(data.token);

                    if(data && data.code == 200){
                        if(isBindWx && (platform.isFromWx || (platform.isFromBYTouchMachine && that.unionid))){
                            that.bind_wx(function(bind_data) {
                                handler && handler(bind_data);
                                Event.fire('login', data, that);
                            });
                        } else {
                            handler && handler(data);
                            Event.fire('login', data, that);
                        }

                    } else {
                        handler && handler(data);
                    }

                },
                error: function() {
                    handler && handler();
                }
            });
        },

        // 退出登录
        logout : function(handler) {
            var that = this;

            var isFromWx = platform.isFromWx;

            var url;

            if(isFromWx){
                // 解绑微信
                url = config.url + 'wap/wechat_login/cancel_wxaccount';
            } else {
                // 退出登录
                url = config.url + 'background/login/logout';
            }

            ajax({
                type: 'post',
                url: url,
                data: {
                    token: that.token
                },
                dataType: 'json',
                success: function (data) {

                    if( data && data.code == 200 && platform.isFromYXYApp  ) {
                        //育学园内传递空token和空手机号
                        cyt_baiyang_login_success( '', '' ) ;
                    }

                    if(isFromWx && data && data.code == 200){
                        // 删除本地 user_unionid
                        delLocalData('user_unionid');
                    }

                    if(typeof handler == 'function'){
                        handler(data);
                    } else if(data && data.code == 200){
                        Event.fire('logout', data, that);
                    }

                },
                error: function () {
                    handler && handler();
                }
            });

        },

        // 注册
        register : function(param, handler, isBindWx) {
            var that = this;
            isBindWx = !!isBindWx;

            ajax({
                type: 'post',
                url: config.url + 'background/login/register',
                data: {
                    mobile: param.mobile,
                    password: param.password,
                    mobile_code: param.mobile_code,
                    image_code: param.image_code.replace(/\s/g, ''),
                    invite_code: param.invite_code || '',      // CPS 注册邀请码
                    invite_uid: param.invite_uid || '',      // 邀请注册用户的uid
                    token: that.token,
                    identifying : localCache.getItem('yxy_identifying') || 'baiyangwang',
                    type : localCache.getItem('yxy_type') || '',
                    userTag : localCache.getItem('yxy_userTag') || ''
                },
                dataType: 'json',
                success: function(data) {
                    that.setToken(data.token);

                    if(data && data.code == 200){
                        if(isBindWx && (platform.isFromWx || (platform.isFromBYTouchMachine && that.unionid))){
                            that.bind_wx(function(bind_data) {
                                handler && handler(bind_data);
                                Event.fire('login', data, that);
                            });
                        } else {
                            handler && handler(data);
                            Event.fire('login', data, that);
                        }

                    } else {
                        handler && handler(data);
                    }

                },
                error: function() {
                    handler && handler();
                }
            });
        },

        // 更改用户安全信息
        updateSafetyInfo : function(param, handler, isBindWx) {
            var that = this;
            isBindWx = !!isBindWx;

            // update_type:         // 更新的类型  1.找回密码 2.修改密码 3.更换手机号 4.验证身份
            // mobile:              // 手机号码  update_type=1,4时为必填
            // mobile_code:         // 验证码  update_type=1,3,4时为必填
            // password:            // 新密码  update_type=1,2时为必填
            // r_password:          // 确认新密码  update_type=2时为必填
            // n_mobile:            // 新手机号  update_type=3时为必填
            param.token = that.token;

            ajax({
                type: 'post',
                url: config.url + 'background/login/update_safety_info',
                data: param,
                dataType: 'json',
                success: function(data) {

                    if(data && data.code == 200){
                        if(isBindWx && (platform.isFromWx || (platform.isFromBYTouchMachine && that.unionid))){
                            that.bind_wx(function(bind_data) {
                                handler && handler(bind_data);
                                Event.fire('login', data, that);
                            });
                        } else {
                            handler && handler(data);
                            Event.fire('login', data, that);
                        }
                    } else {
                        handler && handler(data);
                    }

                },
                error: function() {
                    handler && handler();
                }
            });
        },

        // 我的资产首页
        userWallet : function(handler) {
            var that = this;
            ajax({
                type: 'post',
                url: config.url + 'wap/user_center/user_wallet',
                data: {
                    token: that.token
                },
                dataType: 'json',
                success: function(data) {
                    handler && handler(data);
                },
                error: function() {
                    handler && handler();
                }
            });
        },

        //获取订单详情
        getOrderDetail: function(param, handler){
            var that = this;

            var detailParam;
            if(param.order_id){
                detailParam = {
                    order_sn: param.order_id,   //订单id
                    token: that.token
                };
            } else if(param.yfz_prescription_id) {
                detailParam = {
                    prescription_id: param.yfz_prescription_id,   // 处方单id
                    token: that.token
                };
            }

            detailParam && ajax({
                type: 'post',
                url: config.url + 'background/order/order_detail',
                data: detailParam,
                dataType: 'json',
                success: function(data) {
                    handler && handler(data);
                },
                error: function() {
                    handler && handler();
                }
            });
        },

        // 检测用户是否登录
        checkLogin : function() {
            var that = this;

            ajax({
                type: 'post',
                url: config.url + 'background/login/check_login_status',
                data: {
                    token: that.token || '',
                    unionid: that.unionid || ''
                },
                dataType: 'json',
                success: function(data) {

                    that.setToken(data.token);

                    that.checkState = true;

                    if(data && data.code == 200){

                        if(data.data){
                            that.userInfo = data.data;
                        }

                        Event.fire('login', data, that);

                    } else if(data && data.code == 205){

                        // 登录账号被顶掉
                        that.logout(function() {
                            Event.fire('logout', null, that);
                        });

                    } else {
                        Event.fire('logout', null, that);
                    }
                },
                error: function() {
                    that.checkState = true;
                    Event.fire('logout', null, that);
                }
            });
        },

        // 根据授权返回的key获取token
        getToken: function(key, unionid) {
            var that = this;

            that.setToken(null, unionid);

            ajax({
                type: 'post',
                url: config.url + 'wap/wechat_login/get_token',
                data: {
                    token_key: key,
                    token: that.token || ''
                },
                dataType: 'json',
                success: function(data) {

                    if(data && data.code == 200 && data.data.token){
                        that.setToken(data.data.token);
                    }

                    that.checkLogin();
                },
                error: function() {
                    that.checkLogin();
                }
            });


        },

        // 绑定微信
        bind_wx: function(handler) {
            var that = this;

            ajax({
                type: 'post',
                url: config.url + 'wap/wechat_login/bind_wxaccount',
                data: {
                    token: that.token,                // token校验
                    unionid: that.unionid || ''     // 授权后返回unionid
                },
                dataType: 'json',
                success: function(data) {

                    if(platform.isFromWx && (!data || data.code != 200)) {
                        // 绑定失败  重新授权
                        that.wx_auth();

                    } else {

                        handler && handler(data);
                    }

                },
                error: function() {
                    handler && handler();
                }
            });

        },

        // 微信授权
        wx_auth: function() {

            if(config.user_auth && platform.isFromWx){
                setTimeout(function() {
                    window.location = config.user_auth;
                }, 0);

            }
        },

        // 绑定事件
        init: function() {
            var that = this;

            var is_in_app = platform.isFromBaiYangApp && platform.byAppVersion >= '2.1.0';

            // 会员登录事件
            that.onLogin(function() {
                that.loginState = true;
            });

            // 会员退出事件
            that.onLogout(function() {
                that.loginState = false;
            });

            // 检测用户是否登录
            if(urlParam.token_key){

                that.getToken(urlParam.token_key, urlParam.unionid);

            } else if(is_in_app) {

                // app内等待app登录事件
                require.async('app-bridge', function(bridge) {

                    var timer = setTimeout(function() {
                        that.checkLogin();
                    }, 2000);

                    bridge.getToken(function(token) {
                        clearTimeout(timer);
                        that.setToken(token);
                        that.checkLogin();
                    });

                });

            } else {
                that.checkLogin();
            }
        }
    };

    return new Member();
});