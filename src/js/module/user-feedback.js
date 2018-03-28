/*!
 * @author yuchunfeng
 * @date 2016/6/27 027
 * @description Description
 */

define('user-feedback',['member', 'ajax', 'popup', 'widget', 'mvvm'],function (require, exports) {
    var member = require('member');
    var ajax = require('ajax');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');

    var parten = /^\s*$/ ;   // 判断空格

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var mvData = MVVM.define('user-feedbak',{
        text_value : '' ,
        submit : function() {
            if( mvData.text_value.length > 0 && !parten.test(mvData.text_value) ){
                ajax({
                    type: 'POST',
                    url: Config.url + 'wap/product/user_feedback',
                    data: {
                        token : member.token ,
                        msg : mvData.text_value.substr(0, 300).replace(/[\s\n\t\f\r]+/g, '')
                    },
                    dataType: 'json',
                    beforeSend: function () {
                        popup.loading('show');
                    },
                    success: function(data) {
                        popup.loading('hide');

                        if(data && data.code == 200){
                            popup.success('提交成功！',function(){
                                window.location.href = 'user-about.html';
                            });

                        }else{
                            popup.error(data.message);
                        }
                    } ,
                    error: function () {
                        popup.loading('hide');
                        popup.error('提交失败！');
                    }
                });
            }else {
                popup.error('请填写返回意见或者想法');
            }
        }
    });
});