/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/8/23 023
 * @description 红包详情
 */

define('user-bonus-info',['ajax', 'member', 'popup', 'public', 'mvvm', 'share', 'widget', 'qrcode'],function (require, exports) {
    var ajax = require('ajax');
    var Public = require('public');
    var member = require('member');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var Share = require('share');
    var widget = require('widget');
    var QRCode = require('qrcode');

    // 红包 id
    var packet_id = decodeURIComponent((location.search.substr(1).match(/(^|&)packet_id=([^&]*)(&|$)/) || [])[2] || '');
    // 红包签名
    var sign = decodeURIComponent((location.search.substr(1).match(/(^|&)sign=([^&]*)(&|$)/) || [])[2] || '');
    var act = decodeURIComponent((location.search.substr(1).match(/(^|&)act=([^&]*)(&|$)/) || [])[2] || '');

    var platform = Config.platform;
    var isWX = platform.isFromWx;

    var shareObject;

    var vmData = MVVM.define('bonus-info', {
        code: null,                         // 红包状态  200 抢红包成功
        info: null,                         // 红包详情
        list: [],                           // 抢红包列表
        receive_price: '0.00',              // 当前用户抢的红包金额
        sign: sign,                         // 红包签名

        min_id: 0,                            // 最小红包记录id 默认1
        is_all: false,                      // 是否已经加载了所有红包
        act: act,                           // view 查看红包  其他为抢红包

        page: 0,                        // 是否登录 1 未登录 2 已登录 3 只能在微信内抢红包

        isFromWx : isWX,    //是否在微信内
        isFromBYTouchMachine : platform.isFromBYTouchMachine,    //是否在微信内

        // 分享红包
        share_packet: function() {
            shareObject.show();
        },

        // 提示微信抢红包
        bonus_wx: function() {
            var bonus_code = new QRCode(document.getElementById("qr-code"));
            bonus_code.clear();
            bonus_code.makeCode(location.href);

            vmData.page = 3;
        },

        //跳去注册
        go_register: function() {
            if( isWX ) {
                window.location = 'login.html?redirect='+encodeURIComponent(window.location);
            } else {
                window.location = 'register.html';
            }
        }

    });

    // 是否已经显示提示信息
    var is_show_tip = false;

    // 红包cps推广代码
    var cpsInviteCode = '';
    try {
        cpsInviteCode = localCache.getItem('__cps_invite_code__');
    } catch(e) {
        cpsInviteCode = '';
    } finally {
        if(/^(null|undefined)$/.test(cpsInviteCode)){
            cpsInviteCode = '';
        }
    }

    // 获取红包信息
    var getBonusInfo = function(callback) {
        popup.loading('show');

        var param = {
            token: member.token,
            red_packet_id: packet_id,                       // 红包id
            sign: sign,                                     // 签名
            min_id: vmData.min_id,                          // 页码 默认1
            size: 10                                        // 每页取多少条
        };

        var url;

        if(act == 'view'){
            // 查看红包
            url = Config.url + 'wap/Red_packet/get_red_packet_info';
        } else {
            // 抢红包
            url = Config.url + 'wap/Red_packet/send_red_packet';

            if(platform.isFromBaiYangApp){
                param.udid =  AppUdiDSignID.udid;
                param.app_sign =  AppUdiDSignID.sign;
            }
        }

        ajax({
            type: 'post',
            url: url,
            data: param,
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if(data && data.data && data.data.red_packet_info){
                    // 红包信息
                    vmData.info = data.data.red_packet_info;
                    vmData.receive_price = data.data.user_receive_price || 0;
                    vmData.code = data.code;
                    vmData.message = data.message;

                    if(data.data.sign){
                        vmData.sign = data.data.sign;
                    }

                    // 抢红包列表
                    if(data.data.list && data.data.list.length){
                        data.data.list.forEach(function(item) {
                            item.create_time = Public.getDateString(item.create_time, 'Y-M-D H:I');
                        });
                        vmData.list = vmData.list.concat(data.data.list);
                        // 最小红包id，用于翻页
                        vmData.min_id = data.data.list[data.data.list.length - 1].id;
                    } else {
                        vmData.is_all = true;
                    }

                    // 继续发送该红包
                    if(data.data.red_packet_info.is_self == 1){
                        // 分享地址
                        var shareUrl = seajs.data.cwd + 'user-bonus-info.html?packet_id=' + vmData.info.red_packet_id + '&sign=' + vmData.sign;
                        console.log(shareUrl);

                        // 绑定分享
                        shareObject = Share({
                            title: '有生之年遇见你，不想好运藏心底！',
                            description: vmData.info.greetings || '恭喜发财，大吉大利！',
                            img: Config.cdn + 'images/icon-share.jpg?v1.0.0',
                            url: shareUrl
                        });
                    }

                    // 设置页面标题为红包寄语
                    document.title = data.data.red_packet_info.greetings;

                    callback && callback();

                    // 绑定红包csp下线
                    if(data.code == 200){
                        bindCpsUser();
                    }
                }

                if(!data || !/^(200|34004|34005|34006|34012|34013)$/.test(data.code)) {
                    if(!is_show_tip){
                        popup.error(data ? data.message : '红包加载失败！', function() {
                            if(!data || !data.data || !data.data.red_packet_info){
                                window.location = 'user-bonus-list.html'
                            }
                        });
                        is_show_tip = true;
                    }
                }

                // 限制微信抢红包
                if(data && data.code == '34012'){

                    if(platform.isFromWx){
                        member.wx_auth();
                    } else {
                        vmData.bonus_wx();
                    }
                }

            },
            error: function() {

            }
        });

    };

    // 抢红包逻辑
    var checkBonusEnable = function() {

        var setBonusPage = function() {

            // 会员登出事件
            member.onLogout(function() {
                if(!is_bonus_enable && act != 'view') {
                    vmData.bonus_wx();
                } else {
                    vmData.page = 1;
                }

                // 会员未登录则保存到本地的cps邀请码
                localCache.setItem('__cps_invite_code__', cpsInviteCode || '');

                popup.loading('hide');
            });

            // 会员登录事件
            member.onLogin(function() {

                if(!is_bonus_enable && act != 'view') {

                    vmData.bonus_wx();
                    popup.loading('hide');

                } else {
                    vmData.page = 2;

                    // 滚动区域
                    var scrollWrap = document.getElementById('bonus-list');

                    // 滑动到底部则自动更新
                    var winHeight = window.innerHeight + 100,
                        scrollLock = false,
                        timer;

                    scrollWrap.addEventListener('scroll', function () {
                        if(!scrollLock) {
                            clearTimeout(timer);
                            timer = setTimeout(function() {
                                if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && !vmData.is_all){
                                    scrollLock = true;
                                    getBonusInfo(function() {
                                        scrollLock = false;
                                    });
                                }
                            }, 20);
                        }

                    });

                    getBonusInfo();

                }

            });

        };

        if(packet_id){

            // 获取注册 invite_code
            if(act != 'view'){
                ajax({
                    type: 'post',
                    url: Config.url + 'wap/Cps_user/get_invite_code_by_redpackageid',
                    data: {
                        red_package_id: packet_id                       // 红包id
                    },
                    dataType: 'json',
                    success: function(data) {
                        if(data && data.data && data.data.invite_code){
                            cpsInviteCode = data.data.invite_code;
                        }

                        setBonusPage();

                    },
                    error: function() {
                        setBonusPage();
                    }
                });

            } else {
                setBonusPage();
            }

        } else {
            window.location = 'user-bonus-list.html';
        }

    };

    // 绑定红包cps下线
    var bindCpsUser = function() {

        if(cpsInviteCode && act != 'view' && member.userInfo && member.userInfo.phone){
            ajax({
                type: 'get',
                url: Config.url + 'wap/cps_user/check_user',
                data: {
                    token : member.token ,
                    mobile: member.userInfo.phone,
                    invite_code: cpsInviteCode,
                    act_id: ''
                },
                dataType: 'json',
                success: function() {
                    cpsInviteCode = null;
                    localCache.removeItem('__cps_invite_code__');
                }
            });
        }
    };

    // 是否可以抢红包（是否在微信或者百洋app内）
    var is_bonus_enable = platform.isFromWx;
    var AppUdiDSignID = null;

    popup.loading('show');

    if(platform.isFromBaiYangApp){

        if(platform.byAppVersion >= '2.1.0') {

            member.appParam.packet_id = packet_id;
            cpsInviteCode && (member.appParam.invite_code = cpsInviteCode);

            require.async('app-bridge', function(bridge) {

                var timer = setTimeout(checkBonusEnable, 2000);

                bridge.getUdid(function(data) {
                    clearTimeout(timer);

                    is_bonus_enable = true;

                    if(typeof data === 'string'){
                        try{
                            AppUdiDSignID = JSON.parse(data);
                        } catch (e) {
                            AppUdiDSignID = null;
                        }
                    } else {
                        AppUdiDSignID = data;
                    }

                    checkBonusEnable();
                });

            });

        } else {
            popup.error('当前版本不支持抢红包，请升级最新版本！');
            vmData.bonus_wx();
        }

    } else {
        checkBonusEnable();
    }

});