/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/27 027
 * @description Description
 */

define('user-assets-balance',['ajax', 'member', 'popup', 'widget', 'mvvm', 'router', 'app-url'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var router = require('router');
    var appUrl = require('app-url');

    var config = window.Config;
    var platform = config.platform;

    // 是否来自百洋APP
    var isFromApp = platform.isFromBaiYangApp;

    // 是否来自触屏机
    var isFromTouch = platform.isFromBYTouchMachine;

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var vmData = MVVM.define('user-balance', {
        title:'',                       //标题
        balance : '0.00',                // 余额
        page: 1 ,                   // 页码
        size: 10,                   // 每页数量
        total : 0,                 // 总数量
        type : 'all',              //all:全部 income:收入 expend:支出
        list : [],                   //明细数据

        is_touch: isFromTouch,         // 是否来自触屏机

        // 跳转到发红包页面，如果是app内则拉起app发红包界面
        get_bonus_link: function() {
            var url = '/user-bonus-index.html';

            if(isFromApp){
                // app链接
                return appUrl.wap_to_app(url);

            } else if(isFromTouch) {
                // 触屏机跳转到红包列表
                return '/user-bonus-list.html';

            } else {

                return url;
            }
        },

        //请求数据
        getData : function(callback){

            ajax({
                type: 'POST',
                url: config.url + 'wap/user_balance/user_balance_list',
                data: {
                    token : member.token ,
                    balance_type : vmData.type,
                    page : vmData.page ,
                    size : vmData.size
                },
                dataType: 'json',
                beforeSend: function() {
                    popup.loading('show');
                },
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){
                        vmData.balance = data.data.balance ;
                        vmData.total = data.data.total ;
                        var each_list = [] ;
                        if( data.data.list && data.data.list.length ) {
                            data.data.list.forEach(function(item) {
                                each_list = each_list.concat( item.list ) ;
                            })
                        }

                        vmData.list = vmData.list.concat(each_list);

                        callback && callback();

                    }else if(data && data.code == 34414){
                        if(vmData.page == 1){
                            vmData.list = [] ;
                        }

                    } else {
                        popup.error(data.message);
                    }
                } ,
                error: function () {
                    popup.loading('hide');
                    popup.error('请求失败');
                }
            });
        },

        init : function () {

            vmData.getData();

            // 滑动到底部则自动更新
            var scrollWrap = document.querySelector('#user-balance-detail'),
                winHeight = window.innerHeight + 100,
                scrollLock = false,
                timer;

            scrollWrap.addEventListener('scroll', function () {
                if(!scrollLock){
                    clearTimeout(timer);
                    timer = setTimeout(function() {
                        if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && vmData.page <  Math.ceil(vmData.total/vmData.size)){
                            vmData.page += 1;
                            scrollLock = true;
                            vmData.getData(function() {
                                scrollLock = false;
                            });
                        }
                    }, 20);
                }

            });
        }

    });

    router.register('', (function() {
        var is_ready = false ;
        vmData.title = '余额' ;

        return function() {
            if( !is_ready ){
                is_ready = true;

                member.onLogin(function() {
                    vmData.init();
                });
            }
        };

    })(), 1 );

    router.register('?balance-detail', function() {
        vmData.title = '余额明细' ;

    }, 0, 0 );

    router.register('?balance-rule', function() {
        vmData.title = '余额说明' ;

    }, 0 , 0);

});