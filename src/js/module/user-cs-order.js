/*!
 * @author yuchunfeng
 * @date 2016/9/27
 * @description Description
 */
define('user-cs-order',[ 'widget', 'popup', 'mvvm', 'ajax', 'member', 'public'],function (require, exports) {
    var widget = require('widget');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var member = require('member');
    var Public = require('public');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    // 商品id
    var user_id = Public.getSearchParam('user_id');
    var user_name =  Public.getSearchParam('user_name');

    var orderList = {

        vmData: MVVM.define('order-data',{
            user_id:  user_id,            //委托人id
            user_name:  user_name,        //委托人名字
            page: 1,                      //页码
            size: 10,                     //每页长度
            total: 0 ,                    //总订单数
            list: []                      //订单列表
        }),

        getData: function(callback){

            var that = this;
            //请求订单列表数据
            ajax({
                type: 'post',
                url: Config.url + 'wap/business/get_business_mandatary_oder_list',
                data: {
                    token: member.token,
                    user_id: user_id,
                    page: that.vmData.page,
                    page_size: that.vmData.size
                },
                dataType: 'json',
                beforeSend: function () {
                    popup.loading('show');
                },
                success: function (data) {
                    popup.loading('hide');

                    if( data.code == 200 && data.data ){
                        that.vmData.list = that.vmData.list.concat( data.data.order_list ) ;
                        that.vmData.total = Math.ceil(data.data.total / that.vmData.size);

                        callback && callback();

                    } else {
                        popup.error(data.message, function(){
                            history.back();
                        });
                    }
                },
                error: function () {
                    popup.loading('hide');
                    popup.error('获取订单数据失败');
                }
            });

        },

        init: function(){

            var that = this,
                vmData = that.vmData;
            that.getData();

            // 滑动到底部则自动更新
            var scrollWrap = document.querySelector('#order_list'),
                winHeight = window.innerHeight + 100,
                scrollLock = true,
                timer;

            scrollWrap.addEventListener('scroll', function () {
                if(scrollLock) {
                    clearTimeout(timer);
                    timer = setTimeout(function() {
                        if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && vmData.page < vmData.total){
                            vmData.page += 1;
                            scrollLock = false;
                            that.getData(function() {
                                scrollLock = true;
                            });
                        }
                    }, 20);
                }

            });
        }
    };

    member.onLogin(function() {
        orderList.init();
    });
});

