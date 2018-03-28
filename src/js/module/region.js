/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/7/6 006
 * @description Description
 */

define('region',['ajax', 'popup', 'selector'],function (require, exports) {
    var ajax = require('ajax');
    var popup = require('popup');
    var selector = require('selector');

    // 全国城市列表选择菜单
    var Region = function(callback) {

        this.selector = null;
        // 省份列表
        this.region_list = null;

        this.isReady = false;

        if(typeof callback === 'function'){
            this.callback = callback;
        } else {
            this.callback = function() {};
        }

        this.onReady = function() {};

        this.init();
    };

    Region.prototype = {
        constructor: Region,

        // 根据id设置默认地址
        setAddress: function(area_id, city_id, district_id) {
            var that = this,
                defaultValue = that.selector.defaultValue;

            if(area_id && city_id && district_id){
                defaultValue.length = 0;

                that.region_list.forEach(function(area, i) {
                    if(area.id == area_id){
                        defaultValue.push(i);

                        area.city_list.forEach(function(city, j) {
                            if(city.id == city_id){
                                defaultValue.push(j);

                                city.district_list.forEach(function(district, k) {
                                    if(district.id == district_id){
                                        defaultValue.push(k);

                                    }
                                });
                            }
                        });
                    }
                });
            }

        },

        // 打开联动菜单
        show: function() {
            this.selector.show();
        },

        // 关闭联动菜单
        hide: function() {
            this.selector.hide();
        },

        init: function() {
            var that = this;


            // 生成联动菜单
            ajax({
                type: 'post',
                url: Config.url + 'background/user_center/getregionlist',
                data: { },
                dataType: 'json',
                success: function(data) {
                    if(data && data.code == 200 && data.data && Array.isArray(data.data.region_list)){
                        that.isReady = true;
                        that.region_list = data.data.region_list;

                        that.onReady();

                        that.selector = new selector({
                            data: data.data.region_list,
                            confirm: function(data) {
                                that.callback.apply(that, data);
                            }
                        });

                    } else {
                        popup.error(data ? data.message : '地区列表请求失败！');
                    }
                },
                error: function() {
                	popup.error(this.url + ' Error');
                }
            });

        }
    };

    return Region;
});