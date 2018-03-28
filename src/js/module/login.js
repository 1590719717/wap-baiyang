/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/23 023
 * @description 登录
 */

define('login',['ajax', 'member', 'popup', 'validate', 'widget', 'mvvm','exbind'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var validate = require('validate');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var exbind = require('exbind');

    var config = window.Config;
    var platform = config.platform;

    var is_in_app = platform.isFromBaiYangApp && platform.byAppVersion >= '2.1.0';

    // 跳转来源
    var from = decodeURIComponent((location.search.substr(1).match(/(^|&)redirect=([^&]*)(&|$)/) || [])[2] || '');
    var touch_step = decodeURIComponent((location.search.substr(1).match(/(^|&)touch_m_scan=([^&]*)(&|$)/) || [])[2] || 0 );

    // 当天登录次数
    var loginTimes = Number(localCache.getItem('login_times')) || 0,
        isFromWx = platform.isFromWx ;

    // 获取url参数
    var urlParam = (function() {
        var param = {};
        var searchArr = location.search.substr(1).split('&');
        searchArr.forEach(function(string) {
            var index = string.indexOf('=');
            if(index > -1){
                var name = string.substr(0, index);
                var value = decodeURIComponent(string.substr(index + 1));
                name && (param[name] = value || '');
            }
        });
        return param
    })();

    //  获取本地邀请码
    var localInviteCode = '';
    try {
        localInviteCode = JSON.parse(localCache.getItem('__local_invite_code__'));
    } catch(e) {
        localInviteCode = '';
    } finally {
        if(localInviteCode &&
            localInviteCode.invite_code &&
            /^(null|undefined)$/.test(localInviteCode.invite_code)){
            localInviteCode = '';
        }
    }


    var invite_code = urlParam.invite_code || (localInviteCode && localInviteCode.invite_code) || localCache.getItem('__cps_invite_code__') || '';

    // 将 invite_code 发送到后台
    var check_user = function(param, callback) {
        ajax({
            type: 'get',
            url: config.url + 'wap/cps_user/check_user',
            data: param,
            dataType: 'json',
            success: function() {
                localCache.removeItem('__local_invite_code__');
                callback && callback();
            },
            error: function() {
                callback && callback();
            }
        });
    };


    // 如果在微信内而且没有 unionid 则跳转去授权
    if(isFromWx && !member.unionid) {
        member.wx_auth();
    }

    // 把登录信息传送给育学园app
    var yxySendMsg = function (mobile) {

        if( platform.isFromYXYApp ) {
            cyt_baiyang_login_success(member.token, mobile ) ;
        }
    } ;

    // 登录表单
    var form = document.getElementById('form-login');
    form.bindCheck('change');

    member.onLogin(function() {
        // 绑定成功
        window.location.replace(from || 'user-index.html');
    });

    member.onLogout(function() {
        // 如果登录失败超过2次则显示验证码
        if(loginTimes > 2){
            getCaptcha();
        }
    });

    // 获取验证码
    var getCaptcha = function() {
        member.getCaptcha(function(src) {
            vmData.validate = true;
            vmData.code_img = src;
        });
    };


    var vmData = MVVM.define('login', {
        account: document.getElementById('account').value,                              // 账号
        password: document.getElementById('password').value,                             // 密码
        code: '',                                 // 输入的图形验证码
        code_img: '',                             // 验证码图片
        password_view: '',                        // 是否显示密码
        validate: '',                             // 是否需要验证码

        getCaptcha: getCaptcha ,                  // 点击切换验证码
        is_touch_machine: platform.isFromBYTouchMachine,       //是否是触屏机
        touch_step: touch_step,                                    // 0:选择登录方式 1：手机号登录 2：微信登录 3：触屏机微信绑定

        is_wechat: isFromWx,
        step: 0,                                   // 0 输入手机号码 1 输入注册密码 2 输入登录密码  3 提示重新登录
        mobile: '',                                // 手机号码
        wechat_password: '',                       // 登录/注册密码
        mobile_code: '',                           //输入的短信验证码

        //点击跳转注册
        go_register: function() {
            if( from && from.length ) {
                 window.location = 'register.html?redirect=' + encodeURIComponent( from ) ;
            } else {
                window.location = 'register.html' ;
            }
        } ,

        //选择登录方式  1：手机号登录 2：微信登录
        chose_login_way: function(type) {

            vmData.touch_step = type ;
            if( type == 2 ) {
                popup.loading('show');
                require.async('//res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js', function() {
                    new WxLogin({
                        id:"login_wechat",
                        appid: config.scan_code,
                        scope: "snsapi_login",
                        redirect_uri: encodeURIComponent(config.url + 'wap/wechat_login/wx_callback/' + encodeURIComponent(String(seajs.data.cwd).split(/\w+:\/\//)[1] + 'login.html?touch_m_scan=3&redirect=' + encodeURIComponent(from))),
                        state: "3",
                        style: "",
                        href: ""
                    });

                    popup.loading('hide');
                });
            }
        },
        // 返回
        back: function() {
            if( vmData.touch_step == 1 || vmData.touch_step == 2 ) {
                vmData.touch_step = 0;
            } else {
                history.back();
            }
        },

        //微信绑定 检查手机号是否绑定微信
        check_mobile: function() {
            if(vmData.mobile && /^1[3|4|5|7|8][0-9]\d{8,8}$/.test(vmData.mobile)) {
                ajax({
                    type: 'post',
                    url: config.url + 'wap/wechat_login/check_mobile_isband',
                    data: {
                        token: member.token,
                        mobile: vmData.mobile
                    },
                    dataType: 'json',
                    beforeSend: function() {
                        popup.loading('show');
                    },
                    success: function(data) {
                        popup.loading('hide');

                        if(data && data.code == 200) {
                            if(data.data.is_bind) {
                                vmData.step = 3;            // 绑定其他账号
                            } else if (data.data.is_exist) {
                                // 登录
                                vmData.step = 2;
                            } else {
                                // 注册
                                vmData.step = 1;
                                // 获取图形验证码
                                vmData.getCaptcha();
                            }
                        } else {
                            popup.error(data ? data.message : '请求失败！');
                        }
                    },
                    error: function() {
                        popup.error('请求失败！');
                    }
                });
            } else if( !vmData.mobile ) {
                popup.error('请输入手机号码！');
            } else {
                popup.error('手机号码错误！');
            }
        },
        //微信绑定 继续绑定
        go_on_bind: function() {
            vmData.step = 2;
        },
        //微信绑定 返回，不继续绑定
        back_unbind: function() {
            vmData.step = 0;
        },

        //微信绑定 注册账号
        register: function() {
            if(vmData.wechat_password &&
                vmData.mobile_code &&
                vmData.code &&
                /^[\w~!@#$%^&*()_+{}:"<>?\-=[\];\',.\/]{6,18}$/.test(vmData.wechat_password)) {

                popup.loading('show');

                var register = function () {
                    member.register({
                        mobile: vmData.mobile,
                        password: vmData.wechat_password,
                        mobile_code: vmData.mobile_code,
                        image_code: vmData.code,
                        invite_code: invite_code,   // CPS 注册邀请码
                        invite_uid: urlParam.invite_uid || ''   // 邀请注册用户的uid
                    }, function(data) {
                        popup.loading('hide');

                        if(data && data.code == 200){
                            // 把登录信息传送给育学园app
                            yxySendMsg(vmData.mobile);

                            // 绑定微信
                            //window.location.replace(from || 'user-index.html');
                        } else if(data && data.code != 200){
                            popup.error(data.message);
                        } else if(!data) {
                            popup.error('注册失败！');
                        }
                    }, true);
                };

                // 如果有邀请码则先发送邀请码到后台
                if(urlParam.invite_code || (localInviteCode && localInviteCode.invite_code && Date.now() - localInviteCode.time_stamp < 86400000)){
                    check_user({
                        token: member.token,
                        mobile: vmData.mobile,
                        invite_code: invite_code,
                        act_id: urlParam.act_id || (localInviteCode && localInviteCode.act_id) || ''
                    }, register);
                } else {
                    register();
                }

            } else if( !vmData.wechat_password ) {
                popup.error('请设置登录密码！');
            } else if(!/^[\w~!@#$%^&*()_+{}:"<>?\-=[\];\',.\/]{6,18}$/.test(vmData.wechat_password)) {
                popup.error('密码格式错误，请输入6到18个字符！');
            } else if( !vmData.code ) {
                popup.error('请输入图形验证码！');
            } else if( !vmData.mobile_code ) {
                popup.error('请输入短信验证码！');
            }
        },

        //微信绑定 登录账号
        login: function() {
            if(vmData.wechat_password && /^[\w~!@#$%^&*()_+{}:"<>?\-=[\];\',.\/]{6,18}$/.test(vmData.wechat_password)) {
                popup.loading('show');

                // 记录登录次数
                loginTimes++;
                localCache.setItem('login_times', loginTimes);

                member.login({
                    account: vmData.mobile,
                    password:  vmData.wechat_password,
                    code: vmData.code
                }, function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200) {
                        localCache.setItem('login_times', 0);

                        // 把登录信息传送给育学园app
                        yxySendMsg(vmData.mobile);

                        // 绑定微信
                        //window.location.replace(from || 'user-index.html');
                    } else {
                        popup.error(data ? data.message : '登录失败！');

                        if(data && data.code == 209) {
                            loginTimes = 3;
                            localCache.setItem('login_times', loginTimes);
                        }

                        if( loginTimes > 2){
                            vmData.getCaptcha();
                        }
                    }

                }, true);

            } else if(!vmData.wechat_password) {
                popup.error('请输入密码！');
            } else {
                popup.error('密码格式错误，请输入6到18个字符！');
            }
        }

    });

    // 表单提交事件
    form.addEventListener('submit', function(e) {
        e.stopPropagation();
        e.preventDefault();

        // 如果表单验证通过
        if(form.isCheck(true)){
            popup.loading('show');

            // 记录登录次数
            loginTimes++;
            localCache.setItem('login_times', loginTimes);

            member.login({
                account: vmData.account,
                password:  vmData.password,
                code: vmData.code
            }, function(data) {
                popup.loading('hide');

                if(data && data.code == 200) {
                    // 登录监测代码
                    try {
                        ga('send', 'event', '点击登录', '登录成功', window.location.pathname);
                    } catch (e) {
                        console.error(e)
                    }
                    localCache.setItem('login_times', 0);

                    // 把登录信息传送给育学园app
                    yxySendMsg(vmData.account);

                    //window.location.replace(from || 'user-index.html');
                    // 清除触屏机登录倒计时
                    localCache.removeItem('__user_check_password__');

                } else if(data && data.code != 200){
                    popup.error(data.message);
                    if(data && data.code == 209) {
                        loginTimes = 3;
                        localCache.setItem('login_times', loginTimes);
                    }
                    if(loginTimes > 2){
                        vmData.getCaptcha();
                    }
                } else if(!data) {
                    popup.error('登录失败！');
                }

            });
        }
    });

    // 点击获取短信验证码
    var flag_click = true;
    exbind.register('mobile_code', 'click', function() {
        var btn = this,
            timer = null;

        // 重新发送倒计时
        var setTime = function() {
            var second = 60;
            flag_click = false ;
            clearInterval(timer);

            btn.classList.add('default-text');
            btn.classList.remove('active-text');
            btn.innerHTML = '重新发送(60s)';

            timer = setInterval(function() {
                second--;
                if(second > 0){
                    btn.innerHTML = '重新发送(' + second + 's)';
                } else {
                    btn.innerHTML = '获取短信验证码';
                    btn.classList.remove('default-text');
                    btn.classList.add('active-text');
                    flag_click = true ;
                    clearInterval(timer);
                }
            }, 1000);
        };

        if(vmData.mobile && vmData.code && flag_click ){

            popup.loading('show');
            // 校验验证码
            member.checkCaptcha(vmData.code, function(data) {
                if(data && data.code == 200){
                    if(/^1[3|4|5|7|8][0-9]\d{8,8}$/.test(vmData.mobile)) {
                        // 发送短信
                        member.sendMobileCode({
                            mobile: vmData.mobile,
                            code_type: 1
                        }, function(data) {
                            if(data && data.code == 200){
                                setTime();
                                popup.loading('hide');
                            } else {
                                popup.error(data ? data.message: '短信发送失败！');
                            }
                        });
                    } else {
                        popup.error('手机号码格式错误！');
                    }

                } else {
                    popup.error(data ? data.message : '验证码错误！');
                }

            });

        } else if(!vmData.mobile){
            popup.error('请输入手机号码！');
        }  else if(!vmData.code){
            popup.error('请输入图形验证码！');
        }
    });

    // 如果是在APP内则跳转到APP登录页
    if(is_in_app) {

        require.async('app-bridge', function(bridge) {
            bridge.loginApp(function(token) {}, member.appParam);
        });
    }
});