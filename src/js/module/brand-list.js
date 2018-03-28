/*!
 * @author liyuelong1020@gmail.com   yuchunfeng
 * @date 2016/6/22 022
 * @description 品牌街
 */

define('brand-list', ['ajax', 'mvvm', 'widget', 'popup', 'member'], function (require, exports) {
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var widget = require('widget');
    var popup = require('popup');
    var member = require('member');

    var config = window.Config;

    var vmData = MVVM.define('brand-index', {
        brand_ad: null,
        brand_all: null,
        brand_hot: null
    });

    // 品牌首页
    var renderBrandList = function(data) {
        popup.loading('hide');

        if(data && data.code == 200) {

            vmData.brand_ad = data.data.brand_ad;
            vmData.brand_all = data.data.brand_all;
            vmData.brand_hot = data.data.brand_hot;

        } else if(data && data.code == 30001 ){
            popup.error('结果为空', function() {
                window.history.back() ;
            });

        } else {
            popup.error(data ? data.message : this.url + ' Error');
        }
    };
    ajax({
        type: 'post',
        url: config.url + 'background/brand_street/brand_street_list',
        data: {
            token: member.token,
            pageStart: 1
        },
        dataType: 'json',
        beforeSend: function() {
            popup.loading('show');
        },
        cache: renderBrandList,
        success: renderBrandList,
        error: function() {
            popup.error(this.url + ' Error');
        }
    });

    // 微信绑定分享
    if(config.platform.isFromWx){
        // 微信全站绑定分享
        require.async('share', function(Share) {

            // 绑定分享
            var shareObject = Share({
                title: '百洋商城品牌街-妈妈的网上药店，专营大品牌、高品质、正流行产品',
                description: '百洋商城品牌街-妈妈的网上药店，专营大品牌、高品质、正流行产品',
                img: config.cdn + 'images/icon-download.png',
                url: String(window.location).replace(/(isband|token|unionid)=([^&]*)(&|$)/ig, ''),
                type: 'link'
            });

        });
    }

});