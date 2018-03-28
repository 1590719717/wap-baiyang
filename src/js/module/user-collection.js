/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/21
 * @description 我的收藏
 */
define('user-collection',['member', 'popup', 'widget', 'mvvm', 'ajax'],function (require, exports) {
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var ajax = require('ajax');

    var vmData = MVVM.define('user-collection', {
        collection_list:null,
        cancelCollect:function(id){
            //删除收藏
            popup.confirm("是否确认删除收藏？",function(){
                popup.loading('show');
                var collectionId = [id];

                ajax({
                    type: 'post',
                    url: Config.url + 'wap/user_center/user_collect_delete',
                    data: {
                        collection_id_list: JSON.stringify(collectionId),
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');
                        if(data && data.code == 200){
                            getCollect();
                        } else {
                            popup.error(data.message);
                        }
                    },
                    error: function() {
                        popup.error('加载失败！');
                    }
                });

            });
        }
    });


    // 获取收藏列表
    var getCollect = function(){
        popup.loading('show');

        ajax({
            type: 'post',
            url: Config.url + 'wap/user_center/user_collect_list',
            data: {
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');
                if(data && data.code == 200){
                    vmData.collection_list = data.data.collection_list;
                } else if(data && data.code == 201) {
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                }else if(data && data.code == 30001){
                    vmData.collection_list = [] ;
                }
            },
            error: function() {}
        });
    };

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    member.onLogin(function() {
        getCollect();
    });
});
