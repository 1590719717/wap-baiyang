/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/27 027
 * @description Description
 */

define('user-write-logistics',['member', 'ajax', 'mvvm', 'popup', 'widget','public'],function (require, exports) {
    var member = require('member');
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var popup = require('popup');
    var widget = require('widget');
    var Public = require('public');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var service_sn = Public.getSearchParam('service_sn');    //服务单号

    var mvData = MVVM.define('service-logistics',{
        logistics_id: '' ,           //物流单号
        logistics_name: '' ,         //物流公司

        logistics_submit: function() {

            mvData.logistics_id = mvData.logistics_id.replace(/\s/g, '') ;
            mvData.logistics_name = mvData.logistics_name.replace(/\s/g, '') ;

            if( !mvData.logistics_id.length ) {
                popup.error('请填写物流单号');
            }else if( !mvData.logistics_name.length  ) {
                popup.error('请填写物流公司');
            } else {
                ajax({
                    type: 'post',
                    url: Config.url + 'background/order/add_service_express',
                    data: {
                        service_sn: service_sn,
                        express_company: mvData.logistics_name,
                        express_no: mvData.logistics_id ,
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        popup.loading('hide');

                        if (data && data.code == 200) {
                            history.back();

                        } else {
                            popup.error(data?data.message:this.url + ' Error') ;
                        }
                    },
                    error: function() {
                        popup.error(this.url + ' Error');
                    }
                });
            }

        }

    });
    // 由快递单号提示快递公司
    var notice_logistics = function() {

        if( !mvData.logistics_id.replace(/\s/g, '').length ) {
            return false ;
        }
        ajax({
            type: 'post',
            url: Config.url + 'background/order/notice_logistics',
            data: {
                postid:mvData.logistics_id.replace(/\s/g, ''),
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if (data && data.code == 200) {
                    if( data.data && Array.isArray(data.data)) {
                        mvData.logistics_name = data.data[0] ;
                    }

                } else {
                    mvData.logistics_name = '' ;
                    //popup.error(data?data.message:this.url + ' Error') ;
                }
            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    member.onLogin(function() {
        // 搜索词提示
        var logistics_number = document.getElementById('logistics_number');
        logistics_number.addEventListener('blur', function () {
            notice_logistics();
        });
    });

});