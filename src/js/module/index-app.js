/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/16 016
 * @description 海外优选首页app版
 */

define('index-app',['ajax', 'popup', 'exbind', 'widget', 'mvvm', 'member'],function(require, exports) {
    var ajax = require('ajax');
    var popup = require('popup');
    var exbind = require('exbind');
    var widget = require('widget');
    var MVVM = require('mvvm');

    // 对象遍历
    var forEachIn = function(object, callback) {
        for(var key in object){
            if(object.hasOwnProperty(key)){
                callback(key, object[key]);
            }
        }
    };

    // 重组数据结构
    var render = function(data) {
        var scroll = [],
            hot = [],
            global = {
                length: 0
            },
            brand = [];

        if(data.position_list && data.position_list.length){
            data.position_list.forEach(function(item) {
                if(item.id == 1 && item.spread){
                    // 轮播
                    if(Array.isArray(item.spread)){
                        scroll = item.spread;
                    } else {
                        forEachIn(item.spread, function(key, supItem) {
                            scroll.push(supItem);
                        });
                    }
                } else if(item.id == 2 && item.spread) {
                    // 热门推荐
                    forEachIn(item.spread, function(key, supItem) {
                        if(supItem.content && supItem.content.length){
                            hot = hot.concat(supItem.content);
                        }
                    });
                } else if(/^3|4|5$/.test(item.id)) {
                    // 全球盛宴
                    forEachIn(item.spread, function(key, supItem) {
                        if(supItem.content && supItem.content.length){
                            global[item.id] = supItem.content[0];
                            global.length++;
                        }
                    });
                } else if(/^6|7|8|9|10|11$/.test(item.id)) {
                    // 海外名牌
                    forEachIn(item.spread, function(key, supItem) {
                        if(supItem.content && supItem.content.length){
                            if(supItem.ad_type == 2){
                                brand.push({
                                    type: 'img',
                                    content: supItem.content[0]
                                });
                            } else if(supItem.ad_type == 1){
                                brand.push({
                                    type: 'list',
                                    content: supItem.content
                                });
                            }
                        }
                    });
                }
            });
        }

        MVVM.define('hwg', {
            scroll: scroll,
            hot: hot,
            global: global,
            brand: brand
        });
    };

    // 获取海外购首页广告位
    popup.loading('show');
    ajax({
        type: 'POST',               // 请求类型
        //url: Config.url + 'wap/home_page/accesories_home_page',                   // 请求url
        url: 'http://58.63.114.90:9012/home_page/accesories_home_page',                   // 请求url
        data: {
            position_id: '1,2,3,4,5,6,7,8,9,10,11'
        },
        dataType: 'json',
        success: function(data) {
            popup.loading('hide');

            if(data && data.code && data.code == 200){
                render(data.data);
            } else {
                popup.error('加载失败！');
            }

        },
        error: function() {
            popup.error('加载失败！');
        }
    });

});