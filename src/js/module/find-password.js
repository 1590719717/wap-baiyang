/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/23 023
 * @description 找回密码
 */

define('find-password',['member', 'popup', 'exbind', 'widget', 'validate', 'mvvm', 'ajax'],function (require, exports) {
    var member = require('member');
    var popup = require('popup');
    var exbind = require('exbind');
    var widget = require('widget');
    var validate = require('validate');
    var MVVM = require('mvvm');
    var ajax = require('ajax');

    // 登录成功事件
    //member.onLogin(function() {
    //    localCache.setItem('login_times', 0);
    //    window.location.replace('user-index.html');
    //});

    // 跳转来源
    var from = decodeURIComponent((location.search.substr(1).match(/(^|&)redirect=([^&]*)(&|$)/) || [])[2] || '');

    // 获取验证码
    var getCaptcha = function() {
        member.getCaptcha(function(src) {
            vmData.image_src = src;
        });
    };

    var forms = [
        document.getElementById('form-step1'),
        document.getElementById('form-step2'),
        document.getElementById('form-step3')
    ];

    forms[0].bindCheck('change');
    forms[1].bindCheck('change');
    forms[2].bindCheck('change');


    var vmData = MVVM.define('find-password', {
        mobile: '',                     // 手机号码
        mobile_code: '',                // 短信验证码
        password: '',                   // 新密码

        page: 1,                        // 当前页面
        // 头部返回按钮
        back: function() {
            if(vmData.page > 1){
                vmData.page = vmData.page - 1;
            } else {
                history.back();
            }
        },

        image_code: '',                 // 图形验证码
        image_src: '',                  // 图形验证码链接

        // 验证账户与验证码
        step1: function() {
            var check = 0;

            if(forms[0].isCheck(true) && vmData.mobile && vmData.image_code) {
                popup.loading('show');

                // 检查验证码
                member.checkCaptcha(vmData.image_code, function(data) {
                    if(data && data.code == 200){
                        check++;
                        if(check == 2) {
                            popup.loading('hide');
                            vmData.page = 2;
                        }
                    } else {
                        popup.error(data ? data.message : '验证码错误！');
                    }
                });
                // 检测用户是否登录
                member.checkUserExist(vmData.mobile, function(data) {
                    if(data && data.code == 200 && data.data && data.data.is_exist == true){
                        check++;
                        if(check == 2) {
                            popup.loading('hide');
                            vmData.page = 2;
                        }
                    } else {
                        popup.error('用户不存在！');
                    }
                });
            }

        },

        // 验证短信验证码
        step2: function() {
            if(forms[1].isCheck(true) && vmData.mobile_code) {
                popup.loading('show');
                // 检查手机验证码是否正确
                member.checkMobileCode({
                    mobile: vmData.mobile,
                    mobile_code: vmData.mobile_code
                }, function(data) {
                    popup.loading('hide');
                    if(data && data.code == 200){
                        vmData.page = 3;
                    } else {
                        popup.error('短信验证码错误！');
                    }
                });
            }
        },
        // 设置密码
        step3: function() {
            if(forms[2].isCheck(true) && vmData.password) {
                popup.loading('show');

                // 更新用户信息
                member.updateSafetyInfo({
                    update_type: 1,                             // 更新的类型 1 找回密码
                    mobile: vmData.mobile,                     // 手机号码
                    mobile_code: vmData.mobile_code,                // 短信验证码
                    password: vmData.password                   // 新密码
                }, function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){
                        popup.success('密码重置成功！', function() {
                            // 绑定成功
                            window.location.replace(from || 'user-index.html');
                        });
                    } else {
                        popup.error(data ? data.message : '密码修改失败！');
                    }
                }, true);
            }
        },

        password_view: '',                  // 是否显示密码
        getCaptcha: getCaptcha               // 点击获取验证码
    });

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

        var sendMobileCode = function() {
            if(vmData.mobile && second < 1){
                popup.loading('show');
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
            }
        };

        btn.addEventListener('click', sendMobileCode);

        vmData.__addObserveEvent__(function() {
            if(vmData.page == 2){
                sendMobileCode();
            }
        });
    });

    getCaptcha();
});