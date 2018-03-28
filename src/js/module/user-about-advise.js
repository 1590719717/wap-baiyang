/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/9/20 020
 * @description 我要寻药
 */

define('user-about-advise', ['ajax', 'widget', 'validate', 'popup', 'mvvm', 'member'], function (require, exports) {
    var ajax = require('ajax');
    var widget = require('widget');
    var validate = require('validate');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var member = require('member');

    var form = document.getElementById('form-advise');
    form.bindCheck('change');

    var vmData = MVVM.define('advise', {
        goods_name: '' ,                        // 需求商品
        standard: '' ,                          // 规格
        supplier: '' ,                          // 生产厂家
        goods_number: '' ,                      // 订购数量
        description: '' ,                       // 需求描述
        user_name: '' ,                         // 提交者姓名
        phone: '' ,                             // 提交者电话
        email: '' ,                             // 提交者邮箱
        qq: '',                                 // 提交者qq

        submit: function() {
            if(form.isCheck(true)) {
                ajax({
                    type: 'post',
                    url: Config.url + 'wap/search_medicine/add_search',
                    data: {
                        token: member.token,
                        goods_name: vmData.goods_name ,                        // 需求商品
                        standard: vmData.standard ,                          // 规格
                        supplier: vmData.supplier ,                          // 生产厂家
                        goods_number: vmData.goods_number ,                      // 订购数量
                        description: vmData.description ,                       // 需求描述
                        user_name: vmData.user_name ,                         // 提交者姓名
                        phone: vmData.phone ,                             // 提交者电话
                        email: vmData.email ,                             // 提交者邮箱
                        qq: vmData.qq                                  // 提交者qq
                    },
                    dataType: 'json',
                    beforeSend: function() {
                        popup.loading('show');
                    },
                    success: function(data) {
                        if(data && data.code == 200) {
                            popup.success('提交成功！', function() {
                                window.location = 'index.html';
                            })
                        } else {
                            popup.error('提交失败！')
                        }
                    },
                    error: function() {
                        popup.error('提交失败！')
                    }
                });
            }
        }
    })
});