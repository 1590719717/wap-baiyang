/*!
 * @author yuchunfeng
 * @date 2016/8/18
 * @description 发红包首页
 */

define('user-bonus-index',['ajax', 'member', 'popup', 'mvvm', 'share', 'widget', 'public','qrcode', 'exbind'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var Share = require('share');
    var widget = require('widget');
    var Public = require('public');
    var QRCode = require('qrcode');
    var exbind = require('exbind');

    var shareObject;                // 分享方法

    var vmData = MVVM.define('bonus-index', {
        user_id: '',                   // 用户ID 手机号码
        nickname: '',                  // 昵称
        portrait: '',                  // 头像

        bonus_num: '',             // 红包数量
        money: '',                     // 红包总金额，保留两位小数
        pay_password: '',              // 支付密码md5加密后大写的值
        type: 2,                       // 红包类型 1是固定金额 2是随机金额
        greetings: '',                 // 祝福语

        is_set_pay_password: 0,        // 是否设置支付密码
        balance: '0.00',               // 用户余额

        isFromWx : Config.platform.isFromWx,    //是否在微信内

        // 页面编号 0 登录/注册 1 发红包 2 塞进红包 3 分享红包
        step: 1,

        // 点击页面跳转
        set_page: function(page) {
            page = Number(page);
            if(page >= 0 && page <= 3){
                vmData.step = page;
            }

            if(vmData.step == 1){
                setGuide();
            }

        },

        // 点击发红包
        send_bonus: function(type) {
            vmData.type = Number(type);
            vmData.step = 2;
        },

        // 我的红包菜单
        is_show_menu: false,
        // 点击显示/隐藏我的红包菜单
        toggle_menu: function() {
            vmData.is_show_menu = !vmData.is_show_menu;
        },

        // 红包规则
        is_show_tips: false,
        // 点击显示/隐藏红包规则
        toggle_tips: function() {
            vmData.is_show_tips = !vmData.is_show_tips;
        },

        // 生成红包
        create_bonus: function() {

            var num = Number(vmData.bonus_num),
                money = Number(vmData.money).toFixed(2);

            if(num > 0 && money > 0 && num <= 3000 && money <= 10000000){

                // 余额不足
                if(money > Number(vmData.balance)) {
                    popup.error('余额不足!');

                } else if(money / num < 0.01 && vmData.type == 2) {
                    popup.error('单个红包金额不得小于0.01元!');

                } else {
                    // 显示输入密码弹窗
                    vmData.popup_set_password = true;
                }

            } else if(!/^\d+$/.test(num) || num > 3000) {
                popup.error('红包数量错误!');
            } else {
                popup.error('红包金额错误!');
            }
        },

        // 点击跳转去设置密码
        setPassword: function(page) {
            window.location = 'user-assets.html?redirect=' +
            encodeURIComponent('user-bonus-index.html#type=' + vmData.type + '&step=' + vmData.step) +
            '#page=' + page;
        },

        // 余额支付密码弹窗
        popup_set_password: false,

        // 关闭弹窗
        closePasswordPopup: function() {
            vmData.pay_password = '';
            vmData.popup_set_password = false;
        },

        // 生成红包 id
        create_red_packet: function() {
            vmData.pay_password = vmData.pay_password.replace(/[^\d]/g, '');

            if(vmData.pay_password.length == 6){
                var pay_password = document.getElementById('pay_password') ;
                pay_password.blur();
                // 生成红包
                createRedPacket();
            }
        },

        // 红包id
        red_packet_id: '',
        // 分享红包
        share_packet: function() {
            shareObject && shareObject.show();

        }

    });

    // 红包引导提示
    var setGuide = function() {

        if(!localCache.getItem('__is_show_bonus_guide__') && vmData.step == 1) {

            var guide = document.createElement('div');
            guide.className = 'popup popup-guide hide';
            document.body.appendChild(guide);

            guide.on('swipe', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });

            // 发红包引导
            exbind.register('guide-bonus', 'load', function (e) {
                var node = this;

                guide.innerHTML = '<div class="guide-layout guide-button" style="top: ' + node.getBoundingClientRect().top + 'px;">' +
                                        '<a href="javascript:;" class="btn-close"></a>' +
                                    '</div>';

                guide.off('click').on('click', '.btn-close', function () {
                    // 我的红包引导
                    exbind.register('guide-my-bonus', 'load', function (e) {
                        var node = this;

                        guide.innerHTML = '<div class="guide-layout guide-my-bonus" style="top: ' + node.getBoundingClientRect().top + 'px;">' +
                                                '<a href="javascript:;" class="btn-close"></a>' +
                                            '</div>';

                        guide.off('click').on('click', '.btn-close', function () {
                            guide.parentNode.removeChild(guide);
                            localCache.setItem('__is_show_bonus_guide__', 1);
                        });

                    });
                });

                guide.classList.remove('hide');

            });

        }

    };

    // 生成红包
    var createRedPacket = function() {
        var param = {
            token: member.token,
            red_paket_num: vmData.bonus_num,                            // 红包数量
            pay_password: vmData.pay_password,                              // 支付密码md5加密后大写的值
            type: vmData.type,                                              // 红包类型 1是固定金额 2是随机金额
            greetings: vmData.greetings || '恭喜发财，大吉大利！'              // 祝福语
        };

        if(vmData.type == 1){
            // 普通红包输入的是单个金额
            param.money = Number(Number(vmData.money).toFixed(2) * Number(vmData.bonus_num).toFixed(0)).toFixed(2);
        } else {
            // 拼手气红包输入的是总金额
            param.money = Number(vmData.money).toFixed(2);
        }

        ajax({
            type: 'post',
            url: Config.url + 'wap/Red_packet/create_red_packet',
            data: param,
            dataType: 'json',
            success: function(data) {
                if(data && data.code == 200){
                    vmData.popup_set_password = false;
                    vmData.step = 3;
                    vmData.red_packet_id = data.data.red_packet_id;
                    vmData.nickname = data.data.nickname;

                    //分享地址
                    var shareUrl = seajs.data.cwd + 'user-bonus-info.html?packet_id=' + data.data.red_packet_id + '&sign=' + data.data.sign ;
                    console.log(shareUrl);

                    // 绑定分享
                    shareObject = Share({
                        title: '有生之年遇见你，不想好运藏心底！',
                        description: vmData.greetings || '恭喜发财，大吉大利！',
                        img: Config.cdn + 'images/icon-share.jpg?v1.0.0',
                        url: shareUrl
                    });

                } else {
                    popup.error(data ? data.message : '红包生成失败！');
                }

                vmData.pay_password = '';
            },
            error: function() {
                popup.error('红包生成失败！');
                vmData.pay_password = '';
            }
        });
    };

    // 根据url跳转到对应页面
    Public.pageRouter(function(param) {

        var type = Number(param.type);        // 红包类型
        var step = Number(param.step);        // 步骤

        if(type > 0 && type < 3){
            vmData.type = type;
        } else {
            vmData.type = 1;
        }
        if(step > 0 && step < 4){

            vmData.step = step;

        } else {
            vmData.step = 1;
            shareObject && shareObject.hide();
        }

        if(vmData.step == 1){
            setTimeout(setGuide, 200);
        }
    });

    popup.loading('show');
    // 会员登出事件
    member.onLogout(function() {
        vmData.step = 0;
        popup.loading('hide');
    });

    // 会员登录事件
    member.onLogin(function() {
        vmData.user_id = member.userInfo.phone;
        popup.loading('hide');
        setTimeout(setGuide, 200);
    });

    // 获取用户信息
    ajax({
        type: 'post',
        url: Config.url + 'wap/user_center/user_index',
        data: {
            token: member.token
        },
        dataType: 'json',
        success: function(data) {
            if(data && data.code == 200) {
                vmData.balance = data.data.balance;
                vmData.is_set_pay_password = data.data.is_set_pay_password;
                vmData.portrait = data.data.portrait;
            }
        },
        error: function() {}
    });

    // 红包金额和数量验证
    vmData.__addObserveEvent__(function() {
        if(vmData.bonus_num && !/^\d+$/.test(vmData.bonus_num)){
            vmData.bonus_num = (vmData.bonus_num.match(/\d+/) || [])[0] || '';
        }
        if(vmData.money && !/^\d+(\.\d{0,2})?$/.test(vmData.money)){
            vmData.money = (vmData.money.match(/\d+(\.\d{0,2})?/) || [])[0] || '';
        }
    });

});
