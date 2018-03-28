/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/25 025
 * @description 会员中心首页
 */

define('user-index', ['ajax', 'member', 'popup', 'mvvm', 'exbind', 'widget'], function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var widget = require('widget');
    var exbind = require('exbind');

    var vmDate;

    // 红包引导提示
    var setGuide = function() {

        if(!localCache.getItem('__is_show_balance_guide__')) {

            // 红包引导
            exbind.register('guide-bonus', 'load', function (e) {
                var node = this;

                var guide = document.createElement('div');
                guide.className = 'popup popup-guide';
                guide.innerHTML = '<div class="guide-layout guide-bonus" style="top: ' + node.getBoundingClientRect().top + 'px;">' +
                '<a href="javascript:;" class="btn-close"></a>' +
                '</div>';

                document.body.appendChild(guide);

                guide.on('click', '.btn-close', function () {
                    guide.parentNode.removeChild(guide);
                    e.next();
                });


                guide.on('swipe', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                });

                e.stop();

            });

            // 余额引导
            exbind.register('guide-balance', 'load', function (e) {
                var node = this;

                var guide = document.createElement('div');
                guide.className = 'popup popup-guide';
                guide.innerHTML = '<div class="guide-layout guide-balance" style="top: ' + node.getBoundingClientRect().top + 'px;">' +
                '<span class="balance-num">' + (vmDate ? vmDate.balance : '0.00') + '</span>' +
                '<a href="javascript:;" class="btn-close"></a>' +
                '</div>';

                document.body.appendChild(guide);

                guide.on('click', '.btn-close', function () {
                    guide.parentNode.removeChild(guide);
                    localCache.setItem('__is_show_balance_guide__', 1);
                    e.next();
                });

                guide.on('swipe', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                });

                e.stop();
            });

        }

    };

    // 获取会员中心数据
    popup.loading('show');

    member.onLogin(function() {

        ajax({
            type: 'post',
            url: Config.url + 'background/user_center/user_index',
            data: {
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if (data && data.code == 200) {

                    // 红包到期提醒
                    data.data.is_show_tip = Number(data.data.almost_expired_amount) > 0;
                    // 点击关闭红包到期提醒
                    data.data.closeTip = function () {
                        data.data.is_show_tip = false;
                    };

                    // 触屏机修改红包入口为红包列表
                    data.data.isFromBYTouchMachine = Config.platform.isFromBYTouchMachine;

                    vmDate = MVVM.define('user-index', data.data);

                    // 红包引导提示
                    setGuide();

                } else if (data && data.code == 201) {
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                } else {
                    popup.error(data ? data.message : '用户中心加载失败！');
                }
            },
            error: function() {
                popup.error('用户中心加载失败！');
            }
        });

    });

    // 会员登录事件
    member.onLogout(function () {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

});
