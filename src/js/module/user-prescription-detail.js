/*!
 * @author wentaini@163.com
 * @date 2016/7/03
 * @description 处方详情
 */
define('user-prescription-detail',['exbind', 'member', 'popup', 'widget', 'mvvm', 'ajax', 'public'],function (require, exports) {
    var exbind = require('exbind');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var Public = require('public');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var yfz_prescription_id = decodeURI((location.search.substr(1).match(/(^|&)id=([^&]*)(&|$)/) || [])[2] || '');

    if(!yfz_prescription_id){//处方单id为空
        window.location = 'user-prescription.html';
    }

    var prescription = {
        vmData: MVVM.define('user-prescription-detail', {
            data:[],
            buyPrescription: function(){
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
        //获取处方单详情
        prescriptionDetail: function(){
            var that = this;

            popup.loading('show');

            ajax({
                type: 'post',
                url: Config.url + 'wap/Prescription/detail',
                data: {
                    yfz_prescription_id: yfz_prescription_id,         //易复诊的处方ID
                    token: member.token
                },
                dataType: 'json',
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){

                        if(data.data.total < 1){
                            //window.location = 'user-prescription.html';
                            return;
                        }

                        data.data.create_time = Public.getDateFromString(data.data.create_time, 'Y-M-D');
                        data.data.exp_time = Public.getDateFromString(data.data.exp_time, 'Y-M-D');

                        that.vmData.data = data.data;

                    } else if(data && (data.code == 201)) {
                        // 未登录
                        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                    } else {
                        popup.error(data.message, function(){
                            window.location = 'user-prescription.html';
                        });
                    }
                },
                error: function() {
                    popup.error('加载失败！', function(){
                        window.location = 'user-prescription.html';
                    });
                }
            });

        },


        init: function(){
            var that = this;

            that.prescriptionDetail();

        }

    }

    member.onLogin(function() {
        prescription.init();
    });
});