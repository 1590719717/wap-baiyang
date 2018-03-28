/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/23 023
 * @description 注册
 */

define('register',['ajax', 'member', 'exbind', 'popup', 'widget', 'validate', 'mvvm'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var exbind = require('exbind');
    var popup = require('popup');
    var widget = require('widget');
    var validate = require('validate');
    var MVVM = require('mvvm');

    var config = window.Config;
    var platform = config.platform;

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


    // 如果在微信内而且没有 unionid 则跳转去授权
    if(platform.isFromWx && !member.unionid) {
        member.wx_auth();
    }

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

    // 获取验证码
    var getCaptcha = function() {
        member.getCaptcha(function(src) {
            vmData.image_src = src;
        });
    };

    var vmData = MVVM.define('register', {
        mobile: '',                       // 账号
        password: '',                     // 密码
        mobile_code: '',                  // 手机验证码
        image_code: '',                    // 图形验证码
        password_view: '',                  // 是否显示密码
        image_src: '',                      // 图形验证码链接
        getCaptcha: getCaptcha               // 点击获取验证码
    });

    // 注册表单
    var form = document.getElementById('form-register');
    form.bindCheck('change');

    // 点击获取短信验证码
    exbind.register('mobile_code', 'load', function() {
        var btn = this,
            second = 0,
            timer = null;

        // 重新发送倒计时
        var setTime = function() {
            second = 60;
            clearInterval(timer);

            btn.classList.add('btn-disabled');
            btn.classList.remove('btn-default');
            btn.innerHTML = '重新发送(60s)';

            timer = setInterval(function() {
                second--;
                if(second > 0){
                    btn.innerHTML = '重新发送(' + second + 's)';
                } else {
                    btn.innerHTML = '获取短信验证码';
                    btn.classList.remove('btn-disabled');
                    btn.classList.add('btn-default');
                    clearInterval(timer);
                }
            }, 1000);
        };

        btn.addEventListener('click', function() {
            if(vmData.image_code && vmData.mobile && second < 1){
                popup.loading('show');

                // 校验验证码
                member.checkCaptcha(vmData.image_code, function(data) {
                    if(data && data.code == 200){
                        // 检查用户是否存在
                        member.checkUserExist(vmData.mobile, function(data) {
                            if(data && data.code == 200) {
                                if(!data.data.is_exist){
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
                                    popup.error('账号已存在！');
                                }
                            } else {
                                popup.error(data ? data.message : '账号已存在！');
                            }
                        });
                    } else {
                        popup.error(data ? data.message : '验证码错误！');
                    }

                });
            }
        });
    });

    // 表单提交事件
    form.addEventListener('submit', function(e) {
        e.stopPropagation();
        e.preventDefault();

        var register = function() {
            member.register({
                mobile: vmData.mobile,
                password: vmData.password,
                mobile_code: vmData.mobile_code,
                image_code: vmData.image_code,
                invite_code: invite_code,   // CPS 注册邀请码
                invite_uid: urlParam.invite_uid || ''   // 邀请注册用户的uid
            }, function(data) {
                popup.loading('hide');

                if(data && data.code == 200){

                    // 把登录信息传送给育学园app
                    if( platform.isFromYXYApp ) {
                        cyt_baiyang_login_success(member.token, vmData.mobile ) ;
                    }

                    // 注册监测代码
                    try {
                        ga('send', 'event', '点击注册', '注册成功', window.location.pathname);
                    } catch (e) {
                        console.error(e)
                    }

                } else if(data && data.code != 200){
                    popup.error(data.message);
                } else if(!data) {
                    popup.error('注册失败！');
                }
            });
        };

        // 如果表单验证通过
        if(form.isCheck(true)){
            popup.loading('show');

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


        }
    });

    // 登录成功事件
    member.onLogin(function() {

        localCache.setItem('login_times', 0);

        if( urlParam.redirect && urlParam.redirect.length ){

            window.location.replace( urlParam.redirect );

        } else {
            window.location.replace('user-index.html');
        }

    });

    // 未登录事件
    member.onLogout(function() {
        // 获取验证码
        getCaptcha();
    });

});