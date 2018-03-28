/*!
 * @author liyuelong1020@gmail.com
 * @date 2017/5/3 003
 * @description 分享优惠券
 */

define('user-get-coupon', ['ajax', 'popup', 'member', 'qrcode', 'mvvm', 'share'], function (require, exports) {
    var popup = require('popup');
    var ajax = require('ajax');
    var member = require('member');
    var QRCode = require('qrcode');
    var MVVM = require('mvvm');
    var Share = require('share');

    var config = window.Config;
    var cwd = seajs.data.cwd;

    // 优惠券ID
    var couponId = decodeURIComponent((location.search.substr(1).match(/(^|&)id=([^&]*)(&|$)/) || [])[2] || '');

    var vmData = MVVM.define('get-coupon', {
        page: 0,                // 当前显示页面，1：优惠券领取页，2：二维码页面

        info: null,             // 优惠券信息

        // 点击获取优惠券
        get_coupon: function () {
            if (vmData.info.is_share == 0 && vmData.info.is_used == 2) {
                // 立即领取
                getCoupon();

            } else if (vmData.info.is_share == 1 && vmData.info.is_used == 2) {
                // 立即分享
                shareObject.show();

            } else if (vmData.info.is_share == 0 && vmData.info.is_used == 6) {
                // 立即使用
                window.location = vmData.info.coupon_url || '/index.html';
            } else {
                // 随便逛逛
                window.location = '/index.html';
            }
        }

    });

    // 分享信息
    var shareObject = Share({
        title: '送你一张百洋优惠券',
        description: '',
        img: config.cdn + 'images/icon-share-coupon.jpg',
        url: cwd + 'user-get-coupon.html?id=' + couponId,
        type: 'link'
    });

    // 获取优惠券信息
    var getCouponInfo = function () {
        ajax({
            type: 'post',
            url: config.url + 'background/user_center/get_coupon_list',
            data: {
                token: member.token,
                coupon_id: couponId          // 优惠券ID
            },
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function (data) {
                popup.loading('hide');

                if (data && data.code == 200) {

                    vmData.info = data.data;

                    vmData.page = 1;     // 当前显示页面，1：优惠券领取页，2：二维码页面

                    shareObject.config({
                        description: data.data.coupon_title + '(' + data.data.description + ')'
                    });

                } else {
                    popup.error(data ? data.message : this.url + ' Error');
                }
            },
            error: function () {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 领取优惠券
    var getCoupon = function () {
        ajax({
            type: 'post',
            url: config.url + 'background/user_center/acquire_share_coupon',
            data: {
                token: member.token,
                coupon_id: couponId          // 优惠券ID
            },
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function (data) {
                popup.loading('hide');

                if (!data || data.code != 200) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

                getCouponInfo();

            },
            error: function () {
                popup.error(this.url + ' Error');
            }
        });

    };

    if (couponId) {

        // 限制只能在微信内领取
        if (config.platform.isFromWx) {

            // 用户登录
            member.onLogin(function () {

                // 获取优惠
                getCouponInfo();

            });

            // 用户退出事件
            member.onLogout(function () {
                window.location = '/login.html?redirect=' + encodeURIComponent(cwd + 'user-get-coupon.html?id=' + couponId);
            });

        } else {
            // 非微信显示二维码

            vmData.page = 2;                // 当前显示页面，1：优惠券领取页，2：二维码页面

            var code = new QRCode(document.getElementById('qrcode'));
            code.makeCode(cwd + 'user-get-coupon.html?id=' + couponId);

        }

    } else {

        popup.error('优惠券ID错误！', function () {
            history.back();
        });
    }

});