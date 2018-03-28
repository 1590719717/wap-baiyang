/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/7/4 004
 * @description Description
 */

define('order-confirm',['ajax', 'public', 'member', 'popup', 'widget', 'mvvm', 'validate', 'region','exbind','router', 'md5', 'image-manage'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var validate = require('validate');
    var Region = require('region');
    var Selector = require('selector');
    var Public = require('public');
    var exbind = require('exbind');
    var router = require('router');
    var md5 = require('md5');
    var image_manage = require('image-manage');

    // 对象遍历
    var forEachIn = Public.forEachIn;

	// 获取url参数
    var urlParam = (function () {
        var param = {};
        var searchArr = location.search.substr(1).split('&');
        searchArr.forEach(function (string) {
            var index = string.indexOf('=');
            if (index > -1) {
                var name = string.substr(0, index);
                var value = decodeURIComponent(string.substr(index + 1));
                name && (param[name] = value || '');
            }
        });
        return param
    })();
    
    // 是否是海外优选
    var is_global = Number(decodeURI((location.search.substr(1).match(/(^|&)is_global=([^&]*)(&|$)/) || [])[2] || ''));

    // 是否是海外优选
    var goods_id = decodeURI((location.search.substr(1).match(/(^|&)goods_id=([^&]*)(&|$)/) || [])[2] || '');

    // 是否是海外优选
    var goods_number = decodeURI((location.search.substr(1).match(/(^|&)goods_number=([^&]*)(&|$)/) || [])[2] || '');
	
	//易复诊返回参数
	var source = decodeURI((location.search.substr(1).match(/(^|&)source=([^&]*)(&|$)/) || [])[2] || '');
	
    // 初始化当前地址
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
                    cartSubmit(0);

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
    var del_setAddress = function(id,type) {
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
                    cartSubmit(0);
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

    // 根据限时达/当日达信息生成下拉菜单数据
    var getO2OData = function(data, o2o_payment) {
        var o2o_data = {},          // o2o临时数据
            o2o_array = [],         // o2o下拉菜单数据
            default_data;           // 默认选中项

        if(data && data.length){
            data.forEach(function(item, i) {
                var date, time ;
                date = item.date + '[' + item.day + ']' ;
                if(item.times && item.times.length ){
                    item.times.forEach(function (each , index) {

                        if( o2o_payment == 3 ){    //当日达
                            time =  '';
                        } else if( o2o_payment == 2 ){    //两小时达
                            time =  each.time_slot ;
                        }

                        var item_data = function(name) {
                            if(name) {
                                this.name = name;
                            }
                        };
                        item_data.prototype = {
                            date: date,
                            hour : time,
                            fee: each.fee,
                            time: each.time
                        };

                        if(!o2o_data[date]) {
                            o2o_data[date] = new item_data(date);
                        }

                        var fee_str = '' ;
                        if( Number(each.fee) == 0 ){
                            fee_str = '免运费' ;
                        } else {
                            fee_str = each.fee + '元' ;
                        }

                        if(time) {
                            if(!o2o_data[date].list){
                                o2o_data[date].list = {};
                            }

                            if(!o2o_data[date].list[time]){
                                o2o_data[date].list[time] = new item_data(time);
                            }

                            o2o_data[date].list[time].list = [ new item_data(fee_str)];

                        } else {

                            o2o_data[date].list = [ new item_data(fee_str)];

                        }

                        if( each.selected == 1 &&  item.selected == 1 ) {
                            default_data =  new item_data();
                        }

                    });
                }

            });

            // 将临时数据转化成下拉菜单数据格式
            forEachIn(o2o_data, function(key, date) {
                if(date.list && Public.isObject(date.list)) {
                    var list = [];
                    forEachIn(date.list, function(key, time) {
                        list.push(time);
                    });
                    date.list = list;
                }
                o2o_array.push(date);
            });
        }

        return {
            o2o_array: o2o_array,                  // 下拉菜单数组
            default_data: default_data             // 默认值
        }
    };

    // 订单详情
    var vmData = MVVM.define('order-confirm', {
        cart_data:[],                 // 订单信息
        allGiftList:[],          //全场满赠赠品列表
        allIncreaseBuyList:[],     //全场的加价购商品列表
        goodsList:[],               //购买的商品列表
        balance: 0 ,               //余额
        invoiceInfo:[] ,             //发票信息
        isBalance: 1 ,              //是否使用余额
        rx_exist:0 ,                 //是否是处方药
        is_global: 0,               // int      是否海外优选(默认0)
        goods_num: 0 ,               //商品件数   判断显示单个商品还是商品清单  1：单个商品信息  2:多个商品列表
        coupon_list:[],              //优惠券列表

        freight:0 ,                  //运费
        freightInfo_tips:'',         //运费提示语

        expressList:[],              // 配送方式的数据
        show_express_list:[],        // 展示的配送方式
        expressText: '',             //支付配送显示语
        paymentList:[],              // 支付方式列表

        chosen_coupon_sn: '',           //选中的优惠券
        address_selected:{} ,        //选中的收货地址
        addr_id: '',                // int      收货地址ID
        is_change_address: false ,  //是否切换地址

        address_type: '',           // edit : 修改地址  add：添加地址
        address_text: '',             //选择地区后的文本


        invoice_type:0 ,            // 发票类型 0不需要 1个人 2单位
        is_person: 0 ,              // 中间值 存储发票类型  1个人 2单位
        person_text: '',            // 个人抬头
        company_text:'',            //  公司抬头
        median_person_text:'',         // 个人抬头  中间值
        median_company_text:'' ,           //  公司抬头  中间值
        is_edited_person : false ,          // 是否编辑过个人抬头
        taxpayer_number: '',

        leave_word: '',             // string   留言信息
        pay_password: '',           // string   md5加密后的支付密码
        callback_phone: '',         // string   处方药回拨电话号码
        ordonnance_photo: '',       // string   处方单照片(base64格式)

        is_show_global_agreement: 0,// int      是否显示海外优选协议
        global_agreement: 0,        // int      是否选中海外优选协议(默认不选中)

        is_freight_collect: 1,      // int      是否隐藏货到付款，0：隐藏
        shipping_way_id : 1 ,       // int      支付方式的id     1:在线支付  3:货到付款
        str_invoice : '' ,          // string   发票id-发票抬头

        is_touch_machine: Config.platform.isFromBYTouchMachine ,   //  是否是触屏机

        payment_id: 0,              //int      支付id    0-在线支付，3 : 货到付款，默认：0
        shipping_time_id: 0,            //int 配送方式   0-普通快递,1-顾客自提,2-两小时达,3-当日达      默认：0   显示的数据 x
        express_type: 0 ,               //int 配送方式   0-普通快递,1-顾客自提,2-两小时达,3-当日达      默认：0  发送的数据

        o2o_type: 0,                    // 显示的配送类型  2-两小时达,3-当日达
        is_show_ShippingDesc: false ,   // 是否显示 不限时配送的地区弹窗
        o2o_promote_text: '',           // 限时达配送公告

        o2o_data: '',                   // 限时达日期与时间
        o2o_fee: 0,                     // 限时达运费
        o2o_time: '',                   // 限时达时间戳

        // o2o下拉菜单对象
        o2o_region: null,

        openShippingDesc:function (){        //打开 不限时配送的地区弹窗
            vmData.is_show_ShippingDesc = true ;
        } ,
        closeShippingDesc:function (){       //关闭 不限时配送的地区弹窗
            vmData.is_show_ShippingDesc = false ;
        } ,

        // 选择快递方式 限时达  普通快递
        choseShippingTime: function (shipping_time_id) {
            vmData.shipping_time_id = shipping_time_id || 0;
        } ,

        //选择支付方式和配送方式
        choseShippingWay: function(shipping_id,index ){

            vmData.shipping_way_id = shipping_id ;
            var support_express = vmData.paymentList[index].support_express,
                ary = [] ;
            vmData.expressList.forEach(function(item){
                if(support_express.indexOf( item.express_type ) > -1 ) {
                    ary.push( item );

                }
            });
            vmData.show_express_list =  ary ;
            // 设置限时达
            if(vmData.show_express_list && vmData.show_express_list.length ){

                if( vmData.show_express_list.length == 1 && vmData.show_express_list[0].express_type == 0 ) {
                    //货到付款不支持极速配送默认选中普通配送
                     vmData.shipping_time_id = 0 ;

                } else {

                    vmData.show_express_list.forEach(function(item){

                        //o2o极速配送
                        if( item.express_type == 3 || item.express_type == 2  ){
                            var o2o_data = getO2OData(item.dates , item.express_type );
                            // 配送类型
                            vmData.o2o_type = item.express_type ;
                            // 默认配送时间
                            if(o2o_data && o2o_data.default_data) {
                                vmData.o2o_data =  o2o_data.default_data.date + ' ' + (o2o_data.default_data.hour || '');     // 限时达日期与时间
                                vmData.o2o_fee =  o2o_data.default_data.fee;                     // 限时达运费
                                vmData.o2o_time =  o2o_data.default_data.time;                   // 限时达时间戳

                            } else {
                                vmData.shipping_time_id = 0 ;
                                vmData.o2o_data = '';
                                vmData.o2o_fee = '';
                                vmData.o2o_time = '';
                            }
                            // o2o下拉菜单对象
                            vmData.o2o_region = new Selector({
                                data: o2o_data.o2o_array,
                                title: vmData.o2o_type == 2 ? ['日期', '时间', '运费'] : ['日期', '运费'],
                                confirm: function(data) {
                                    var obj = data[data.length - 1];
                                    vmData.o2o_data =  obj.date + ' ' + (obj.hour || '');     // 限时达日期与时间
                                    vmData.o2o_fee =  obj.fee;                     // 限时达运费
                                    vmData.o2o_time =  obj.time;                   // 限时达时间戳
                                }
                            });

                        }
                    });
                }


            }
        } ,

        //保存选择的配送方式
        saveShippingWay : function(){
            // 是否选择限时达
            if(vmData.shipping_time_id && vmData.shipping_time_id > 1 && !vmData.o2o_time) {
                popup.error('请选择配送时间！');

            } else {
                vmData.payment_id = vmData.shipping_way_id;
                vmData.express_type = vmData.shipping_time_id ;

                cartSubmit(0,function(){
                    window.history.back();
                }) ;

            }
        },

        // 获取配送方式名称
        getShippingWay: function(id) {
            var str = '' ;
            vmData.paymentList.forEach(function(item) {
                if( item.payment_id == id ){
                    str = item.payment_name ;
                }
            });
            return  str ;
        },

        // 选择优惠券
        setUseCoupon: function(id) {
            if(id != vmData.chosen_coupon_sn){

                vmData.chosen_coupon_sn = id;
            } else {
                vmData.chosen_coupon_sn = '';
            }
        },

        // 领取优惠券
        setCoupon: function() {
            cartSubmit(0,function(){
                window.history.back();
            });

        },

        // 获取日期字符串
        getDateString: function(date) {
            return Public.getDateString(date, 'Y-M-D');
        },

        // 上传处方单
        ordonnance_file: '',  // 处方单文件表单字段
        getFile: function() {
            setTimeout(function() {
                if(vmData.ordonnance_file && vmData.ordonnance_file.length) {
                    var fileReader = new FileReader();
                    fileReader.onload = function(e) {
                        var img = new Image();
                        img.onload = function() {
                            // 压缩图片大小
                            image_manage(img, 1024, 1024 / img.width * img.height, function(canvas) {
                                vmData.ordonnance_photo = canvas.toDataURL('image/png').split(',')[1];
                            });
                        };
                        img.src = e.target.result;


                    };
                    fileReader.readAsDataURL(vmData.ordonnance_file[0]);
                }
            }, 0);
        },

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

        // 设置收货地址
        current_address: {},

        setAddressId: function(addr_id) {
            if( vmData.addr_id == addr_id ) {
                window.history.back();

            } else {
                vmData.addr_id = addr_id ;
                vmData.is_change_address = true ;
                cartSubmit(0,function() {
                    window.history.back();
                    vmData.is_change_address = false ;
                });

            }


        },
        // 根据标签返回图标
        getTagImg: function(tag_id) {
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

        // 点击打开地址选择下拉菜单
        selectAddress: function() {
            var address_info = vmData.address_info;
            region.setAddress(address_info.areaid, address_info.cityid, address_info.districtid);
            region.show();
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
                editAddress(param);
            }
        },

        // 获取手机号码(马赛克处理)
        getPhone: function(phone) {
            if(phone){
                var phoneArr = [].slice.call(phone);
                phoneArr.splice(3, 4, '*','*','*','*');
                return phoneArr.join('');
            } else {
                return '';
            }
        },

        //跳转到发票页面
        goInvoice : function() {
            if( vmData.address_selected && vmData.address_selected.id ){
                router.route('?invoice');
            } else {
                popup.error('请先去选择收货地址');
            }
        },

        is_show_invoice : false ,     //是否选择电子发票
        //选择发票类型
        choseInvoiceWay: function(is_invoice_id){
            vmData.is_show_invoice = !(is_invoice_id == 0) ;   //0:无需发票 1：电子发票
        },

        // 选择个人 单位
        setPerson: function(id) {
            if( id != vmData.is_person ) {
                vmData.is_person = id ;
            }
        },

        // 设置发票信息
        setInvoice: function() {

            //不开发票
            if( !vmData.is_show_invoice ) {
                vmData.invoice_type = 0;
                vmData.is_edited_person = true ;
                window.history.back();

            //开发票
            } else {

               vmData.median_person_text = vmData.median_person_text.replace(/\s/g, '') ;
               vmData.median_company_text = vmData.median_company_text.replace(/\s/g, '') ;
               vmData.taxpayer_number = vmData.taxpayer_number.replace(/\s/g, '') ;

               if( vmData.is_person == 0  ){
                   popup.error('请选择发票抬头类型！');

               } else if( vmData.is_person == 2 && !vmData.median_company_text ) {
                   popup.error('请填写单位发票抬头！');

               } else if( vmData.is_person == 2 && !vmData.taxpayer_number ) {
                   popup.error('请输入税号！');

               } else if( /[@#$%^&!！，。.,*()+{}（）:'"“”’‘<>=?？]/.test(vmData.median_person_text) || /[@#$%^&!！，。.,*+{}:'"“”’‘<>=?？]/.test(vmData.median_company_text)) {
                   popup.error('发票抬头不能输入符号！');

               } else {

                   vmData.invoice_type = vmData.is_person ;

                   if( !vmData.median_person_text ){
                       vmData.person_text = vmData.address_selected.consignee ;
                       vmData.is_edited_person = false ;
                       vmData.median_person_text = vmData.person_text ;

                   } else {
                       vmData.person_text = vmData.median_person_text ;
                       vmData.is_edited_person = true ;
                   }

                   vmData.company_text= vmData.median_company_text ;

                   var str1 = vmData.rx_exist == 1 ? '药品-' : '明细-',
                       str2 = vmData.invoice_type == 1 ? vmData.person_text : vmData.company_text ;
                   vmData.str_invoice = str1 + str2 ;
                   vmData.is_show_invoice = true ;
                   window.history.back();

               }
            }
        },

        balance_flag: false ,           //判断 使用余额 是否已经点击
        //是否使用余额
        setBalance: function() {
            vmData.isBalance = Number(!!vmData.isBalance);
            var timer = null;
            var setTimer = function() {
                clearTimeout(timer);

                timer = setTimeout(function() {
                    cartSubmit(0,function() {
                        vmData.balance_flag = false ;
                    });

                }, 300 );
            };

            if( !vmData.balance_flag ){
                vmData.balance_flag = true ;
                setTimer();
            }
        },
        // 身份证号码
        identity_number: '',
        is_saveIdentityNumber : false ,
        // 保存身份证号码
        saveIdentityNumber: function() {
            if(vmData.identity_number && vmData.addr_id){
                ajax({
                    type: 'post',
                    url: Config.url + 'background/user_center/save_identity_number',
                    data: {
                        addressId: vmData.addr_id,                 // 收货地址ID
                        idCard: vmData.identity_number,    // 身份证号码
                        token: member.token
                    },
                    dataType: 'json',
                    beforeSend: function () {
                        popup.loading('show');
                    },
                    success: function (data) {
                        popup.loading('hide');

                        if(data && data.code == 200){
                            popup.success('保存成功！');
                            vmData.cart_data.identityNumber = vmData.identity_number;
                            vmData.is_saveIdentityNumber = true ;
                        } else {
                            popup.error(data ? data.message : this.url + ' Error');
                        }
                    },
                    error: function () {
                        popup.error(this.url + ' Error');
                    }
                });
            } else if(!vmData.identity_number){
                popup.error('请填写实名认证信息并保存！');
            } else {
                popup.error('请选择收货地址！');
            }
        },

        // 弹窗显隐控制参数
        popup_set_password: false,
        // 关闭弹窗
        closePasswordPopup: function() {
            vmData.pay_password = '';
            vmData.popup_set_password = false;
        },

        // 提交订单
        orderSubmit: function() {
            // 如果已经选择了收货地址则提交订单
            if(vmData.addr_id){
                //判断是否填写了身份证号码并保存
                if( vmData.is_global == 1  ) {
                    if( !vmData.is_saveIdentityNumber || !vmData.identity_number ){
                        popup.error('请填写实名认证信息并保存！');
                        return ;
                    }
                }
                //处方单必须填回拨电话
                if( vmData.rx_exist == 1) {
                    if( !vmData.callback_phone ) {
                        popup.error('请填写电话号码！');
                        return ;
                    }
                    if( !/^1[3|4|5|7|8][0-9]\d{8,8}$/.test(vmData.callback_phone) ) {
                        popup.error('电话号码格式错误！');
                        return ;
                    }
                }
                // 如果是海外优选，但没有同意百洋海外优选协议
                if(vmData.is_global == 1 && vmData.global_agreement != 1 && vmData.is_show_global_agreement == 1 ){
                    popup.error('请阅读同意《百洋海外优选协议》');
                    return;
                }
                //如果是触屏机且使用优惠券
                if(Config.platform.isFromBYTouchMachine && vmData.chosen_coupon_sn ){
                    vmData.cart_data.isNeedPwd = 1;
                }

                // 如果不是海外优选且使用余额支付且金额超过免支付金额
                if( vmData.is_global != 1 && vmData.cart_data.isNeedPwd == 1) {

                    if(vmData.cart_data.isSetPwd == 1){
                        // 已经设置了支付密码则显示密码弹窗
                        vmData.popup_set_password = true;
                    } else {
                        // 没有设置支付密码
                        popup.confirm('您还没有设置支付密码，是否前往设置？', function() {
                            window.location = 'user-assets.html?redirect=' + encodeURIComponent(window.location) + '#page=set_password';
                        });
                    }

                } else {
                    orderSubmit();
                }

            } else {
                popup.error('收货地址不能为空！');
            }
        },

        // 输入密码提交订单
        passwordSubmit: function() {
            vmData.pay_password = vmData.pay_password.replace(/[^\d]/g, '');
            if(vmData.pay_password.length == 6){
                orderSubmit();
            }
        }
    });
    // 提交订单
    var orderSubmit = function() {
        var param = {
            address_id: vmData.addr_id,
            payment_id: vmData.payment_id,
            express_type: vmData.express_type,
            buyer_message: vmData.leave_word,
            invoice_type: vmData.invoice_type ,
            is_balance: Number(!!vmData.isBalance) ,
            pay_password: md5(vmData.pay_password),
            is_global: vmData.is_global,
            token: member.token
        };
        //是否选择优惠券
        if( vmData.chosen_coupon_sn ) {
            param.record_id = vmData.chosen_coupon_sn ;
        }
        //是否选择发票信息
        if( vmData.invoice_type > 0 ) {
            param.invoice_header = vmData.invoice_type == 1 ? vmData.person_text : vmData.company_text ;
            param.invoice_content_type = vmData.rx_exist == 1 ? 10 : 16 ;     // 10：药品（处方药）   16 明细（非处方药）
            //添加税号
            if( vmData.invoice_type == 2 ) {
                param.taxpayer_number = vmData.taxpayer_number ;
            }

        }
        //处方药的照片
        if( vmData.ordonnance_photo ) {
            param.ordonnance_photo = vmData.ordonnance_photo ;
        }
        //回拨电话
        if( vmData.callback_phone ) {
            param.callback_phone = vmData.callback_phone ;
        }
        // O2O配送
        if(vmData.express_type && vmData.express_type > 1 && vmData.o2o_time) {
            param.o2o_time = vmData.o2o_time;                       // 配送时间段起始时间（时间戳）
        }

        // 如果是触屏机则发送机器号到后台
        if(Config.platform.isFromBYTouchMachine){
            // 触屏机机器号
            param.machine_sn = Config.platform.DeviceId;
        }

        // 中民网返利接口参数
        var discount;
        if(localCache.getItem('__local_discount_code__')) {
            try{
                discount = JSON.parse(localCache.getItem('__local_discount_code__'));
            } catch(e) {}

            if(discount && discount.bid && discount.euid && discount.union_id && Date.now() - discount.stamp < 2592000000){
                param.bid = discount.bid;
                param.euid = discount.euid;
                param.union_id = discount.union_id;
            } else {
                localCache.removeItem('__local_discount_code__');
            }
        }


        // 一键购买
        if(goods_id && goods_number){
            param.goods_id = goods_id;
            param.goods_number = goods_number;
        }
		
		//易复诊返回参数添加
		if(source){
			param.source = source;
		}
		
        ajax({
            type: 'post',
            url: Config.url + 'background/order/order_submit',
            data: param,
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function (data) {

                var orderSuccess = function() {
                    if(data.data.leftAmount > 0 && data.data.isOnlinePay && vmData.rx_exist != 1 ){
                        // 跳转至支付页面
                        window.location.replace('order-pay.html?order_id=' + data.data.orderSn + '&is_global=' + is_global);
                    } else {
                        // 已余额支付，跳转至提交成功页面
                        window.location.replace('order-submit-successfully.html?order_id=' + data.data.orderSn );
                    }
                };

                if(data && data.code == 200 && data.data && data.data.orderSn ){
                    // 如果是亿起发则请求第三方返利url
                    if(discount && discount.union_id == 'yqf'){
                        ajax({
                            type: 'post',
                            url: Config.url + 'wap/Cpsleagues/returnUrl',
                            data: {
                                token: member.token,
                                order_id: data.data.orderSn
                            },
                            dataType: 'text',
                            success: function (data) {
                                if(data) {
                                    var img = new Image();
                                    img.onload = img.onerror = orderSuccess;
                                    img.src = data;
                                } else {
                                    orderSuccess();
                                }
                            },
                            error: orderSuccess
                        });
                    } else {
                        orderSuccess();
                    }

                } else if(data && /^500020|500021/ig.test(data.code)){
                    // 确认再次提交
                    popup.confirm(data.message, function() {
                        orderSubmit();
                    }, function() {
                        //cartSubmit(1);
                    });

                } else {
                    popup.error( data?data.message:this.url + ' Error');
                }
                vmData.pay_password = '';

            },
            error: function () {
                popup.error(this.url + ' Error');
            }
        });
    };
    // 提交购物车（获取订单信息）
    var cartSubmit = function( is_first , callback ) {
        var cart_param = {};
        if( is_first == 1){
            cart_param = {
                token: member.token ,
                is_first: 1,        //使用场景：0-选择地址，优惠券，支付，配送等，1-点击结算
                is_global: vmData.is_global
            };
        } else {
            cart_param= {
                token: member.token ,
                payment_id: vmData.payment_id,                  // 用户支付方式
                address_id : vmData.addr_id ,
                record_id: vmData.chosen_coupon_sn ,           // 用户优惠券
                is_global: vmData.is_global,                   // 是否提交海外优选订单
                is_first: 0,                                   //使用场景：0-选择地址，优惠券，支付，配送等，1-点击结算
                is_balance: Number(!!vmData.isBalance)                   //是否使用余额支付
            };

            // O2O配送
            if( vmData.express_type && vmData.express_type > 1 && vmData.o2o_time && !vmData.is_change_address ) {
                cart_param.address_id = vmData.addr_id ;
                cart_param.o2o_time = vmData.o2o_time;                       // 配送时间段起始时间（时间戳）
                cart_param.express_type = vmData.express_type;               // 配送类型：2-两小时达,3-当日达
            }

            // 切换收货地址 express_type默认为2
            if( vmData.is_change_address ) {
                cart_param.express_type = 2 ;
            }

        }

        // 一键购买
        if(goods_id && goods_number){
            cart_param.goods_id = goods_id;
            cart_param.goods_number = goods_number;
        }

        ajax({
            type: 'post',
            url: Config.url + 'background/cart/cart_submit',
            data: cart_param ,
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function (data) {
                popup.loading('hide');

                if(data && data.code == 200 ) {

                    if(data.data.identityNumber == '' || data.data.identityNumber == 0 ) {
                        vmData.identity_number = data.data.identityNumber = '';
                        vmData.is_saveIdentityNumber = false;
                    } else {
                        vmData.identity_number = data.data.identityNumber ;        // 身份证信息
                        vmData.is_saveIdentityNumber = true;
                    }

                    vmData.cart_data = data.data ;                          //总数据
                    vmData.balance = Number(data.data.balance);                           //余额
                    vmData.isBalance = data.data.isBalance ;                               //是否使用余额
                    vmData.shipping_way_id = vmData.payment_id = data.data.paymentId ;                     // 支付方式
                    vmData.o2o_promote_text = data.data.announcement ;            // 公告

                    // 海外优选不能使用余额
                    if ( data.data.isGlobal == 1 ) {
                        vmData.isBalance = 0 ;
                    }
                    //余额为0时不能是用余额
                    if( data.data.balance <= 0 ){
                        vmData.isBalance = 0 ;
                    }
                    //是否隐藏货到付款
                    vmData.is_freight_collect = data.data.ifFacePay == 1;


                    //   运费  提示信息
                    //在线支付
                    if( data.data.paymentId == 0  ){
                        if( Number(data.data.freightInfo.tips.lack_price) > 0  ){
                            vmData.freight =  data.data.freightInfo.tips.not_free_fee ;
                            vmData.freightInfo_tips =  data.data.freightInfo.tips.promote_text ;
                        } else {
                            vmData.freight =  0 ;
                            vmData.freightInfo_tips =  '' ;
                        }
                        //货到付款
                    } else if( data.data.paymentId == 3  ){
                        if( Number(data.data.facePayTips.lack_price) > 0  ){
                            vmData.freight =  data.data.facePayTips.not_free_fee ;
                            vmData.freightInfo_tips =  data.data.facePayTips.promote_text ;
                        } else {
                            vmData.freight =  0 ;
                            vmData.freightInfo_tips =  '' ;
                        }
                    }

                    //收货地址列表
                    vmData.address_list  =  data.data.consigneeList ;
                    if (data.data.consigneeList && data.data.consigneeList.length) {
                        data.data.consigneeList.forEach(function (item) {
                            if (item.selected == 1) {
                                vmData.address_selected = item;         //默认选中的地址信息
                                vmData.addr_id = item.id ;              //默认选中的地址id

                                // 处方药回拨电话号码
                                if (data.data.rxExist == 1) {
                                    vmData.callback_phone = item.telphone ;
                                }

                            }
                        });
                    }

                    if( is_first != 1) {
                        // 修改收货地址 发票个人抬头也跟着改变
                        if( vmData.address_selected && vmData.address_selected.id && !vmData.is_edited_person ){
                            vmData.median_person_text = vmData.address_selected.consignee ;
                            vmData.is_person = vmData.invoice_type = 1 ;
                            var str1 = vmData.rx_exist == 1 ? '药品-' : '明细-';
                            vmData.str_invoice = str1 + vmData.median_person_text ;
                            vmData.is_show_invoice = true ;
                        }
                    }

                    //配送方式     极速配送
                    vmData.expressList = data.data.expressList;            //配送方式
                    vmData.paymentList = data.data.paymentList ;           //支付方式
                    vmData.expressText = data.data.expressText ;           //支付配送提示语
                    vmData.shipping_time_id =
                        vmData.o2o_type =
                            vmData.express_type = data.data.expressType ;  //配送方式

                    //获取初次默认选中配送方式
                    if(data.data.paymentList && data.data.paymentList.length ){
                        vmData.show_express_list = [];
                        data.data.paymentList.forEach(function (item , index ) {
                            if(item.selected == 1 ) {
                                vmData.choseShippingWay(item.payment_id , index ) ;
                            }
                        }) ;
                    }

                    //优惠券
                    vmData.coupon_list = data.data.couponList || [] ;
                    vmData.chosen_coupon_sn = '' ;
                    if( vmData.coupon_list && vmData.coupon_list.length ){
                        vmData.coupon_list.forEach(function(item){
                            item.coupon_price = Number(item.coupon_price);
                            if(item.selected == 1){
                                vmData.chosen_coupon_sn = item.record_id ;

                            }
                        });
                    }

                    vmData.goodsList = data.data.goodsList;                             //商品列表
                    vmData.allIncreaseBuyList = data.data.allIncreaseBuyList || [];      //全场的加价购商品列表
                    vmData.allGiftList = data.data.allGiftList || [];                    // 全场满赠赠品列表

                    //判断是否只有一件商品
                    if( vmData.goodsList.length == 1 ) {
                        if( vmData.goodsList[0].group_id > 0 ) {     //套餐
                            vmData.goods_num = 2 ;

                        } else if( vmData.allIncreaseBuyList && vmData.allIncreaseBuyList.length ) {
                            vmData.goods_num = 2 ;

                        } else if(vmData.goodsList[0].increaseBuyList && vmData.goodsList[0].increaseBuyList.length ) {
                            vmData.goods_num = 2 ;

                        } else {
                            vmData.goods_num = 1 ;
                        }

                    } else {
                        vmData.goods_num = 2 ;
                    }

                    callback && callback(data);

                } else {
                    popup.error(data ? data.message : '订单生成失败！', function() {
                        window.location.replace('shopping-car.html');
                    });
                }
            },
            error: function () {
                popup.error(this.url + ' Error');
            }
        });
    };

    vmData.is_global = is_global;
    vmData.isBalance = Number(!!is_global != 1);
	
	var cartInit = function() {
        // 提交购物车
        cartSubmit( 1 , function(data) {

            vmData.rx_exist = data.data.rxExist;                                // 是否有处方药    0:无 1:有
            vmData.is_global = data.data.isGlobal ;                               //是否是海外购    1：海外购  0：普通商品
            vmData.is_show_global_agreement = data.data.isShowGlobalAgreement ;   // 是否显示海外优选协议(默认0)

            //  如果没发票抬头则修改为不要发票
            if(  data.data.invoiceInfo && data.data.invoiceInfo.if_receipt == 1 ){

                var str1 = vmData.rx_exist == 1 ? '药品-' : '明细-';
                vmData.taxpayer_number = data.data.invoiceInfo.taxpayer_number ;

                // 设置个人 / 公司抬头
                if(data.data.invoiceInfo.invoice_type == 1 ) {

                    // 个人发票抬头
                    if( data.data.invoiceInfo.title_name.length ){
                        vmData.median_person_text = vmData.person_text = data.data.invoiceInfo.title_name ;
                        vmData.is_person = vmData.invoice_type = 1;       // 发票类型 0不需要 1个人 2单位

                        vmData.str_invoice = str1 + vmData.median_person_text ;
                        vmData.is_show_invoice = true;
                        vmData.is_edited_person = true ;

                    //后台返回个人发票抬头为空的时候，个人抬头默认为收货人姓名
                    } else if( vmData.address_selected && vmData.address_selected.consignee ) {
                        vmData.median_person_text = vmData.person_text = vmData.address_selected.consignee  ;
                        vmData.is_person = vmData.invoice_type = 1;

                        vmData.str_invoice = str1 + vmData.median_person_text ;
                        vmData.is_show_invoice = true;
                        vmData.is_edited_person = false ;

                    //后台返回个人发票抬头为空并且收货地址为空时 ，默认不开发票
                    } else {
                        vmData.is_person = vmData.invoice_type = 0;      // 发票类型 0不需要 1个人 2单位
                        vmData.is_show_invoice = false;
                    }


                //设置单位抬头
                } else if(data.data.invoiceInfo.invoice_type == 2 ) {               //单位
                    vmData.median_company_text = vmData.company_text = data.data.invoiceInfo.title_name ;           // 公司抬头
                    vmData.is_person = vmData.invoice_type = 2 ;  // 发票类型 0不需要 1个人 2单位

                    vmData.str_invoice = str1 + vmData.median_company_text ;
                    vmData.is_show_invoice = true;
                    vmData.is_edited_person = true ;
                }

            } else {
                vmData.is_person = vmData.invoice_type = 0;
                vmData.is_show_invoice = false;
                vmData.is_edited_person = true ;
            }

        });
    }
	
	// 易复诊 会员登录
    var yfz_login = function() {
        member.login({
            account: urlParam.username,
            password: urlParam.code,
            is_yfz: 1
        }, function(data) {

            if (data && data.code == 200) {
                //获取订单信息
//				console.log(data);
				cartInit();
            } else {
                popup.error(data ? data.message: '登录失败！', function() {
                    window.location = 'login.html';
                });
            }

        }, true);


    };
    
    // 退出登录
    var logout = function() {
        if( urlParam.username && urlParam.code ) {

            // 解绑登录事件
            member.offLogin(logout);

            // 如果会员已登录则退出登录
            member.logout(function() {
                if( Config.platform.isFromWx ){
                    member.wx_auth();

                } else {
                    yfz_login();
                }

            });

        } else{
        	cartInit();
        }
    };

    member.onLogin(logout);
    
    // 会员登录登出事件
    member.onLogout(function() {
    	if(urlParam.username && urlParam.code) {
    		//解绑登录事件
    		member.offLogin(logout);
            // 易复诊登录
            yfz_login();

        }  else {
            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
        }
        
    });
	
	
	
    // 订单详情
    router.register('', (function() {
    	
        return function() {

            if( vmData.is_show_ShippingDesc ){
                vmData.is_show_ShippingDesc = false ;
            }
            
        };
    })(), 1 );
    // 海外购协议
    router.register('?hwg_agreement', function() {} , 0 , 0 );
    // 选择支付配送方式
    router.register('?shipping_way', function() {} , 0 , 0 );
    // 地址列表
    router.register('?address', function() {

    } , 0 , 0 );
    // 新增 添加地址
    router.register('?add_address', function() {} , 0 , 0 );
    // 选择发票
    router.register('?invoice', function() {} , 0 , 0 );
    // 优惠券
    router.register('?coupon', function() {} , 0 , 0 );
    // 优惠券规则
    router.register('?coupons_rule', function() {} , 0 , 0 );
    // 商品清单
    router.register('?goodList', function() {} , 0 , 0 );
    // 发票问题
    router.register('?invoice-question', function() {} , 0 , 0 );

    //地址列表左滑时间
    exbind.register('chosen-swipe', 'load', function(e) {
        var node = this;

        node.addEventListener('swipeLeft', function(e) {
            e.stopPropagation();
            e.preventDefault();

            var node_width = node.offsetWidth,
                text_con_width = node.querySelector('.list-content').offsetWidth,
                diff = -(node_width - text_con_width) ,
                all_li = document.querySelectorAll('#address_list .li-div') ;

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


    //订单商品滑动
    exbind.register('product-list-swipe', 'load', function(e) {
        var node = this,
            listElem = node.children[0],
            scrollDiff = 0;
        node.addEventListener('swipeLeft', function(e) {
            e.stopPropagation();
            e.preventDefault();
        }).addEventListener('swipeRight', function(e) {
            e.stopPropagation();
            e.preventDefault();
        }).addEventListener('swipe', function(e) {
            e.stopPropagation();
            e.preventDefault();
            //大于3个才滑动
            if( listElem.children.length > 3 ){
                listElem.style.transform = listElem.style.webkitTransform = 'translateX(' + (e.data.diffX.keys(0) - scrollDiff) + 'px)';
            }

        }).addEventListener('swipeEnd', function(e) {
            //大于3个才滑动
            if( listElem.children.length > 3 ) {
                scrollDiff = scrollDiff - e.data.diffX.keys(0);
                if(scrollDiff < 0 ){
                    scrollDiff = 0;
                } else if(scrollDiff + node.offsetWidth > listElem.scrollWidth) {
                    scrollDiff = listElem.scrollWidth - node.offsetWidth ;
                    scrollDiff = scrollDiff > 0 ? scrollDiff : 0 ;
                }
                listElem.style.transform = listElem.style.webkitTransform = 'translateX(' + (-scrollDiff) + 'px)';
            }
        });
    });

});
