/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/27 027
 * @description Description
 */

define('user-assets',['ajax', 'member', 'public', 'popup', 'exbind', 'widget', 'validate', 'mvvm', 'share'],function (require, exports) {
    var ajax = require('ajax');
    var Public = require('public');
    var member = require('member');
    var popup = require('popup');
    var exbind = require('exbind');
    var widget = require('widget');
    var validate = require('validate');
    var Share = require('share');
    var MVVM = require('mvvm');

    var config = window.Config;

    // 跳转来源
    var urlParam = Public.getUrlParam();

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    // 日期方法
    MVVM.template.helper('getDataString', function(date) {
        return Public.getDateString(date, 'Y-M-D');
    });

    MVVM.template.helper('Number', Number);

    // 我的资产首页
    var userAssets = {

        vmData: MVVM.define('user-assets', {
            isFromBYTouchMachine: config.platform.isFromBYTouchMachine, // 是否来自触屏机
            balance: 0,                        //红包
            coupon_count: 0,                   // 优惠券数量
            credit: 0,                         // 积分
            is_set_pay_password: false         // 是否设置支付密码  0:未设置；1：已设置
        }),

        isReady: false,

        init: function() {
            var that = this;

            if(!that.isReady){
                popup.loading('show');

                member.userWallet(function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){
                        that.isReady = true;
                        that.vmData.balance = data.data.balance || 0;        //余额
                        that.vmData.coupon_count = Number(data.data.coupon_count) || 0;
                        that.vmData.credit = Number(data.data.credit) || 0;
                        that.vmData.is_set_pay_password = !!Number(data.data.is_set_pay_password);
                    } else if(data && data.code == 201) {
                        // 未登录
                        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                    }
                });
            }
        }
    };

    // 优惠券
    var userCoupon = {

        unused_ready: false,
        used_ready: false,

        shareCoupon: null,

        vmData: MVVM.define('user-coupon', {

            // 优惠券激活id
            coupon_code: urlParam.code || '',
            // 激活优惠券
            activateCoupon: function() {
                if(userCoupon.vmData.coupon_code) {
                    userCoupon.activateCoupon();
                } else {
                    popup.error('请输入激活码！');
                }
            },

            // 分享优惠券
            share_coupon: function(coupon) {

                var shareParam = {
                    title: '送你一张百洋优惠券',
                    description: coupon.coupon_name + '(' + coupon.coupon_description + ')',
                    img: config.cdn + 'images/icon-share-coupon.jpg',
                    url: seajs.data.cwd + 'user-get-coupon.html?id=' + coupon.id,
                    type: 'link',
                    success: function() {
                        // 分享成功修改优惠券状态
                        ajax({
                            type: 'post',
                            url: config.url + 'background/user_center/share_undo_coupon',
                            data: {
                                token: member.token,
                                coupon_id: coupon.id,          // 优惠券ID
                                type: 1                 // 1 : 分享 0 : 撤销
                            },
                            dataType: 'json',
                            success: function(data) {
                                if(data && data.code == 200){
                                    // 分享成功后刷新优惠券列表
                                    userCoupon.unused_ready = false;
                                    userCoupon.getData();
                                } else {
                                    popup.error(data? data.message : this.url + ' Error');
                                }
                            }
                        });
                    }
                };

                if(!userCoupon.shareCoupon){
                    userCoupon.shareCoupon = Share(shareParam);
                }

                userCoupon.shareCoupon.config(shareParam);

                if(!config.platform.isFromWx) {
                    // 非微信则点击直接判定为赠送
                    popup.confirm('是否确认赠送优惠券？', function() {

                        userCoupon.shareCoupon.show();

                        if(!config.platform.isFromWx) {
                            shareParam.success();
                        }

                    });

                } else {
                    userCoupon.shareCoupon.show();
                }


            },

            // 撤销赠送优惠券
            revoke_coupon: function(coupon) {
                popup.confirm('<span style="font-size: 1.3rem;">撤销赠送</span><br><span style="font-size: 0.8rem;">撤销后的优惠券还可继续使用！</span>', function() {

                    // 撤销赠送优惠券
                    ajax({
                        type: 'post',
                        url: config.url + 'background/user_center/share_undo_coupon',
                        data: {
                            token: member.token,
                            coupon_id: coupon.id,          // 优惠券ID
                            type: 0                 // 1 : 分享 0 : 撤销
                        },
                        dataType: 'json',
                        success: function(data) {
                            if(!data || data.code != 200){
                                popup.error(data? data.message : this.url + ' Error');
                            }

                            // 撤销后刷新优惠券列表
                            userCoupon.unused_ready = false;
                            userCoupon.getData();

                        },
                        error: function() {
                            popup.error(this.url + ' Error');
                        }
                    });

                })
            },

            coupon_unused_num: 0,            // 未使用优惠券数量
            coupon_used_num: 0,              // 使用了优惠券数量

            usable: null,                      // 未使用
            disabled: null,                    // 不可用
            notice: null                       // 未开始优惠券列表
        }),

        // 根据激活码激活优惠券
        activateCoupon: function() {
            var that = this;
            ajax({
                type: 'post',
                url: config.url + 'background/Product/get_coupon_by_code',
                data: {
                    coupon_code: that.vmData.coupon_code,            // 优惠券激活码
                    token: member.token
                },
                dataType: 'json',
                beforeSend: function () {
                    popup.loading('show');
                },
                success: function (data) {
                    popup.loading('hide');

                    if(data && data.code == 200 && data.data){
                        that.unused_ready = false;
                        that.used_ready = false;

                        setTimeout(function(){
                            that.getData();
                        },300);


                    } else {
                        popup.error(data ? data.message : this.url + ' Error');
                    }

                },
                error: function () {
                    popup.error(this.url + ' Error');
                }
            });
        },

        getData: function() {
            var that = this,
                vmData = this.vmData;

            if(!that.unused_ready){
                ajax({
                    type: 'post',
                    url: config.url + 'background/User_center/user_coupon_list',
                    data: {
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if(data && data.code == 200){
                            that.unused_ready = true;

                            vmData.usable = data.data.no_used.data ;
                            vmData.notice = data.data.no_arrive_time.data;
                            vmData.disabled = data.data.unabled_coupon.data;

                            vmData.coupon_unused_num = data.data.no_used.count;
                            vmData.coupon_used_num = data.data.unabled_coupon.count ;

                        } else if(data && data.code == 201) {
                            // 未登录
                            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                        } else if(data && data.code == 100006) {
                            //暂无数据
                            vmData.usable = [] ;
                            vmData.notice = [] ;
                            vmData.disabled = [] ;

                            vmData.coupon_unused_num = 0;
                            vmData.coupon_used_num = 0 ;

                        } else {
                            popup.error(data?data.message:this.url + ' Error');
                        }
                    }
                });

            }
        },

        init: function() {
            var that = this;

            if(!that.unused_ready){
                that.getData();
            }
        }
    };

    // 通过短信密码设置支付密码
    var setPayPasswordSns = {
        vmData : MVVM.define('user-password-set', {
            newPassword1: '',                     // 第一次输入新密码
            newPassword2: '',                     // 第二次输入新密码
            mobile_code: '',                      // 手机验证码
            mobile:null,                          //手机号码
            mobile_display:'',                    //带星号显示
            code_state:0,                         //0未发送，1已发送 短信验证码
            step01:document.getElementById('pay-sns'),//获取短信盒子
            step02:document.getElementById('pay-sns-pw'),//修改密码盒子
            tsy:''                                //提示语
        }),
        setMobileCode:function(){//短信验证码

            var that = this;

            exbind.register('mobile_code', 'load', function() {
                var btn = this,
                    second = 0,
                    timer = null;

                // 重新发送倒计时
                var setTime = function() {
                    second = 60;
                    clearInterval(timer);

                    btn.classList.add('hqyzm-disabled');
                    btn.innerHTML = '重新发送(60s)';

                    timer = setInterval(function() {
                        second--;
                        if(second > 0){
                            btn.innerHTML = '重新发送(' + second + 's)';
                        } else {
                            btn.innerHTML = '获取短信验证码';
                            btn.classList.remove('hqyzm-disabled');
                            clearInterval(timer);
                        }
                    }, 1000);
                };

                btn.addEventListener('click', function() {//获取短信验证码

                    if(that.vmData.mobile == null){
                        that.vmData.mobile = member.userInfo.phone;
                    }

                    if(that.vmData.mobile && second < 1){
                        popup.loading('show');
                        member.sendMobileCode({
                            mobile: member.userInfo.phone,
                            code_type: 1
                        }, function(data) {
                            if(data && data.code == 200){
                                setTime();
                                that.vmData.code_state = 1;
                                popup.loading('hide');
                            } else {
                                popup.error(data ? data.message: '短信发送失败！');
                            }
                        });
                    }
                });
            });

            exbind.register('check-code', 'load', function() {//检查短信验证码

                var form = document.getElementById('form-getcoder');

                form.addEventListener('submit',function(){
                    return false;
                });

                var btn = this;

                btn.addEventListener('click',function(){
                    if(that.vmData.code_state != 1){
                        popup.error('请获取短信验证码');
                        return;
                    }

                    if(form.isCheck()){
                        member.checkMobileCode({
                            mobile:that.vmData.mobile,
                            mobile_code:that.vmData.mobile_code
                        },function(data){
                            if(data && data.code == 200){
                                that.vmData.step02.classList.remove('hide');
                                that.vmData.step01.classList.add('hide');
                            } else {
                                popup.error(data ? data.message: '短信发送失败！');
                            }
                        });

                    }else{
                        popup.error('请输入正确的验证码');
                    }
                });


            });

            exbind.register('pay-pw-btn', 'load', function() {//提交密码重置

                var form = document.getElementById('form-sns');

                form.addEventListener('submit',function(){
                    return false;
                });

                var btn = this;

                btn.addEventListener('click',function(){
                    if(form.isCheck()){
                        ajax({
                            type: 'post',
                            url: config.url + 'wap/user_center/set_pay_password',
                            data: {
                                pay_password:that.vmData.newPassword2,   //新支付密码
                                mobile_code:that.vmData.mobile_code,     //短信验证码
                                token: member.token
                            },
                            dataType: 'json',
                            success: function(data) {
                                if(data && data.code == 200){
                                    popup.success('设置成功',function(){
                                        location.replace(urlParam.redirect || 'user-assets.html#index');
                                    });
                                } else if(data && data.code == 201){
                                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                                } else {
                                    popup.error(data.message);
                                }
                            },
                            error: function() {
                                popup.error('加载失败！');
                            }
                        });

                    }else{
                        popup.error('请输入正确的密码');
                    }
                });



            });

        },
        init: function() {
            var that = this;

            that.vmData.newPassword1 =  '';                                 // 第一次输入新密码
            that.vmData.newPassword2 =  '';                                 // 第二次输入新密码
            that.vmData.mobile_code =  '';                                  // 手机验证码
            that.vmData.mobile_display = '';                                //带星号显示
            that.vmData.code_state = 0;                                     //0未发送，1已发送 短信验证码
            that.vmData.step01 = document.getElementById('pay-sns');        //获取短信盒子
            that.vmData.step02 = document.getElementById('pay-sns-pw');     //修改密码盒子
            that.vmData.tsy = '';                                           //提示语

            member.onLogin(function() {
                that.vmData.mobile = member.userInfo.phone;
                that.vmData.mobile_display = member.userInfo.phone.substring(0,3)+'****'+member.userInfo.phone.substring(7,11)
            });

            that.vmData.step01.classList.remove('hide');
            that.vmData.step02.classList.add('hide');

            that.setMobileCode();
        }
    };
    // 选择重置支付密码方式
    var resetPayPasswordSelect = {
        vmData : MVVM.define('reset-pay-password-select', {
            mobile: ''                       // 账号
        }),
        init: function() {
            var that = this;

            member.onLogin(function() {
                that.vmData.mobile = member.userInfo.phone.substring(0,3)+'****'+member.userInfo.phone.substring(7,11)
            });

        }
    };

    // 通过原支付密码重置支付密码
    var resetPayPasswordPw = {
        vmData : MVVM.define('reset-pay-password-pw', {
            mobile: '',                       // 账号
            oldPassword: '',                     // 旧密码
            newPassword1: '',                     // 第一次输入新密码
            newPassword2: '',                     // 第二次输入新密码
            password_view: ''                  // 是否显示密码

        }),
        step01 : document.getElementById('reset-pay-password-pw-step01'),
        step02 : document.getElementById('reset-pay-password-pw-step02'),
        setMobileCode:function(){

            var that = this;

            exbind.register('confirm-old-btn', 'load', function() {
                var btn = this;

                btn.addEventListener('click', function() {//验证旧密码
                    var form = document.getElementById('reset-pay-password-pw-old');

                    if(form.isCheck()){
                        ajax({
                            type: 'post',
                            url: config.url + 'wap/user_center/check_pay_password',
                            data: {
                                pay_password: that.vmData.oldPassword,   //旧支付密码
                                token: member.token
                            },
                            dataType: 'json',
                            success: function(data) {
                                if(data && data.code == 200){
                                    that.step02.classList.remove('hide');
                                    that.step01.classList.add('hide');
                                } else {
                                    popup.error(data.message);
                                }
                            },
                            error: function() {
                                popup.error('加载失败！');
                            }
                        });
                    }else{
                        popup.error('请输入正确的支付密码');
                    }

                });
            });

            exbind.register('reset-pay-pw-btn', 'click', function() {//提交密码修改

                var form = document.getElementById('reset-pay-password-pw-new');

                if(form.isCheck()){
                    ajax({
                        type: 'post',
                        url: config.url + 'wap/user_center/change_pay_password',
                        data: {
                            new_pay_password:that.vmData.newPassword2,
                            old_pay_password:that.vmData.oldPassword,
                            token: member.token
                        },
                        dataType: 'json',
                        success: function(data) {
                            if(data && data.code == 200){
                                popup.success('设置成功',function(){
                                    location.replace(urlParam.redirect || 'user-assets.html#index');
                                });

                            } else if(data && data.code == 201){
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function() {
                            popup.error('加载失败！');
                        }
                    });

                }else{
                    popup.error('两次密码输入不一致');
                }

            });



        },
        init: function() {
            var that = this;

            that.vmData.mobile = '';                        // 账号
            that.vmData.oldPassword = '';                   // 旧密码
            that.vmData.newPassword1 = '';                  // 第一次输入新密码
            that.vmData.newPassword2 = '';                  // 第二次输入新密码
            that.vmData.password_view = '';                 // 是否显示密码

            that.step01.classList.remove('hide');
            that.step02.classList.add('hide');
            that.setMobileCode();
        }
    };

    // 通过短信密码重置支付密码
    var resetPayPasswordSns = {
        vmData : MVVM.define('reset-pay-password-sns', {
            newPassword1: '',                     // 第一次输入新密码
            newPassword2: '',                     // 第二次输入新密码
            mobile_code: '',                      // 手机验证码
            mobile_display:'',                    //带星号显示
            code_state:0,                         //0未发送，1已发送 短信验证码
            step01:document.getElementById('reset-pay-sns'),//获取短信盒子
            step02:document.getElementById('reset-pay-sns-pw'),//修改密码盒子
            tsy:''                                //提示语
        }),
        second:0,
        setMobileCode:function(){

            var that = this;

            exbind.register('mobile_code', 'load', function() {//获取短信验证码
                var btn = this,
                    timer = null;

                that.second = 0;

                // 重新发送倒计时
                var setTime = function() {
                    that.second = 60;
                    clearInterval(timer);

                    btn.classList.add('hqyzm-disabled');
                    btn.innerHTML = '重新发送(60s)';

                    timer = setInterval(function() {
                        that.second--;
                        if(that.second > 0){
                            btn.innerHTML = '重新发送(' + that.second + 's)';
                        } else {
                            btn.innerHTML = '获取短信验证码';
                            btn.classList.remove('hqyzm-disabled');
                            clearInterval(timer);
                        }
                    }, 1000);
                };

                btn.removeEventListener('click',function(){},false);

                btn.addEventListener('click', function() {

                    if(that.vmData.mobile == null){
                        that.vmData.mobile = member.userInfo.phone;
                    }

                    if(that.vmData.mobile && that.second < 1){
                        popup.loading('show');
                        member.sendMobileCode({
                            mobile: member.userInfo.phone,
                            code_type: 1
                        }, function(data) {
                            if(data && data.code == 200){
                                setTime();
                                that.vmData.code_state = 1;
                                popup.loading('hide');
                            } else {
                                popup.error(data ? data.message: '短信发送失败！');
                            }
                        });
                    }
                });
            });

            exbind.register('reset-check-code', 'load', function() {//检查短信验证码

                var form = document.getElementById('form-reset-getcoder');

                form.addEventListener('submit',function(){
                    return false;
                });

                var btn = this;

                btn.addEventListener('click',function(){
                    if(that.vmData.code_state != 1){
                        popup.error('请获取短信验证码');
                        return;
                    }

                    if(form.isCheck()){
                        member.checkMobileCode({
                            mobile:that.vmData.mobile,
                            mobile_code:that.vmData.mobile_code
                        },function(data){
                            if(data && data.code == 200){
                                that.vmData.step02.classList.remove('hide');
                                that.vmData.step01.classList.add('hide');
                            } else {
                                popup.error(data ? data.message: '短信发送失败！');
                            }
                        });

                    }else{
                        popup.error('请输入正确的验证码');
                    }
                });


            });

            exbind.register('reset-pay-pw-sns-btn', 'click', function() {//提交密码重置

                var form = document.getElementById('form-reset-sns');

                form.addEventListener('submit',function(){
                    return false;
                });

                var btn = this;

                if(form.isCheck()){
                    ajax({
                        type: 'post',
                        url: config.url + 'wap/user_center/reset_pay_password',
                        data: {
                            pay_password:that.vmData.newPassword2,
                            mobile_code:that.vmData.mobile_code,
                            token: member.token
                        },
                        dataType: 'json',
                        success: function(data) {
                            if(data && data.code == 200){
                                that.second = 0;
                                popup.success('设置成功',function(){
                                    location.replace(urlParam.redirect || 'user-assets.html#index');
                                });
                            } else if(data && data.code == 201){
                                window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function() {
                            popup.error('加载失败！');
                        }
                    });
                }else{
                    popup.error('请输入正确的密码');
                }



            });

        },
        init: function() {
            var that = this;

            that.vmData.newPassword1 =  '';                                     // 第一次输入新密码
            that.vmData.newPassword2 =  '';                                     // 第二次输入新密码
            that.vmData.mobile_code =  '';                                      // 手机验证码
            that.vmData.mobile_display = '';                                    //带星号显示
            that.vmData.code_state = 0;                                         //0未发送，1已发送 短信验证码
            that.vmData.step01 = document.getElementById('reset-pay-sns');      //获取短信盒子
            that.vmData.step02 = document.getElementById('reset-pay-sns-pw');   //修改密码盒子
            that.vmData.tsy = '';                                               //提示语

            member.onLogin(function() {
                that.vmData.mobile = member.userInfo.phone;
                that.vmData.mobile_display = member.userInfo.phone.substring(0,3)+'****'+member.userInfo.phone.substring(7,11)
            });

            that.vmData.step01.classList.remove('hide');
            that.vmData.step02.classList.add('hide');

            that.setMobileCode();
        }
    };

    // 根据URL参数跳转栏目
    var pageRouter = (function() {
        var columns = [
            document.getElementById('assets'),
            document.getElementById('wallet'),
            document.getElementById('coupon'),
            document.getElementById('integral'),
            document.getElementById('pay-password'),
            document.getElementById('reset-pay-password-select'),
            document.getElementById('reset-pay-password-pw'),
            document.getElementById('reset-pay-password-sns'),
            document.getElementById('coupon_detail'),
            document.getElementById('about-share')
        ];

        var title = document.getElementById('top-title');

        var currentPage = null;

        return function(param) {

            currentPage && currentPage.classList.add('hide');

            if(param.page == 'coupon') {

                // 优惠券
                currentPage = columns[2];
                currentPage.classList.remove('hide');
                userCoupon.init();

                title.innerHTML = '我的优惠券';
            } else if(param.page == 'about_share') {

                // 优惠券赠送规则
                currentPage = columns[9];
                currentPage.classList.remove('hide');

                title.innerHTML = '优惠券赠送规则';
            } else if(param.page == 'integral') {

                // 积分
                currentPage = columns[3];
                currentPage.classList.remove('hide');
                userAssets.init();

                title.innerHTML = '我的积分';
            } else if(param.page == 'set_password') {

                // 设置支付密码
                currentPage = columns[4];
                currentPage.classList.remove('hide');
                setPayPasswordSns.init();

                title.innerHTML = '设置支付密码';
            } else if(param.page == 'reset-pay-password-select') {
                // 选择重置支付密码方式
                currentPage = columns[5];
                currentPage.classList.remove('hide');
                resetPayPasswordSelect.init();

                title.innerHTML = '重置支付密码';
            } else if(param.page == 'reset-pay-password-pw') {

                // 通过密码重置支付密码
                currentPage = columns[6];
                currentPage.classList.remove('hide');
                resetPayPasswordPw.init();

                title.innerHTML = '重置支付密码';
            } else if(param.page == 'reset-pay-password-sns') {

                // 通过短信重置支付密码
                currentPage = columns[7];
                currentPage.classList.remove('hide');
                resetPayPasswordSns.init();

                title.innerHTML = '重置支付密码';
            //} else if(param.page == 'coupon_detail') {
            //
            //    currentPage = columns[8];
            //    currentPage.classList.remove('hide');
            //
            //    title.innerHTML = '红包说明';
            } else {

                // 我的资产首页
                currentPage = columns[0];
                currentPage.classList.remove('hide');
                userAssets.init();

                title.innerHTML = '我的资产';
            }
        }
    })();

    //  倒计时
    exbind.register('count_down', 'load', function(e) {
        var elem = this;
        var start_time = Number( e.param.start_time ) || 0 ;
        var diff_time = start_time - Math.floor(new Date().getTime()/1000);
        var time_count ;

        time_count = setInterval(function(){
            if( diff_time > 0) {
                diff_time --  ;
                var day = Math.floor(diff_time/24/60/60 );

                var hour = Math.floor((diff_time % (24*60*60))/60/60 );
                if(hour<10){
                    hour = '0' + hour ;
                }
                var min = Math.floor((diff_time % (60*60))/60 );
                if(min<10){
                    min = '0' + min ;
                }
                var sec = diff_time % 60 ;
                if(sec<10){
                    sec = '0' + sec ;
                }

                elem.innerHTML =  '<span>'+day+'</span>天<span>'+hour+'</span>时<span>'+min+'</span>分<span>'+sec+'</span>秒' ;
            }else {
                window.clearInterval(time_count) ;
                return 0 ;
            }
        },1000);
    });

    member.onLogin(function() {

        // 栏目切换事件
        Public.pageRouter(pageRouter);

    });
});