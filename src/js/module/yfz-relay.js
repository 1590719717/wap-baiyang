/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/7/28 028
 * @description 易复诊中间页
 */

define('yfz-relay',['member','popup', 'ajax'],function (require, exports) {
    var member = require('member');
    var popup = require('popup');
    var ajax = require('ajax');

    // 获取url参数
    var urlParam = (function() {
        var param = {};
        var searchArr = location.search.substr(1).split('&');
        searchArr.forEach(function(string) {
            var index = string.indexOf('=');
            if(index > -1){
                var name = string.substr(0, index);
                var value = decodeURIComponent(string.substr(index + 1));
                name && (param[name] = value || '');
            }
        });
        return param
    })();

    // 处方单一键购买
    var bugPrescription = function() {
        ajax({
            type: 'post',
            url: Config.url + 'background/cart/add_to_cart',
            data: {
                prescription_id: urlParam.cfid,   //易复诊的处方ID
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                if(data && data.code == 200){
                    window.location.replace('shopping-car.html');
                } else {
                    popup.error(data ? data.message: '一键下单失败！', function() {
                        window.location.replace('user-prescription.html');
                    });
                }
            },
            error: function() {
                popup.error('一键下单失败！', function() {
                    window.location.replace('user-prescription.html');
                });
            }
        });
    };

    var yfz_login = function() {
        // 会员登录
        member.login({
            account: urlParam.username,
            password: urlParam.code,
            is_yfz: 1
        }, function(data) {

            if(data && data.code == 200){
                bugPrescription();
            } else {
                popup.error(data ? data.message: '登录失败！', function() {
                    window.location.replace('login.html');
                });
            }
        }, true);

    } ;
    // 退出登录
    var logout = function() {

        // 通过处方单获取订单
        member.offLogin(logout);

        member.logout(function() {

            if( Config.platform.isFromWx ){
                member.wx_auth();

            } else {
                yfz_login();
            }
        });
    };

    if(urlParam.username && urlParam.code && urlParam.cfid){

        // 如果会员已登录则退出登录
        member.onLogin(logout);

        member.onLogout(function() {

            member.offLogin(logout);
            // 会员登录
            yfz_login();

        });

    } else {
        popup.error('参数错误！', function() {
            window.location.replace('login.html');
        });
    }
});