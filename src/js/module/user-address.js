/*!
 * @author liyuelong1020@gmail.com   yuchunfeng
 * @date 2016/6/29 029
 * @description 收货地址管理
 */

define('user-address',['ajax', 'member', 'popup', 'widget', 'validate', 'mvvm', 'region', 'public', 'event', 'exbind', 'router'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var validate = require('validate');
    var MVVM = require('mvvm');
    var Region = require('region');
    var Public = require('public');
    var event = require('event');
    var exbind = require('exbind');
    var router = require('router');


    // 对象遍历
    var forEachIn = Public.forEachIn;

    var region = new Region(function(area, city, district) {
        vmData.address_info.province = area.id ;
        vmData.address_info.city = city.id;
        vmData.address_info.county = district.id;
        vmData.address_info.county_name = district.name;
        vmData.address_info.city_name = city.name;
        vmData.address_info.province_name = area.name;
        vmData.address_text = vmData.address_info.province_name + ' ' + vmData.address_info.city_name + ' ' + vmData.address_info.county_name ;
    });

    // 地址新增/修改表单
    var form = document.getElementById('form-address');

    // 表单验证提醒
    form.validateTip = function(elem, rule, tip) {
        if(rule !== 'succeed'){
            popup.error(tip, function() {
                elem.focus();
            });
        }
    };

    // 获取所有地址
    var getAddressList = function() {
        popup.loading('show');
        ajax({
            type: 'post',
            url: Config.url + 'background/user_center/address_list',
            data: {
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200 && data.data && Array.isArray(data.data.consigneeList)){
                    vmData.address_list = data.data.consigneeList;
                } else if( data && data.code == 100006 ) {
                    vmData.address_list = [];
                }  else {
                    popup.error(data?data.message:this.url + ' Error')
                }
            },
            error: function() {
                vmData.address_list = [];
            }
        });
    };

    // 新增/编辑收货地址
    var editAddress = function(param) {
        popup.loading('show');

        param.token = member.token;
        param.action = vmData.address_type ;

        ajax({
            type: 'post',
            url: Config.url + 'background/user_center/address_edit',
            data: param,
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200 && data.data && Array.isArray(data.data.consigneeList) ){
                    vmData.address_list = data.data.consigneeList;
                    window.history.back();

                } else {
                    popup.error( data?data.message:this.url + ' Error' );
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });
    };

    //type  update:设为默认地址   del:删除收货地址
    var del_setAddress = function(id, type ) {

        popup.loading('show');

        ajax({
            type: 'post',
            url: Config.url + 'background/user_center/get_user_address_info',
            data: {
                action: type ,
                consignee_id: id ,
                token: member.token
            },
            dataType: 'json',
            success: function(data) {

                popup.loading('hide');

                if(data && data.code == 200 && data.data && Array.isArray(data.data.consigneeList)){

                    vmData.address_list = data.data.consigneeList;

                } else {
                    popup.error( data?data.message:this.url + ' Error' );
                }
            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });
    };

    // 根据id获取收货地址
    var getAddressById = function(id) {
        var address = null;
        vmData.address_list.forEach(function(item) {
            if(item.id == id){
                address = item;
            }
        });

        return address;
    };

    var vmData = MVVM.define('user-address', {

        address_type: '',           // edit : 修改地址  add：添加地址
        address_list: null,        // 地址列表

        // 新增/编辑地址详细信息
        address_info: {
            consignee_id: '',              // 收货地址id
            action: '',               //(edit:修改 add：添加)
            consignee: '',        // 收货人
            telphone: '',            // 电话号码
            county: '',           // 区县id
            city: '',               // 市id
            province: '',               // 省id
            county_name: '',           // 区县id
            city_name: '',               // 市id
            province_name: '',               // 省id
            zipcode: '',                 // 邮编
            address: '',            // 地址详情
            default_addr: 0 ,         // 是否默认地址
            tag_id: 0                 // 标签id
        },

        address_text: '',             //选择地区后的文本

        // 根据标签返回图标
        getTag: function(tag_id) {
            switch(Number(tag_id)) {
                case 1: return 'images/addr-tag1.png'; break;
                case 2: return 'images/addr-tag2.png'; break;
                case 3: return 'images/addr-tag3.png'; break;
                case 4: return 'images/addr-tag4.png'; break;
                case 5: return 'images/addr-tag5.png'; break;
                default: return '';
            }
        },

        // 点击显示/删除标签列表
        is_select_tag: false,
        toggleTag: function() {
            vmData.is_select_tag = !vmData.is_select_tag;
        },

        // 设置标签
        setTag: function(tag) {
            vmData.address_info.tag_id = tag;
        },

        // 点击打开地址选择菜单
        selectAddress: function() {
            var address_info = vmData.address_info;
            region.setAddress(address_info.province, address_info.city, address_info.county);
            region.show();
        },

        // 手机号码马赛克处理
        getMobile: function(mobile) {
            if(mobile){
                var phoneArr = [].slice.call(mobile);
                phoneArr.splice(3, 4, '*','*','*','*');
                return phoneArr.join('');

            } else {
                return '';
            }
        },

        // 设置默认地址
        setDefault: function(id) {
            del_setAddress(id , 'update');
        },

        // 编辑收货地址
        edit: function(id) {

            vmData.address_type = 'edit' ;

            var address = getAddressById(id);

            if(address){

                forEachIn(vmData.address_info, function(key, value) {
                    vmData.address_info[key] = address[key] || '';
                });

                vmData.address_info.default_addr = Number( vmData.address_info.default_addr );
                vmData.address_info.consignee_id = address.id ;
                vmData.address_text = vmData.address_info.province_name + ' ' + vmData.address_info.city_name + ' ' + vmData.address_info.county_name ;
            }
            vmData.geolocation = null;
        },

        // 地址获取状态
        geolocation: null,

        // 添加收货地址
        add: function() {

            vmData.address_text = '' ;
            vmData.address_type = 'add' ;

            forEachIn(vmData.address_info, function(key) {
                vmData.address_info[key] = '';
            });
            vmData.is_select_tag = false;

            // 使用GPS定位获取收货地址位置

            var getPositionFail = function() {
                // 位置获取失败
                vmData.geolocation = {
                    state: 'fail'
                };
            };

            // 位置获取中
            vmData.geolocation = {
                state: 'loading'
            };
            // 获取当前位置信息
            navigator.geolocation.getCurrentPosition(function(e) {
                ajax({
                    type: 'get',
                    url: '//apis.map.qq.com/ws/geocoder/v1/',
                    data: {
                        location: e.coords.latitude + ',' + e.coords.longitude,
                        key: 'MIRBZ-T2SWP-N2CDW-VHQ5Z-OBA5S-AFF6P',
                        output: 'jsonp'
                    },
                    dataType: 'jsonp',
                    success: function(data) {

                        // 地址逆解析成功
                        if(data && data.status == 0 && data.result) {

                            // 转换成本地位置id
                            ajax({
                                type: 'post',
                                url: Config.url + 'wap/user_center/regioncode_to_regionid',
                                data: {
                                    token: member.token,
                                    region_code: data.result.ad_info.adcode
                                },
                                dataType: 'json',
                                success: function(region) {
                                    if(region && region.code == 200) {
                                        var address_component = data.result.address_component;
                                        var address_id = region.data;

                                        // 位置获取成功
                                        vmData.geolocation = {
                                            state: 'success',
                                            address: data.result.address
                                        };

                                        vmData.address_info.province = address_id.region;
                                        vmData.address_info.city = address_id.city;
                                        vmData.address_info.county = address_id.district;

                                        vmData.address_info.province_name  = address_component.province;
                                        vmData.address_info.city_name  = address_component.city;
                                        vmData.address_info.county_name = address_component.district;
                                        vmData.address_info.address = address_component.street_number + address_component.street;

                                        vmData.address_text = vmData.address_info.province_name + ' ' + vmData.address_info.city_name + ' ' + vmData.address_info.county_name ;

                                    } else {
                                        // 位置获取失败
                                        getPositionFail();
                                    }
                                },
                                error: function() {
                                    // 位置获取失败
                                    getPositionFail();
                                }
                            });

                        } else {
                            // 位置获取失败
                            getPositionFail();
                        }

                    },
                    error: function() {
                        // 位置获取失败
                        getPositionFail();
                    }
                });
            }, function(e) {
                // 位置获取失败
                getPositionFail();

            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });

        },

        // 删除收货地址
        del: function(id) {
            if(confirm('确认删除收货地址？')){
                del_setAddress(id , 'del');
            }
        },

        // 保存收货地址
        save: function() {
            var param = {};
            if(form.isCheck(true)){

                if( vmData.address_info.zipcode!=''&&!/^[0-9]{6}$/.test(vmData.address_info.zipcode) ){
                    popup.error('邮政号码格式错误！');
                    return ;
                }

                vmData.address_info.default_addr = Number( vmData.address_info.default_addr );
                forEachIn(vmData.address_info, function(key, value) {
                    param[key] = value || '';
                });

                editAddress( param );
            }
        }

    });

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    // 获取收货地址列表
    popup.loading('show');
    region.onReady = function() {
        getAddressList();
    };

    //地址列表左滑时间
    exbind.register('chosen-swipe', 'load', function(e) {

        var node = this,
            node_width = node.offsetWidth,
            text_con_width = node.querySelector('.list-content').offsetWidth;

        var diff = -(node_width - text_con_width) ;
        var all_li = document.querySelectorAll('#address_list .li-div') ;

        node.addEventListener('swipeLeft', function(e) {
            e.stopPropagation();
            e.preventDefault();

            [].slice.call(all_li || []).forEach(function(item) {
                item.style.transform = item.style.webkitTransform = 'translateX(0px)';
            }) ;
            node.style.transform = node.style.webkitTransform = 'translateX(' + diff + 'px)';

        }).addEventListener('swipeRight', function(e) {
            e.stopPropagation();
            e.preventDefault();

            node.style.transform = node.style.webkitTransform = 'translateX(0px)';

        }).addEventListener('swipe', function(e) {
            var point = e.data;
            // 判断左右滑
            if(Math.abs(point.diffX.keys(0)) > Math.abs(point.diffY.keys(0))){
                e.stopPropagation();
                e.preventDefault();
            }
        });

    });

    // 地址列表
    router.register('', function() {} , 1  );

    // 新增或编辑地址
    router.register('?detail', function() {} , 0 , 0 );

});