/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/27 027
 * @description 安全中心
 */

define('user-safety',['member', 'popup', 'exbind', 'widget', 'mvvm'],function (require, exports) {
    var member = require('member');
    var popup = require('popup');
    var exbind = require('exbind');
    var widget = require('widget');
    var MVVM = require('mvvm');

    // 根据参数跳转栏目
    var pageRouter = (function() {
        var currentPage = null;
        var columns = [
            document.getElementById('wrap-index'),
            document.getElementById('wrap-p1'),
            document.getElementById('wrap-p2'),
            document.getElementById('wrap-m1'),
            document.getElementById('wrap-m2')
        ];

        return function(page) {
            currentPage && currentPage.classList.add('hide');

            if(page == 'p1'){
                // 修改密码step1
                currentPage = columns[1];
                currentPage.classList.remove('hide');
                vmData.title_text = '修改密码' ;

            } else if(page == 'p2') {
                // 修改密码step2
                currentPage = columns[2];
                currentPage.classList.remove('hide');
                vmData.title_text = '修改密码' ;
            } else if(page == 'm1') {
                // 修改手机step1
                currentPage = columns[3];
                currentPage.classList.remove('hide');
                vmData.title_text = '修改手机号' ;
            } else if(page == 'm2') {
                // 修改手机step2
                currentPage = columns[4];
                currentPage.classList.remove('hide');
                vmData.title_text = '修改手机号' ;

            } else {
                // 安全中心首页
                currentPage = columns[0];
                currentPage.classList.remove('hide');
                vmData.title_text = '安全中心' ;

            }
        }
    })();


    var vmData = MVVM.define('user-safety', {
        title_text : '安全中心' ,     //标题
        mobile: '',

        password: '',          // 新密码
        r_password: '',        // 确认新密码

        show_password: '',     // 显示密码
        show_r_password: '',   // 显示密码

        mobile_code:'',        // 验证码
        n_mobile: '',          // 新手机号

        // 获取手机号码(马赛克处理)
        getMobile: function(mobile) {
            if(mobile){
                var phoneArr = [].slice.call(mobile);
                phoneArr.splice(3, 4, '*','*','*','*');
                return phoneArr.join('');

            } else {
                return '';
            }
        },

        // 验证短信验证码
        is_send: false,
        old_mobile_code: '',
        checkCode: function(page) {

            popup.loading('show');
            // 检查手机验证码是否正确
            if(vmData.old_mobile_code){
                member.checkMobileCode({
                    mobile: vmData.mobile,
                    mobile_code: vmData.old_mobile_code
                }, function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){
                        pageRouter(page);
                        vmData.is_send = false;
                    } else {
                        popup.error('短信验证码错误！');
                    }
                });
            }else{
                popup.loading('hide');
                popup.error('请输入短信验证码！');
            }
        },

        // 修改密码
        modifyPassword: function() {
            if(vmData.password && vmData.r_password){

                if(/^[\w~!@#$%^&*()_+{}:"<>?\-=[\];\',.\/]{6,18}$/.test(vmData.password)){

                    if(vmData.password == vmData.r_password){

                        popup.loading('show');

                        // 更新用户信息
                        member.updateSafetyInfo({
                            update_type: 2,                             // 更新的类型 2.修改密码
                            password: vmData.password,          // 新密码
                            r_password: vmData.r_password       // 确认新密码
                        }, function(data) {
                            popup.loading('hide');

                            if(data && data.code == 200){
                                popup.success('密码修改成功！', function() {
                                    resetPage();
                                });
                            } else {
                                popup.error(data ? data.message : '密码修改失败！');
                            }
                        });

                    } else {
                        popup.error('两次输入的密码不一致！');
                    }
                } else {
                    popup.error('密码格式错误！');
                }

            } else {
                popup.error('请输入密码！');
            }
        },

        // 修改手机
        modifyPhone: function() {
            if(vmData.mobile_code && vmData.n_mobile){
                popup.loading('show');

                // 更新用户信息
                member.updateSafetyInfo({
                    update_type: 3,                             // 更新的类型 3.修改手机
                    mobile_code: vmData.mobile_code,          // 验证码
                    n_mobile: vmData.n_mobile                   // 新手机号码
                }, function(data) {
                    popup.loading('hide');
                    if(data && data.code == 200){
                        popup.success('密码手机号成功！', function() {
                            vmData.mobile = vmData.n_mobile;
                            resetPage();
                        });
                    } else {
                        popup.error(data ? data.message : '密码手机号失败！');
                    }
                });
            }
        },

        pageRouter: pageRouter
    });

    var resetPage = function() {
        vmData.password = '';
        vmData.r_password = '';
        vmData.show_password = '';
        vmData.show_r_password = '';
        vmData.mobile_code = '';
        vmData.n_mobile = '';
        vmData.is_send = false;
        vmData.old_mobile_code = '';
        pageRouter();
    };

    // 点击获取短信验证码
    exbind.register('mobile_code', 'load', function(e) {
        var btn = this,
            second = 0,
            timer = null,
            type = e.param.type;    // 1：旧手机号码 2：新手机号码

        // 重新发送倒计时
        var setTime = function() {
            second = 60;
            clearInterval(timer);

            btn.classList.add('click-color');
            btn.innerHTML = '重新发送(60s)';

            timer = setInterval(function() {
                second--;
                if(second > 0){
                    btn.innerHTML = '重新发送(' + second + 's)';
                } else {
                    btn.innerHTML = '获取验证码';
                    btn.classList.remove('click-color');
                    clearInterval(timer);
                }
            }, 1000);
        };

        var sendMobileCode = function() {
            if(type == '1' && vmData.mobile && second < 1){

                if(/^1[3|4|5|7|8][0-9]\d{8,8}$/.test(vmData.mobile)){
                    popup.loading('show');
                    member.sendMobileCode({
                        mobile: vmData.mobile,
                        code_type: 1
                    }, function(data) {
                        if(data && data.code == 200){
                            vmData.is_send = true;
                            setTime();
                            popup.loading('hide');
                        } else {
                            popup.error(data ? data.message: '短信发送失败！');
                        }
                    });
                } else {
                    popup.error('手机号码格式错误！');
                }


            } else if(type == '2' && vmData.n_mobile && second < 1) {

                if(/^1[3|4|5|7|8][0-9]\d{8,8}$/.test(vmData.n_mobile)) {
                    popup.loading('show');
                    member.checkUserExist(vmData.n_mobile,function(data){       //判断手机号是否已经存在

                        if(data && data.code == 200){
                            if(data.data.is_exist){
                                popup.error('该手机已注册，请点击忘记密码或更改其他手机后尝试');
                            }else {
                                member.sendMobileCode({
                                    mobile: vmData.n_mobile,
                                    code_type: 1
                                }, function(data) {
                                    if(data && data.code == 200){
                                        vmData.is_send = true;
                                        setTime();
                                        popup.loading('hide');
                                    } else {
                                        popup.error(data ? data.message: '短信发送失败！');
                                    }
                                });
                            }

                        }else {
                            popup.error('短信发送失败！');
                        }
                    });

                } else {
                    popup.error('手机号码格式错误！');
                }
            }
        };

        btn.addEventListener('click', sendMobileCode);
    });

    pageRouter();

    // 会员登录事件
    member.onLogin(function() {
        vmData.mobile = member.userInfo.phone;
    });

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });
});