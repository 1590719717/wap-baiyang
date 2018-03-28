/*!
 * @author yuchunfeng
 * @date 2016/6/21
 * @description Description
 */
define('user-track',['member', 'exbind', 'popup', 'widget', 'mvvm', 'ajax'],function (require, exports) {
    var member = require('member');
    var exbind = require('exbind');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var ajax = require('ajax');


    var vmData = MVVM.define('user-record', {
        record_list: null ,
        page: 1,
        size: 10 ,
        count: 0 ,
        deleteRecord : function(record_id){
            var delList = [] ;
            delList.push(record_id);
            //删除足迹
            popup.confirm("是否确认删除该足迹？",function(){
                popup.loading('show');

                ajax({
                    type: 'post',
                    url: Config.url + 'wap/user_center/user_footprint_delete',
                    data: {
                        record_id_list: JSON.stringify(delList), //足迹id列表
                        type_id: 1,              //1:删除 2:清空
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');
                        if(data && data.code == 200){
                            vmData.page = 1;
                            getRecordList();
                        } else if(data && data.code == 201) {
                            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                        }else{
                            popup.error(data.message);
                        }
                    },
                    error: function() {
                        popup.error('加载失败！');
                    }
                });
            });
        } ,

        init:function() {

            getRecordList();

            // 滑动到底部则自动更新
            var scrollWrap = document.querySelector('#track_scroll'),
                winHeight = window.innerHeight + 100,
                scrollLock = false,
                timer;

            scrollWrap.addEventListener('scroll', function () {

                if(!scrollLock){

                    clearTimeout(timer);

                    timer = setTimeout(function() {
                        if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && vmData.page < vmData.count ){
                            vmData.page += 1;
                            scrollLock = true;
                            getRecordList(function() {
                                scrollLock = false;
                            });
                        }
                    }, 20);
                }

            });
        }
    });

    //获取我的足迹列表
    var getRecordList = function( callback ){
        popup.loading('show');
        ajax({
            type: 'post',
            url: Config.url + 'background/user_center/user_record_list',
            data: {
                token: member.token,
                page: vmData.page ,
                size: vmData.size
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');
                if(data && data.code == 200){

                    vmData.count =  Math.ceil(data.data.total/vmData.size ) ;

                    if( vmData.page == 1) {
                        vmData.record_list = [] ;
                    }
                    vmData.record_list = vmData.record_list.concat(data.data.record_list);

                    callback && callback();

                } else if(data && data.code == 201) {
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                }else if(data && data.code == '100006'){
                    if( vmData.page == 1) {
                        vmData.record_list = [];
                    }

                }else{
                    popup.error(data.message);
                }
            },
            error: function() {
                popup.error('加载失败！');
            }
        });

    };

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    member.onLogin(function() {
        vmData.init();
    });

});
