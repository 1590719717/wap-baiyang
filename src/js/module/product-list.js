/*!
 * @author liyuelong1020@gmail.com  yuchunfeng
 * @date 2016/6/24 024
 * @description 产品列表页
 */

define('product-list',['ajax', 'popup', 'widget', 'mvvm', 'member', 'router'],function (require, exports) {
    var ajax = require('ajax');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var member = require('member');
    var router = require('router');

    // 搜索关键字
    var keyword = decodeURI((location.search.substr(1).match(/(^|&)keyword=([^&]*)(&|$)/) || [])[2] || '');
    var categoryId = decodeURI((location.search.substr(1).match(/(^|&)categoryId=([^&]*)(&|$)/) || [])[2] || '');

    // 是否跨境产品   不传-所有 0-国内 1-跨境产品
    var is_global = decodeURI((location.search.substr(1).match(/(^|&)is_global=([^&]*)(&|$)/) || [])[2] || '');

    // 页面数据
    var vmData = MVVM.define('product-list', {

        data: null,                       // 列表数据
        data_attr:[],                    //属性名称 跟内容
        popup_attr:[],                  //筛选条件下的内容
        total: 0,                       // 总页数
        empty: false,                   //列表为空
        click_attr: -1 ,                 //

        sort_field: 'all',             // 排序方式
        sort_type: 'desc',              // 升序/降序

        categoryId: categoryId,                  //商品分类Id
        keyword: keyword,               // 搜索关键字
        searchAttr: '',                 //选择搜索的属性名称
        type: 'all',                     //综合排序：all；人气： hot; 销量：sales；价格：price；
        typeStatus: 0,             // 排序方式   0降序 1升序
        downPrice:'',                   //开始价格
        upPrice: '',                    //结束价格
        pageStart: 1,                        // 当前页面
        pageSize: 10,                       // 每页数量

        attrNameLen: 0,                      //属性长度
        is_init_value: false ,              //初始化属性的长度的标志
        check_value: {} ,                   //  单独筛选 确定的值

        flag_check: {} ,
        is_filter : false ,

        // 排序
        sort: function(type) {

            if( type != 'filter' ){

                if(type != vmData.sort_field) {
                    vmData.sort_field = type;
                    vmData.sort_type = 'desc';

                } else if( vmData.sort_field == 'price' ) {
                    //价格有升降序
                    vmData.sort_type = vmData.sort_type == 'asc' ? 'desc' : 'asc';

                } else {
                    if( vmData.sort_field == 'sales' || vmData.sort_field == 'all' ) {
                        return false;
                    }
                    vmData.sort_type = 'desc' ;

                }
                vmData.type = type ;
                vmData.typeStatus = vmData.sort_type == 'asc' ? 1 : 0 ;

                vmData.pageStart = 1;
                vmData.data.length = 0;
                getData();

            } else {
                vmData.is_filter = true ;
                vmData.click_attr = -1 ;
                vmData.filter_param = false ;

                for(var i = 0 ; i < vmData.attrNameLen; i++ ) {
                    vmData.flag_check['has' + i ] = vmData.check_value['chosen'+ i ] ;
                }

                document.documentElement.classList.add('fixed-popup');
            }
        },

        /* 顶部筛选弹窗
        * ***************************/
        filter_param: false ,          //是否显示顶部筛选弹窗

        show_filter_param: function(index) {
            vmData.click_attr = index ;
            vmData.filter_param = true ;
            vmData.popup_attr =  vmData.data_attr[index].attrValue ;
            vmData.flag_check['has' + index ] = vmData.check_value['chosen'+ index ] ;
        },

        //隐藏顶部筛选弹窗
        close_filter_param: function() {
            vmData.filter_param = false ;
            vmData.click_attr = -1 ;
        },

        //单独筛选 重置
        filter_list_reset:function() {

            vmData.searchAttr = '' ;

            vmData.check_value['chosen'+ vmData.click_attr] = [];
            vmData.flag_check['has' + vmData.click_attr] = [] ;

            var i = 0 ;
            for(i ; i < vmData.attrNameLen; i++ ) {

                if( vmData.check_value['chosen'+i].length > 0 ) {

                    vmData.check_value['chosen'+i].forEach(function(item ,index ) {

                        if( index == 0) {
                            vmData.searchAttr += '_' ;
                        }
                        vmData.searchAttr += item.split('_')[1] ;

                    }) ;

                    vmData.searchAttr = vmData.searchAttr.replace(/,$/gi,"");
                }

            }

            vmData.pageStart = 1;
            vmData.data.length = 0;

            getData(function(){
                vmData.click_attr = -1 ;
                vmData.filter_param = false ;
            });
        },

        //单独筛选 确定
        filter_list_sure:function() {

            vmData.check_value['chosen'+ vmData.click_attr] = vmData.flag_check['has' + vmData.click_attr ] ;

            vmData.searchAttr = '' ;
            var i = 0 ;
            for(i ; i < vmData.attrNameLen; i++ ) {
                if( vmData.check_value['chosen'+i].length > 0 ) {

                    vmData.check_value['chosen'+i].forEach(function(item ,index ) {

                        if( index == 0) {
                            vmData.searchAttr += '_' ;
                        }
                        vmData.searchAttr += item.split('_')[1] ;

                    }) ;

                    vmData.searchAttr = vmData.searchAttr.replace(/,$/gi,"");

                }
            }

            vmData.pageStart = 1;
            vmData.data.length = 0;
            getData(function(){
                vmData.click_attr = -1 ;
                vmData.filter_param = false ;
            });

        },

        // 收起或隐藏
        show_more: function(obj) {
            var parent_li = obj.parentNode.parentNode ;
            parent_li.classList.toggle('open');
        } ,

        // 筛选全部条件 重置
        filter_reset: function() {
            vmData.searchAttr = '';
            vmData.upPrice = '';
            vmData.downPrice = '';
            var  i = 0 ;
            for( i ; i < vmData.attrNameLen ; i ++ ){
                vmData.check_value[ 'chosen' + i ] = [] ;
                vmData.flag_check['has' + i ] = [] ;
            }
            vmData.pageStart = 1;
            vmData.data.length = 0;
            getData(function(){
                vmData.click_attr = -2 ;
                vmData.is_filter = false ;
                document.documentElement.classList.remove('fixed-popup');
            });
        },

        // 筛选全部条件   确定
        filter_sure: function() {
            vmData.searchAttr = '';
            var i = 0 ;
            for(i ; i < vmData.attrNameLen; i++ ) {
                vmData.check_value['chosen'+ i ] = vmData.flag_check['has' + i ] ;

                if( vmData.check_value['chosen'+i].length > 0 ) {

                    vmData.check_value['chosen'+i].forEach(function(item ,index ) {

                        if( index == 0 ) {
                            vmData.searchAttr += '_' ;
                        }
                        vmData.searchAttr += item.split('_')[1] ;

                    }) ;

                    vmData.searchAttr = vmData.searchAttr.replace(/,$/gi,"");
                }
            }

            vmData.pageStart = 1;
            vmData.data.length = 0;

            if( vmData.downPrice && !/^\d*$/.test(vmData.downPrice) || vmData.upPrice && !/^\d*$/.test(vmData.upPrice) ){
                popup.error('请输入正整数');
                return false;
            }

            getData(function(){
                vmData.click_attr = -2 ;
                vmData.is_filter = false ;
                document.documentElement.classList.remove('fixed-popup');

                if( vmData.downPrice && vmData.upPrice && Number(vmData.downPrice) > Number(vmData.upPrice) ) {
                    var center_num = Number(vmData.downPrice) ;
                    vmData.downPrice = Number(vmData.upPrice) ;
                    vmData.upPrice = center_num ;
                }

            });
        }
    });

    var getData = function(callback) {

        var param = {}.
            url = '';

        if( vmData.categoryId ) {
            //产品分类id搜索
            param = {
                token: member.token ,
                categoryId: vmData.categoryId ,                // 搜索分类id
                searchAttr: vmData.searchAttr,                 //选择搜索的属性名称
                type: vmData.type,                             //综合排序：all；人气： hot; 销量：sales；价格：price；
                typeStatus: vmData.typeStatus,                 // 排序方式   0降序 1升序
                pageStart: Number(vmData.pageStart),           // 当前页面
                pageSize: vmData.pageSize                      // 每页数量
            };
            url =   Config.url + 'background/search/categorylist' ;

        } else {
            //关键词搜索
            param = {
                token: member.token ,
                keyword: vmData.keyword ,                       // 搜索关键字
                searchAttr: vmData.searchAttr,                  //选择搜索的属性名称
                type: vmData.type,                              //综合排序：all；人气： hot; 销量：sales；价格：price；
                typeStatus: vmData.typeStatus,                  // 排序方式   0降序 1升序
                pageStart: Number(vmData.pageStart),            // 当前页面
                pageSize: vmData.pageSize                       // 每页数量
            };
            url =   Config.url + 'background/search/index' ;
        }

        if( vmData.downPrice && vmData.upPrice ) {
            if( Number(vmData.downPrice) > Number(vmData.upPrice) ) {
                param.downPrice = vmData.upPrice ;
                param.upPrice = vmData.downPrice ;
            } else {
                param.downPrice = vmData.downPrice ;
                param.upPrice = vmData.upPrice ;
            }

        } else {
            param.downPrice = vmData.downPrice ;
            param.upPrice = vmData.upPrice ;
        }

        // 加载品牌列表
        ajax({
            type: 'post',
            url: url,
            data: param,
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(!vmData.data){
                    vmData.data = [] ;
                }

                if(data && data.code == 200) {

                    vmData.total = data.data.pageCount ;
                    if( data.data.listData && data.data.listData.length ) {
                        data.data.listData.forEach(function (item) {
                            item.price = Number(item.price).toFixed(2) ;
                        })
                    }
                    vmData.data = vmData.data.concat(data.data.listData);
                    //初始化属性
                    if (vmData.pageStart == 1 && !vmData.is_init_value) {
                        vmData.is_init_value = true;
                        vmData.data_attr = data.data.attrName;
                        var i = 0;
                        vmData.attrNameLen = data.data.attrName.length;
                        for (i; i < vmData.attrNameLen; i++) {
                            vmData.check_value['chosen' + i] = [];
                            vmData.flag_check['has' + i] = [];
                        }
                    }
                    callback && callback();

                }else if( data && data.code == 100006 && vmData.pageStart == 1 ) {
                    //搜索结果为空
                    vmData.data = [] ;
                    vmData.empty = true;

                    callback && callback();

                } else {
                    popup.error(data?data.message:this.url + ' Error') ;
                }
            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 滚动区域
    var scrollWrap = document.body,
        header = document.getElementById('header'),
        nav = document.getElementById('nav-wrap'),
        hHeight = header.scrollHeight  ,
        navHeight = nav.scrollHeight,
        popup_con = document.getElementById('filter_popup'),
        filter_con = document.getElementById('filter_con');

    //隐藏弹窗
    popup_con.addEventListener('click', function(e) {
        if(!filter_con.isEqualNode(e.target) && !filter_con.contains(e.target)){
            vmData.is_filter = false ;
            document.documentElement.classList.remove('fixed-popup');
        }
    });

    // 滑动到底部则自动更新
    var winHeight = window.innerHeight + 100,
        headIsShow = true,
        scrollLock = false,
        timer;

    window.addEventListener('scroll', function () {

        if(!scrollLock){
            clearTimeout(timer);
            timer = setTimeout(function() {
                if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && vmData.pageStart < vmData.total){
                    vmData.pageStart += 1;
                    scrollLock = true;
                    getData(function() {
                        scrollLock = false;
                    });
                }
            }, 20);
        }

        if(scrollWrap.scrollTop > hHeight && headIsShow && (scrollWrap.scrollHeight - hHeight - navHeight > winHeight ) ){
            headIsShow = false;
            nav.style.position = 'fixed';

        } else if(scrollWrap.scrollTop <= hHeight && !headIsShow   ) {

            headIsShow = true;
            nav.style.position = '';

        }

    });

    getData();


});