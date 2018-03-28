/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/9/5 005
 * @description Description
 */

define('touch-machine', ['ajax', 'member', 'mvvm', 'popup'], function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var MVVM = require('mvvm');
    var popup = require('popup');

    var startScrollTime = 1000 * 60 * 3,        // 开始轮播图
        logoutTime = 1000 * 60 * 2,             // 自动退出登录
        userCenterTime = 1000 * 60,         // 检查用户密码
        userInfoTime = 1000 * 60 * 0.5;         // 查看用户资产/用户信息密码

    var startScrollTimer = null,       // 开始轮播图
        logoutTimer = null;            // 自动退出登录



    // 设置开始轮播图倒计时
    var setStartScrollTimer = function() {
        clearTimeout(startScrollTimer);

        startScrollTimer = setTimeout(function() {
            // 调用轮播方法
            try {
                window.byTouchApp.runAds();
            } catch(e) {}

        }, startScrollTime);
    };

    // 自动退出提示信息框
    var logoutTips = (function() {
        var node = document.createElement('div');
        node.className = 'popup popup-is-login';
        node.innerHTML = '<div class="popup-login-content">' +
                            '<p>因长时间未使用，为保护您的账号安全，<br/>已帮您退出登录</p>' +
                            '<div class="clear">' +
                                '<a class="pull-left go-index" href="/index.html">返回首页</a>' +
                                '<a class="pull-right go-login" href="/login.html?redirect=' + encodeURIComponent(window.location) + '">重新登录</a>' +
                            '</div>' +
                        '</div>';

        return {
            show: function() {
                document.body.appendChild(node);
            },
            hide: function() {
                document.body.removeChild(node);
            }
        };
    })();

    // 设置自动退出登录倒计时
    var setLogoutTimer = function() {
        clearTimeout(logoutTimer);

        logoutTimer = setTimeout(function() {
            // 自动退出
            member.loginState && member.logout(function() {
                logoutTips.show();
            });

        }, logoutTime);
    };

    // 触摸重置自动退出/开始轮播图倒计时
    document.addEventListener('touchstart', function() {
        setStartScrollTimer();
        setLogoutTimer();
    });

    // 设置开始轮播图倒计时
    setStartScrollTimer();
    // 设置自动退出登录倒计时
    setLogoutTimer();

    // app关闭轮播后开始倒计时
    window.BYStartTimeout = function() {
        // 设置开始轮播图倒计时
        setStartScrollTimer();
        // 设置自动退出登录倒计时
        setLogoutTimer();
    };

    // 如果用户登录则设定检测用户密码时间戳
    member.onLogin(function() {
        if(!localCache.getItem('__user_check_password__')){
            localCache.setItem('__user_check_password__', Date.now());
        }

        // 进入个人中心检测用户密码
        var vmCheck = MVVM.define('check-password', {
            // 是否超时
            is_check: Date.now() - localCache.getItem('__user_check_password__') > userCenterTime,

            // 密码
            password: '',
            // 错误信息
            error_msg: '',

            // 回调地址
            check_url: '',

            // 切换账号
            switch_user: function(url) {
                popup.loading('show');
                member.logout(function() {
                    window.location = url + '?redirect=' + encodeURIComponent(window.location);
                });
            },

            // 检测密码
            check_password: function() {
                if(vmCheck.password) {

                    ajax({
                        type: 'post',
                        url: Config.url + 'wap/user_center/check_login_password',
                        data: {
                            token: member.token,
                            password: vmCheck.password
                        },
                        dataType: 'json',
                        success: function(data) {
                            if(data && data.code == 200) {
                                vmCheck.is_check = false;
                                vmCheck.password = '';

                                localCache.setItem('__user_check_password__', Date.now());

                                if (vmCheck.check_url) {
                                    window.location = vmCheck.check_url;
                                    vmCheck.check_url = '';
                                }
                            } else if(data && data.code == 201) {
                                // 未登录，跳转到登陆页
                                window.location.replace('/login.html?redirect=' + encodeURIComponent(window.location));
                            } else {
                                vmCheck.error_msg = data ? data.message : '请输入密码！';
                            }
                        },
                        error: function() {
                            vmCheck.error_msg = '校验失败！';
                        }
                    });

                } else {
                    vmCheck.error_msg = '请输入密码！';
                }
            }
        });

        // 进入会员中心则重置计时
        if(/user-index\.html/.test(location.pathname)) {
            if(!vmCheck.is_check){
                localCache.setItem('__user_check_password__', Date.now());
            }

            // 触屏机点击需要支付密码
            var user_link = [].slice.call(document.querySelectorAll('.js-check-psw') || []);

            // 两分钟后需要确认密码
            var checkTimer,
                setCheckPassword = function() {
                    clearTimeout(checkTimer);
                    checkTimer = setTimeout(function() {

                        user_link.forEach(function(a) {
                            a.addEventListener('click', function(e) {
                                e.stopPropagation();
                                e.preventDefault();

                                vmCheck.check_url = a.getAttribute('href');
                                vmCheck.is_check = true;
                            });
                        });

                        localCache.setItem('__user_check_password__', Date.now() - userCenterTime);

                    }, userInfoTime);
                };

            document.addEventListener('touchstart', setCheckPassword);
            setCheckPassword();
        }
    });

    // 退出登录则清除计时
    member.onLogout(function() {
        // 清除触屏机登录倒计时
        localCache.removeItem('__user_check_password__');
    })

});

