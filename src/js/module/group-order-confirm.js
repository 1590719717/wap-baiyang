/*!
 * @author lixiaoxiao@baiyjk.com
 * @date 2016/10/20 004
 * @description Description
 */

define('group-order-confirm',['ajax', 'public', 'member', 'popup', 'widget', 'mvvm', 'validate', 'region','exbind','router','md5'],function (require, exports) {
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
    
    var config = window.Config;
	var platform = config.platform;
    
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
    // 初始化当前地址
    var region = new Region(function(area, city, district) {
        vmData.address_info.districtid = district.id;
        vmData.address_info.cityid = city.id;
        vmData.address_info.areaid = area.id;
        vmData.address_info.district_name = district.name;
        vmData.address_info.city_name = city.name;
        vmData.address_info.area_name = area.name;
        vmData.address_text = vmData.address_info.area_name + ' ' + vmData.address_info.city_name + ' ' + vmData.address_info.district_name ;
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

    // 获取所有收货地址
    var getAddressList = function() {
        ajax({
            type: 'post',
            url: Config.url + 'wap/user_center/user_address_list',
            data: {
                token: member.token,
                is_group:1
            },
            beforeSend: function () {
                popup.loading('show');
            },
            dataType: 'json',
            success: function(data) {
            	popup.loading('hide');
                if(data && data.code == 200){
                    if(data.data && Array.isArray(data.data.addr_list)){
                        vmData.address_list = data.data.addr_list;
                    }
                }
            },
            error: function() {
                popup.error('InterFace Error');
            }
        });
    };

    // 新增/编辑收货地址
    var editAddress = function(param, callback) {
        popup.loading('show');
        param.token = member.token;
        ajax({
            type: 'post',
            url: Config.url + 'wap/user_center/user_address_edit',
            data: param,
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200){
                    callback(data.data);
                } else {
                    popup.error(data ? data.message : '收货地址修改失败！');
                }
            },
            error: function() {
                popup.error('InterFace Error');
            }
        });
    };

    // 删除收货地址
    var delAddress = function(param) {
        popup.loading('show');
        ajax({
            type: 'post',
            url: Config.url + 'wap/user_center/user_address_delete',
            data: {
                addr_id: param.addr_id,
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200){
                    if(data.data && Array.isArray(data.data.addr_list)){
                        vmData.address_list = data.data.addr_list;
                    }
                } else {
                    vmData.address_list = [];
                }
            },
            error: function() {
                vmData.address_list = [];
            }
        });
    };
    
    // 根据id获取收货地址
    var getAddressById = function(id) {
        var address = null;
        vmData.address_list.forEach(function(item) {
            if(item.addr_id == id){
                address = item;
            }
        });
        return address;
    };

    // 订单详情
    var vmData = MVVM.define('order-confirm', {
    	
        data: {},                   // 订单信息
        balance: {},                // 余额信息

        // 订单提交信息
        addr_id: '',                // int      收货地址ID
        
        leave_word: '',             // string   留言信息
        pay_password: '',           // string   md5加密后的支付密码
        
        
        invoice_type:0 ,            // 发票类型 0不需要 1个人 2单位
        is_person: 0 ,              // 中间值 存储发票类型  1个人 2单位
        person_text: '',            // 个人抬头
        company_text:'',            //  公司抬头
        median_person_text:'',         // 个人抬头  中间值
        median_company_text:'' ,           //  公司抬头  中间值
        is_edited_person : false ,          // 是否编辑过个人抬头
        taxpayer_number: '',                //税号
        
        is_show_invoice : false ,     //是否选择电子发票
        str_invoice : '' ,          // string   发票id-发票抬头
        
        left_time:'',				//付款后多少时间可成团
        
        //跳转到发票页面
        goInvoice : function() {
            if( vmData.data.addr_id ){
                router.route('?invoice');
            } else {
                popup.error('请先去选择收货地址');
            }
        },
		//选择发票类型
        choseInvoiceWay: function(is_invoice_id){
            vmData.is_show_invoice = !(is_invoice_id == 0) ;   //0:无需发票 1：电子发票
        },
        // 选择个人 单位
        setPerson: function(id) {
            if(id != vmData.is_person){
                vmData.is_person = id;

            } else {
                vmData.is_person = 0 ;
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

               } else if( /[@#$%^&!！，。.,*()+{}（）:'"“”’‘<>=?？]/.test(vmData.median_person_text) || /[@#$%^&!！，。.,*()+{}（）:'"“”’‘<>=?？]/.test(vmData.median_company_text)) {
                   popup.error('发票抬头不能输入符号！');

               } else {

                   vmData.invoice_type = vmData.is_person ;

                   if( !vmData.median_person_text ){
                       vmData.person_text = vmData.data.receiver_name ;
                       vmData.is_edited_person = false ;
                       vmData.median_person_text = vmData.person_text ;

                   } else {
                       vmData.person_text = vmData.median_person_text ;
                       vmData.is_edited_person = true ;
                   }

                   vmData.company_text= vmData.median_company_text ;

                   var str1 = '明细-',
                       str2 = vmData.invoice_type == 1 ? vmData.person_text : vmData.company_text ;
                   vmData.str_invoice = str1 + str2 ;
                   vmData.is_show_invoice = true ;
                   window.history.back();

               }
            }
        },
        
        is_touch_machine: Config.platform.isFromBYTouchMachine ,   //  是否是触屏机
		
        use_credit: 1,              //   是否使用红包
        // 获取抵扣金额
        getBonus: function() {
            if(vmData && vmData.balance.balance && vmData.data.real_pay){
                var balance = Number(vmData.balance.balance), real_pay = Number(vmData.data.real_pay);
                return balance > real_pay ? real_pay.toFixed(2) : balance.toFixed(2);
            } else {
                return '0.00';
            }
        },

        // 获取实际付款金额
        getRealPay: function() {
            if(vmData && vmData.balance.balance && vmData.data.real_pay){
                return vmData.use_credit && !vmData.is_global ? (Number(vmData.data.real_pay) - Number(vmData.getBonus())).toFixed(2) : Number(vmData.data.real_pay).toFixed(2);
            } else if(vmData && vmData.data.real_pay){
                return Number(vmData.data.real_pay).toFixed(2);
            } else {
                return '0.00';
            }
        },

        // 获取日期字符串
        getDateString: function(date) {
            return Public.getDateString(date, 'Y-M-D');
        },

        // 获取收货地址标签
        getTag: function(id) {
            switch(Number(id)) {
                case 1: return '我'; break;
                case 2: return '朋友'; break;
                case 3: return '亲人'; break;
                case 4: return '公司'; break;
                case 5: return '其它'; break;
                default: return '';
            }
        },
        
        //打开收货地址列表，解决收货地址列表前面对号不变的问题
        openAddress:function(){
        	getAddressList();
        	router.route('?address');
        },
        
        address_list: [],        // 地址列表

        // 新增/编辑地址详细信息
        address_info: {
            addr_id: '',              // 收货地址id
            receiver_name: '',        // 收货人
            telephone: '',            // 电话号码
            districtid: '',           // 区县id
            cityid: '',               // 市id
            areaid: '',               // 省id
            district_name: '',        // 区县id
            city_name: '',            // 市id
            area_name: '',            // 省id
            post: '',                 // 邮编
            addr_info: '',            // 地址详情
            default_addr: '',         // 是否默认地址
            tag_id: ''                // 标签id
        },

        // 设置收货地址
        current_address: {},
        setAddressId: function(addr_id, receiver_name, tag_id, telephone, addr_detail,default_addr) {
            vmData.addr_id = addr_id;
            vmData.data.default_addr = default_addr;
			vmData.data.addr_id = addr_id;
            vmData.data.receiver_name = receiver_name;
            vmData.data.tag_id = tag_id;
            vmData.data.telephone = telephone;
            vmData.data.addr_detail = addr_detail;
			
            window.history.back();
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
            var address = getAddressById(id);
            var param = {};

            if(address){
                forEachIn(vmData.address_info, function(key, value) {
                    param[key] = address[key] || '';
                });
                param.default_addr = 1;

                editAddress(param, function(data) {
                    if(data && Array.isArray(data.addr_list)){
                        vmData.address_list = data.addr_list;
                    }
                });
            }
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
                
                vmData.address_text = vmData.address_info.area_name + ' ' + vmData.address_info.city_name + ' ' + vmData.address_info.district_name ;
            }
            vmData.geolocation = null;
        },

        // 地址获取状态
        geolocation: null,
		//新增或者编辑收货地址
		address_type:'',
		//收货地址省市区
		address_text:'',
        // 添加收货地址
        add: function() {
        	
        	vmData.address_type = 'add' ;
            forEachIn(vmData.address_info, function(key) {
                vmData.address_info[key] = '';
            });
            vmData.is_select_tag = false;
			
			vmData.address_text = '' ;

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

                                        vmData.address_info.areaid = address_id.region;
                                        vmData.address_info.cityid = address_id.city;
                                        vmData.address_info.districtid = address_id.district;

                                        vmData.address_info.area_name  = address_component.province;
                                        vmData.address_info.city_name  = address_component.city;
                                        vmData.address_info.district_name = address_component.district;
                                        vmData.address_info.addr_info = address_component.street_number + address_component.street;
                                        
                                        vmData.address_text = address_component.province+' '+address_component.city+' '+address_component.district;

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
                delAddress({
                    addr_id: id
                });
            }
        },
        // 保存收货地址
        save: function() {
            var param = {};

            if(form.isCheck(true)){
                if( vmData.address_info.post!=''&&!/^[0-9]{6}$/.test(vmData.address_info.post) ){
                    popup.error('邮政号码格式错误！');
                    return ;
                }
                vmData.address_info.default_addr = Number( vmData.address_info.default_addr );
                
                forEachIn(vmData.address_info, function(key, value) {
                    param[key] = value || '';
                });
                editAddress(param, function() {
                    getAddressList();
                    window.history.back();
                });
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


                // 如果是触屏机则免支付密码金额为0
                if(Config.platform.isFromBYTouchMachine){
                    vmData.data.free_password_amount = 0;
                }

                // 如果使用余额支付且金额超过免支付金额
                if(((vmData.use_credit &&
                    Number(vmData.getBonus()) > Number(vmData.data.free_password_amount || 0)) ||
                    // 触屏机使用优惠券也要支付密码
                    Config.platform.isFromBYTouchMachine && vmData.use_credit == 1 ) &&
                    !vmData.pay_password){
                    if(vmData.balance.is_set_pay_password == 1){
                        // 如果已经设置了支付密码则显示密码弹窗
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
            addr_id: vmData.addr_id,
            invoice_type: vmData.invoice_type ,				//发票类型
            leave_word: vmData.leave_word,                  //留言
            use_credit: Number(vmData.use_credit) && Number(vmData.getBonus()),          //是否使用余额
            pay_password: vmData.pay_password,
            order_type:5,                                   //拼团订单类型
            goods_id:vmData.data.product.goods_id,          //拼团产品id
            is_open_group:vmData.data.is_open_group,
    		act_id:vmData.data.act_id,
            qty:vmData.data.product.goods_number,           //拼团购买数量
            sn:vmData.data.sn,                              //拼团检测重复提交的字符串
            token: member.token
        };
		
		//是否选择发票信息
        if( vmData.invoice_type > 0 ) {
            param.invoice_header = vmData.invoice_type == 1 ? vmData.person_text : vmData.company_text ;
            param.invoice_content_type = 16 ;     // 10：药品（处方药）   16 明细（非处方药）
            //添加税号
            if( vmData.invoice_type == 2 ) {
                param.taxpayer_number = vmData.taxpayer_number ;
            }

        }
		
        // 如果是触屏机则发送机器号到后台
        if(Config.platform.isFromBYTouchMachine){
            // 触屏机机器号
            param.machine_sn = Config.platform.DeviceId;
        }

        ajax({
            type: 'post',
            url: Config.url + 'fgroup/buy_now/submit',
            data: param,
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function (data) {
            	
                if(data && data.code == 200 && data.data && data.data.order_id){
                	if(data.data.left_amount > 0 && data.data.is_online_pay){
                        // 跳转至支付页面
                        window.location.replace('group-order-pay.html?order_id=' + data.data.order_id);
                    } else {
                        // 已红包支付，跳转至提交成功页面
                        window.location.replace('group-submit-successfully.html?order_id=' + data.data.order_id);
                    }
                } else if(data && /^34107|34108$/ig.test(data.code)){
                    // 确认再次提交
                    popup.confirm(data.message, function() {
                        orderSubmit();
                    }, function() {
                    	vmData.popup_set_password = false;
                        cartSubmit();
                    });

                }  else if(data && data.code == 31068 && vmData.balance.is_set_pay_password == 0){

                    // 没有设置支付密码
                    popup.confirm('您还没有设置支付密码，是否前往设置？', function() {
                        window.location = 'user-assets.html?redirect=' + encodeURIComponent(window.location) + '#page=set_password';
                    });

                } else {
                    popup.error( data?data.message:'订单提交失败！');
                }

                vmData.pay_password = '';
            },
            error: function () {
                popup.loading('hide');
                popup.error('订单提交失败！');
            }
        });
    };

    // 获取订单信息
    var cartSubmit = function() { 
    	if(urlParam.is_open_group && urlParam.act_id){
    		ajax({
	            type: 'post',
	            url: Config.url + 'fgroup/buy_now/confirm',
	            data: {
	            	is_open_group:urlParam.is_open_group,
	                act_id: urlParam.act_id,
	                is_check:0,
	                token: member.token
	            },
	            dataType: 'json',
	            beforeSend: function () {
	                popup.loading('show');
	            },
	            success: function (data) {
	                popup.loading('hide');
	                if(data && data.code == 200 && data.data){
	                    vmData.data = data.data;

        				vmData.addr_id = data.data.addr_id || '';                           // 收货地址ID
	                    
	                    //  如果没发票抬头则修改为不要发票
                        if(  data.data.invoiceInfo && data.data.invoiceInfo.if_receipt == 1 ){

                            var str1 = '明细-';
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
                                } else if( vmData.data.addr_id && vmData.data.receiver_name ) {
                                    vmData.median_person_text = vmData.person_text = vmData.data.receiver_name  ;
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
                        
                        //底部提示语
						if(data.data.left_time){
							var left_time = data.data.left_time;
							var hour = Math.floor(left_time / 3600);
							var minutes = Math.floor((left_time % 3600) / 60);
							vmData.left_time = '邀请小伙伴参团，';
							
							if(hour > 0 ){
								vmData.left_time += hour+'小时';
							}
							if(minutes > 0){
								vmData.left_time += minutes+'分钟'
							}
							if(data.data.gfa_type == 1){
								vmData.left_time += '内达到参团人数即可抽奖哦~';
							}else{
								vmData.left_time += '内达到参团人数即可发货哦~';
							}
							
						}
	                } else {
	                    popup.error(data ? data.message : '订单生成失败！', function() {
                            history.back();
	                    });
	                }
	            },
	            error: function () {
	                popup.error('InterFace Error');
	            }
	        });
    	}else{
    		popup.error('订单生成失败！', function() {
                window.location.replace('group-list.html');
            });
    	}
        
    };
    // 获取用户红包信息
    var getUserBalance = function() {
        ajax({
            type: 'post',
            url: Config.url + 'wap/user_balance/get_user_balance',
            data: {
                token: member.token
            },
            dataType: 'json',
            success: function (data) {
                if(data && data.code == 200){
                    vmData.balance = data.data;
                    if( Number(data.data.balance) == 0 ) {
                        vmData.use_credit = 0;
                    }
                } else {
                    vmData.use_credit = 0;
                }
                
            },
            error: function () {
                popup.error('InterFace Error');
            }
        });
    };

	
	// 订单详情
    router.register('', (function() {
        var ready = false ;
        return function() {
        	
            if(!ready){
                ready = true;
                member.onLogin(function() {
                    // 获取订单详情
			        cartSubmit();
			        // 获取用户红包信息
			        getUserBalance();
                });
            }
        };
    })(), 1 );
    // 地址列表
    router.register('?address', function() {

    } , 0 , 0 );
    // 新增 添加地址
    router.register('?add_address', function() {} , 0 , 0 );
    // 选择发票
    router.register('?invoice', function() {} , 0 , 0 );
    
    // 发票问题
    router.register('?invoice-question', function() {} , 0 , 0 );
	
	
    // 会员登录登出事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });
	
	if (platform.isFromWx || platform.isFromQQ) {
        // 微信全站绑定分享
        require.async('group-share', function (Share) {
			
            // 绑定分享
            var shareObject = Share({
                title: '海量爆款低价拼团，爱拼才会赢！',
                description: '母婴尖货、家庭常备用药、居家生活用品，千种爆款，低价开团！拼越多，赚越多！',
                img: config.cdn + 'images/icon-download.png',
                url: seajs.data.cwd + 'group-list.html',
                type: 'link'
            });

        });
    }
	
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
});
