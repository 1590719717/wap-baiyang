/*!
 * @author wentaini@163.com
 * @date 2016/7/03
 * @description 我的订单
 */
define('user-prescription',['exbind', 'widget', 'event', 'popup', 'mvvm', 'ajax', 'member', 'public'],function (require, exports) {
    var exbind = require('exbind');
    var widget = require('widget');
    var event = require('event');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var member = require('member');
    var Public = require('public');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var prescription = {
        vmData: MVVM.define('user-prescription', {
            page: 1,              //页码
            size: 10,             //每页长度
            type: null,           //处方类型，默认为空
            total: 0,             //处方总数
            list: [],             //处方列表
            showad: 0,            //是否显示广告
            is_touch_machine: Config.platform.isFromBYTouchMachine ,  //是否是触屏机
            buyPrescription: function(yfz_prescription_id){//一键购买处方药
                popup.loading('show');

                ajax({
                    type: 'post',
                    url: Config.url + 'background/cart/add_to_cart',
                    data: {
                        prescription_id: yfz_prescription_id,   //易复诊的处方ID
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        if (data && data.code == 200) {

                            window.location = 'shopping-car.html';

                        }else if(data && data.code == 201){//未登录
                            window.location.replace('login.html?redirect=product/' + productId + '.html');
                        }else{

                            popup.error(data.message);
                        }

                        popup.loading('hide');

                    },
                    error: function() {
                        popup.error('加载失败！');
                    }
                });

            }
        }),
        isReady : true,       //是否请求列表
        //获取处方列表
        getPrescription : function(type, callback){
            var that = this;

            ajax({
                type: 'post',
                url: Config.url + 'wap/Prescription/list',
                data: {
                    type: '',   //1是处方 2是营养方 可为空
                    page: that.vmData.page,
                    size: that.vmData.size,     //每页长度 1-100 默认10
                    token: member.token
                },
                dataType: 'json',
                success: function(data) {
                    popup.loading('hide');
                    that.isReady = false;

                    if(data && data.code == 200){

                        that.vmData.total = Number(data.data.total) || 0;

                        data.data.list.forEach(function(item){//时间戳转为日期
                            item.create_time = Public.getDateFromString(item.create_time, 'Y-M-D');
                        });

                        if(type == 1){
                            that.vmData.list = [].concat(data.data.list);
                            if(that.vmData.list.length == 0){
                                that.vmData.showad = 1;
                            }
                        }else if(type == 2){
                            that.vmData.list = that.vmData.list.concat(data.data.list);
                        }

                        that.isReady = true;

                        callback && callback();
                    } else if(data && data.code == 201) {
                        // 未登录
                        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                    }else {
                        popup.error(data.message);

                    }
                },
                error: function() {
                    popup.error('加载失败！');
                }
            });

        },
        //监听滑动分页请求
        orderScroll: function(){

            var that = this;
            // 滑动到底部则自动更新
            var winHeight = window.innerHeight + 100,
                scrollLock = false,
                timer;


            exbind.register('prescription-scroll', 'scroll', function(e) {
                if(!scrollLock) {
                    var scrollWrap = this;

                    if(that.isReady == false){
                        return;
                    }
                    clearTimeout(timer);

                    timer = setTimeout(function() {

                        if(that.isReady == false){
                            clearTimeout(timer);
                        }

                        if(parseInt(scrollWrap.scrollTop) + winHeight >= scrollWrap.scrollHeight && that.vmData.page < (that.vmData.total / that.vmData.size)){
                            that.vmData.page+=1;
                            scrollLock = true;
                            that.getPrescription(2, function() {
                                scrollLock = false;
                            });
                        }
                    }, 20);
                }

            });
        },

        init : function(){
            var that = this;

            that.getPrescription(1);

        }


    }

    member.onLogin(function() {
        prescription.init();
    });
});