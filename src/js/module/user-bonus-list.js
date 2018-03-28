/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/8/23 023
 * @description 我的红包列表
 */

define('user-bonus-list',['ajax', 'member', 'popup', 'mvvm',  'widget', 'public', 'app-url'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var widget = require('widget');
    var Public = require('public');
    var appUrl = require('app-url');

    var config = window.Config;
    var platform = config.platform;

    var isFromWx = platform.isFromWx;
    var isFromBaiYangApp = platform.isFromBaiYangApp;
    var isFromBYTouchMachine = platform.isFromBYTouchMachine;

    // tap选项卡
    var tab = Number(decodeURIComponent((location.hash.substr(1).match(/(^|&)tab=([^&]*)(&|$)/) || [])[2] || '') || 1);
    if(tab > 2 || tab < 1){
        tab = 1;
    }

    var vmData = MVVM.define('bonus-list', {
        user_photo: '',                         // 用户头像

        get_list: [],                           // 收到记录列表
        get_total: 0,                           // 收到记录的总数
        get_money: 0,                           // 抢到金额总计
        almost_expired_amount: 0,               // 7天内过期的红包总额

        get_page: 1,                            // 已收到红包分页
        get_ready: false,                       // 是否已加载数据
        is_get_all: false,                      // 是否已加载所有数据

        send_money: 0,                          // 此用户发放的红包总额
        send_list: [],                          // 发送记录列表
        send_total: 0,                          // 发送记录的总数

        send_page: 1,                           // 已发出红包分页
        send_ready: false,                      // 是否已加载数据
        is_send_all: false,                     // 是否已加载所有数据

        isFromWx : isFromWx,    //是否在微信内
        isFromBaiYangApp : isFromBaiYangApp,    //是否在微信内
        isFromBYTouchMachine : isFromBYTouchMachine,    //是否在触屏机内

        get_link: function(url) {

            if(isFromBaiYangApp){
                return appUrl.wap_to_app(url);
            } else {
                return url;
            }

        },

        tab: tab,                               // tab 选项卡  1 收到的红包 2 发出的红包
        // 点击切换选项卡
        set_tab: function(tab) {
            vmData.tab = Number(tab);

            if((vmData.tab == 1 && !vmData.get_ready) || (vmData.tab == 2 && !vmData.send_ready)){
                getBonusList();
            }
        },

        // 点击关闭过期提示
        close_tips: function() {
            vmData.almost_expired_amount = 0;
        }
    });

    var getBonusList = function(callback) {
        popup.loading('show');

        if(vmData.tab == 1){
            // 收到的红包
            ajax({
                type: 'post',
                url: config.url + 'wap/Red_packet/user_receive_red_packet_list',
                data: {
                    token: member.token,
                    page: vmData.get_page,                           // 页码 默认1
                    size: 10                                        // 每页取多少条
                },
                dataType: 'json',
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){

                        // 加载红包信息
                        if(!vmData.get_ready) {
                            vmData.get_ready = true;
                            vmData.get_total = data.data.total;
                            vmData.get_money = data.data.receive_money_sum;
                            vmData.almost_expired_amount = data.data.almost_expired_amount;
                        }

                        if(data.data.red_packet_list && data.data.red_packet_list.length){
                            data.data.red_packet_list.forEach(function(item) {
                                // 开始日期
                                item.create_time = Public.getDateString(item.create_time, 'Y-M-D H:I');
                            });

                            // 追加分页内容
                            vmData.get_list = vmData.get_list.concat(data.data.red_packet_list);
                        } else {
                            // 分页已经加载完毕
                            vmData.is_get_all = true;
                        }

                        callback && callback();

                    } else {
                        popup.error(data ? data.message : '红包加载失败！');
                    }

                },
                error: function() {
                    popup.error('红包加载失败！');
                }
            });

        } else {
            // 发出的红包
            ajax({
                type: 'post',
                url: config.url + 'wap/Red_packet/user_send_red_packet_list',
                data: {
                    token: member.token,
                    page: vmData.send_page,                           // 页码 默认1
                    size: 10                                        // 每页取多少条
                },
                dataType: 'json',
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){

                        // 加载红包信息
                        if(!vmData.send_ready) {
                            vmData.send_ready = true;
                            vmData.send_total = data.data.total;
                            vmData.send_money = data.data.send_money_sum;
                        }

                        if(data.data.red_packet_list && data.data.red_packet_list.length){

                            data.data.red_packet_list.forEach(function(item) {
                                // 开始日期
                                item.create_time = Public.getDateString(item.create_time, 'Y-M-D H:I');
                            });

                            // 追加分页内容
                            vmData.send_list = vmData.send_list.concat(data.data.red_packet_list);
                        } else {
                            // 分页已经加载完毕
                            vmData.is_send_all = true;
                        }

                    } else {
                        popup.error(data ? data.message : '红包加载失败！');
                    }

                },
                error: function() {
                    popup.error('红包加载失败！');
                }
            });
        }

    };

    // 滚动区域
    var receivedWrap = document.getElementById('received-packet');
    var sendWrap = document.getElementById('send-packet');

    // 滑动到底部则自动更新
    var winHeight = window.innerHeight + 100,
        scrollLock = false,
        timer;

    // 滚动加载收到的红包
    receivedWrap.addEventListener('scroll', function () {
        if(!scrollLock){
            clearTimeout(timer);
            timer = setTimeout(function() {
                if(receivedWrap.scrollTop + winHeight >= receivedWrap.scrollHeight && !vmData.is_get_all){
                    vmData.get_page += 1;
                    scrollLock = true;
                    getBonusList(function() {
                        scrollLock = false;
                    });
                }
            }, 20);

        }
    });

    // 滚动加载发出的红包
    sendWrap.addEventListener('scroll', function () {
        clearTimeout(timer);
        timer = setTimeout(function() {
            if(sendWrap.scrollTop + winHeight >= sendWrap.scrollHeight && !vmData.is_send_all){
                vmData.send_page += 1;
                getBonusList();
            }
        }, 20);
    });


    // 会员登出事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    member.onLogin(function() {
        getBonusList();

        // 获取用户资料
        ajax({
            type: 'post',
            url: config.url + 'wap/user_center/user_info',
            data: {
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                if(data && data.code == 200) {
                    vmData.user_photo = data.data.portrait;

                }
            }
        });
    });

});