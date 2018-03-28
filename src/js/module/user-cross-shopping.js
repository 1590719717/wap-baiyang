/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/9/27 027
 * @description 委托人列表
 */

define('user-cross-shopping', ['ajax', 'member', 'popup', 'mvvm', 'widget', 'public', 'validate', 'image-manage'], function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var widget = require('widget');
    var Public = require('public');
    var validate = require('validate');
    var image_manage = require('image-manage');

    var pageRouteBack = Public.stateRouter(function(name) {
        vmData.page = 'list';
        // 清空页数和数据
        vmData.search.page = 1;
        vmData.client_list = [];

        vmData.username = '' ;
        vmData.phone = '';
        vmData.id_card = '';
        vmData.id_card_image = '' ;
        vmData.id_card_file = '';

        getClientList();

    });

    var form = document.getElementById('form_client');
    form.validateTip = function(elem, rule, tip) {
        if(rule != 'succeed') {

            if( elem.name == 'username' ){
                tip = '姓名不能为空';
            } else if( elem.name == 'phone' ){
                if( rule == 'empty' ){
                    tip = '手机号码不能为空';

                } else {
                    tip = '手机号码格式不正确';
                }
            } else if(elem.name == 'id_card'){
                if( rule == 'empty' ){
                    tip = '身份证号码不能为空';
                } else {
                    tip = '身份证号码格式不正确';
                }
            }

            popup.error(tip , function() {
                elem.focus();
            });
        }
    };

    var vmData = MVVM.define('client-list', {

        // 查询参数
        search: {
            // 默认查询本周日期
            start_time: Public.plusDate(1 - (new Date()).getDay(), 'Y-M-D'),    // 订单开始时间
            end_time: Public.plusDate(0, 'Y-M-D'),                           // 订单结束时间
            brand_id: 'all',     // 品牌
            page: 1,             // 页数
            page_size: 10,       // 每页显示多少条数据
            total: 0            // 分页总数
        },

        // 是否已经
        is_load_all: false,

        client_list: [],        // 委托人列表
        order_amount_total: '',         // 订单总金额
        order_num_total: '',        // 订单总数

        date_type: 1,            // 日期筛选类型（用于显示前台） 0 自定义日期 1 本周 2 本月 3 近2个月 4 近3个月 5 近半年 6 近一年
        custom_start_time: '',   // 订单开始时间
        custom_end_time: '',     // 订单结束时间

        // 设置查询日期
        set_search_data: function(type) {
            var date = new Date();

            // 清空页数和数据
            vmData.search.page = 1;
            vmData.client_list = [];

            // 更新日期显示类型
            vmData.date_type = Number(type);

            if(type > 0){
                switch (Number(type)) {
                    // 本周
                    case 1:
                        vmData.search.start_time = Public.plusDate(1 - date.getDay(), 'Y-M-D');
                        break;

                    // 本月
                    case 2:
                        vmData.search.start_time = Public.plusDate(1 - date.getDate(), 'Y-M-D');
                        break;

                    // 近2个月
                    case 3:
                        date.setMonth(date.getMonth() - 2);
                        vmData.search.start_time = Public.getDateString(date, 'Y-M-D');
                        break;

                    // 近3个月
                    case 4:
                        date.setMonth(date.getMonth() - 3);
                        vmData.search.start_time = Public.getDateString(date, 'Y-M-D');
                        break;

                    // 近半年
                    case 5:
                        date.setMonth(date.getMonth() - 6);
                        vmData.search.start_time = Public.getDateString(date, 'Y-M-D');
                        break;

                    // 近一年
                    case 6:
                        date.setFullYear(date.getFullYear() - 1);
                        vmData.search.start_time = Public.getDateString(date, 'Y-M-D');
                        break;
                }
                vmData.search.end_time = Public.getDateString(new Date(), 'Y-M-D');
                // 获取数据
                getClientList();
                // 关闭弹窗
                vmData.is_show_date = false;

            } else {

                if(vmData.custom_start_time && vmData.custom_end_time){
                    vmData.search.start_time = Public.getDateString(vmData.custom_start_time, 'Y-M-D');
                    vmData.search.end_time = Public.getDateString(vmData.custom_end_time, 'Y-M-D');
                    // 获取数据
                    getClientList();
                    // 关闭弹窗
                    vmData.is_show_date = false;
                } else {
                    popup.error('请选择日期！');
                }

            }

        },

        // 品牌列表
        brand_list: [],

        // 设置查询品牌
        set_search_brand: function(brandId) {

            // 清空页数和数据
            vmData.search.page = 1;
            vmData.client_list = [];

            vmData.search.brand_id = brandId;
            // 获取数据
            getClientList();
            // 关闭弹窗
            vmData.is_show_brand = false;
        },

        is_show_date: false,       // 是否显示日期选择框
        is_show_brand: false,      // 是否显示品牌选择框

        // 显示/隐藏筛选条件弹窗
        toggle_popup: function(type) {
            if(type == 'date'){

                // 显示日期选择框
                vmData.is_show_date = !vmData.is_show_date;
                vmData.is_show_brand = false;

            } else if (type == 'brand') {

                // 显示品牌选择框
                vmData.is_show_brand = !vmData.is_show_brand;
                vmData.is_show_date = false;
            }
        } ,

        page: 'list',             // list：列表页   add：添加委托人
        pageRoute: function(name){     // 页面切换
            vmData.is_show_date = false ;
            vmData.is_show_brand = false;
            vmData.page = name;
            pageRouteBack(name);
        },


        // 添加委托人
        username: '',          //用户名
        phone: '',                //手机号
        id_card: '',            //身份证号
        id_card_image:'',            //身份证正面照

        id_card_file:'',
        getFile: function() {        //获取图片
            setTimeout(function() {
                if(vmData.id_card_file &&vmData.id_card_file.length ){
                    var fileReader = new FileReader();
                    fileReader.onload = function(e) {
                        var img = new Image();
                        img.onload = function() {

                            // 压缩图片大小
                            image_manage(img, 750, 750 / img.width * img.height, function(canvas) {
                                vmData.id_card_image = canvas.toDataURL('image/png').split(',')[1];
                            });
                        };
                        img.src = e.target.result;


                    };
                    fileReader.readAsDataURL(vmData.id_card_file[0]);
                }
            }, 0);
        },
        submitForm: function() {       //提交表单，添加委托人
            if(form.isCheck(true)){
                if( vmData.id_card_image ){
                    //提交表单  添加委托人
                    ajax({
                        type: 'POST',
                        url: Config.url + 'wap/business/add_business_mandatary',
                        data: {
                            token: member.token,
                            username: vmData.username,
                            phone: vmData.phone,
                            id_card: vmData.id_card,
                            id_card_image: vmData.id_card_image
                        },
                        dataType: 'json',
                        beforeSend: function() {
                            popup.loading('show');
                        },
                        success: function(data) {
                            popup.loading('hide');
                            if(data && data.code == 200){
                                popup.success('添加委托人成功！',function() {
                                    history.back();
                                });
                            }else{
                                popup.error(data.message);
                            }
                        },
                        error: function () {
                            popup.loading('hide');
                            popup.error('添加委托人失败！');
                        }
                    });
                }else {
                    popup.error('请上传照片');
                }
            }
        },

        //重新提交
        addClientAgain: function(name,phone,id_card) {
            vmData.username = name;
            vmData.phone = phone;
            vmData.id_card = id_card;
            vmData.pageRoute('add');
        }

    });


    // 获取委托人列表
    var getClientList = function(callback) {
        ajax({
            type: 'post',
            url: Config.url + 'wap/business/get_business_mandatary_list',
            data: {
                start_time: vmData.search.start_time,          // 订单开始时间
                end_time: vmData.search.end_time,              // 订单结束时间
                brand_id: vmData.search.brand_id,              // 品牌
                page: vmData.search.page,                      // 页数
                page_size: vmData.search.page_size,            // 每页显示多少条数据
                token: member.token
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function (data) {
                popup.loading('hide');

                if (data && data.code == 200) {

                    vmData.order_amount_total = data.data.order_amount_total;
                    vmData.order_num_total = data.data.order_num_total;
                    vmData.search.total = Math.ceil(data.data.total / vmData.search.page_size);

                    if(data.data.list && data.data.list.length){
                        // 追加订单列表
                        vmData.client_list = vmData.client_list.concat(data.data.list);
                    }
                } else if(data.code != 30001) {
                    popup.error(data ? data.message : '委托人列表加载失败！')
                }

                callback && callback();
            },
            error: function() {
                popup.error('委托人列表加载失败！')
            }
        });
    };

    // 获取品牌列表
    var getBrandList = function() {
        ajax({
            type: 'post',
            url: Config.url + 'wap/business/get_business_brand',
            data: {
                token: member.token
            },
            dataType: 'json',
            success: function (data) {
                if (data && data.code == 200 && data.data && data.data.length) {
                    vmData.brand_list = data.data;
                } else {
                    popup.error(data ? data.message : '品牌加载失败！')
                }
            },
            error: function() {
                popup.error('品牌加载失败！')
            }
        });
    };

    // 滚动区域
    var scrollWrap = document.querySelector('#client-list'),
        header = document.getElementById('header');

    // 滑动到底部则自动更新
    var winHeight = window.innerHeight + 100,
        scrollLock = false,
        timer;

    scrollWrap.addEventListener('scroll', function () {
        // 防止重复加载
        if(!scrollLock && vmData.client_list.length){
            clearTimeout(timer);
            timer = setTimeout(function() {
                if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && vmData.search.page < vmData.search.total){
                    vmData.search.page += 1;
                    scrollLock = true;
                    getClientList(function() {
                        scrollLock = false;
                    });
                }
            }, 20);
        }
    });

    // 会员登录事件
    popup.loading('show');
    member.onLogin(function () {
        getClientList();
        getBrandList();
    });
    member.onLogout(function () {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

});