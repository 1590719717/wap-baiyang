/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/7/7 007
 * @description 海外优选首页
 */

define('index-hwg',['ajax', 'popup', 'widget', 'mvvm', 'member'],function (require, exports) {
    var ajax = require('ajax');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var member = require('member');

    var vmData = MVVM.define('index-hwg', {
        // 首页轮播图广告位
        scrollImg: '',
        // 热门推荐
        hotGoods: '',
        // 全球盛宴
        special: '' ,
        // 海外名牌
        brand: ''
    });


    // 对数据进行分类
    var renderData = function(data) {
        var scrollImg = [],
            hotGoods = [],
            special = ['', '', ''],
            brand = [];

        if(data && data.length) {

            data.forEach(function(item) {

                if(item.spread && item.spread.length) {

                    if(item.id == 1) {

                        // 海外优选轮播图
                        scrollImg = item.spread;

                    } else if(item.id == 2) {

                        // 海外优选热门推荐
                        hotGoods = item.spread;

                    } else if(/^3|4|5$/.test(item.id)) {

                        // 全球盛宴广告位
                        special[item.id - 3] = item.spread[0];

                    } else if(/^6|7|8|9|10|11$/.test(item.id)) {

                        // 海外名牌
                        var brandItem = {
                            img: '',
                            list: []
                        };

                        item.spread.forEach(function(item) {
                            if(item.ad_type == 2){
                                brandItem.img = item
                            } else {
                                brandItem.list.push(item);
                            }
                        });

                        brand.push(brandItem);

                    }
                }

            });

            vmData.scrollImg = scrollImg;
            vmData.hotGoods = hotGoods;
            vmData.special = special;
            vmData.brand = brand;
        }
    };

    // 获取首页数据
    ajax({
        type: 'post',
        url: Config.url + 'wap/home_page/accesories_home_page',
        data: {
            token: member.token,
            position_id: '1,2,3,4,5,6,7,8,9,10,11'
        },
        dataType: 'json',
        beforeSend: function () {
            popup.loading('show');
        },
        success: function(data) {
            popup.loading('hide');

            if(data && data.code == 200) {
                renderData(data.data);
            }
        },
        error: function() {}
    });

    vmData.__addObserveEvent__(function() {
        [].slice.call(document.querySelectorAll('img') || []).forEach(function(img) {
            img.onerror = function() {
                this.src = 'images/default-img.png';
            }
        })
    });

});