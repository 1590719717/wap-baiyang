/*!
 * @author liyuelong1020@gmail.com
 * @date 2017/02/03
 * @description 商品详情页
 */

define('product', ['exbind', 'router', 'widget', 'event', 'popup', 'mvvm', 'ajax', 'member', 'public', 'app-url'],function (require, exports) {
    'use strict';

    var exbind = require('exbind');
    var router = require('router');
    var widget = require('widget');
    var event = require('event');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var member = require('member');
    var Public = require('public');
    var appUrl = require('app-url');

    var location = window.location;
    var config = window.Config;
    var platform = config.platform;

    // 是否在同一页面显示商品详情（微商城）
    var isShowDetail = platform.isFromBaiYangApp || platform.isFromWx || platform.isFromYXYApp;

    MVVM.template.helper('Date', Date);
    MVVM.template.helper('Math', Math);
    MVVM.template.helper('Number', Number);
    MVVM.template.helper('String', String);
    MVVM.template.helper('Public', Public);
    MVVM.template.helper('FormatHTML', function(html) {
        return String(html || '')
            // 删除无效标签
            .replace(/<link [^>]+>|<meta [^>]+>|<style>[\S\W\w\s]+<\/style>/igm, '')
            // 将app链接替换成wap可识别链接
            .replace(/\bhref=\"([^\"]+)\"/igm, function(str, words) {
                var link = '';

                Public.forEachIn(appUrl.app_to_wap(words), function(attr, href) {
                    link += attr + '=' + href + ' ';
                });

                return link;
            });
    });


    // 字符串模拟 OR 操作
    var or = function(str1, str2) {
        var arr1 = String(str1 || '0').split('');
        var arr2 = String(str2 || '0').split('');
        var newArr = [];

        while(arr1.length || arr2.length) {
            var _str1 = arr1.pop();
            var _str2 = arr2.pop();

            if(_str1 == '1' || _str2 == '1') {
                newArr.unshift(1);
            } else {
                newArr.unshift(0);
            }

        }

        return newArr.join('').replace(/^0+/, '') || '0';
    };

    // 字符串模拟 and 操作
    var and = function(str1, str2) {
        var arr1 = String(str1 || '0').split('');
        var arr2 = String(str2 || '0').split('');
        var newArr = [];

        while(arr1.length && arr2.length) {
            var _str1 = arr1.pop();
            var _str2 = arr2.pop();

            if(_str1 == '1' && _str2 == '1') {
                newArr.unshift(1);
            } else {
                newArr.unshift(0);
            }

        }

        return newArr.join('').replace(/^0+/, '') || '0';
    };

    // 字符串模拟 XOR 操作
    var xor = function(str1, str2) {
        var arr1 = String(str1 || '0').split('');
        var arr2 = String(str2 || '0').split('');
        var newArr = [];

        while(arr1.length || arr2.length) {
            var _str1 = arr1.pop() || '0';
            var _str2 = arr2.pop() || '0';

            if(_str1 != _str2) {
                newArr.unshift(1);
            } else {
                newArr.unshift(0);
            }

        }

        return newArr.join('').replace(/^0+/, '') || '0';
    };

    // 商品id
    var productId = window.productId || decodeURI((location.search.substr(1).match(/(^|&)id=([^&]*)(&|$)/) || [])[2] || '');

    if(!productId){
        window.location = '/index.html';
    }

    // tab切换
    var tab = (function() {
        var wrap = document.getElementById('product-tab');
        var index = 0;
        var size = 3;
        var winWidth = window.innerWidth;

        var timer;
        var translate = function() {

            clearTimeout(timer);

            timer = setTimeout(function() {
                wrap.style.transition = wrap.style.webkitTransition = 'all .3s ease';
                setTimeout(function() {
                    wrap.style.transform = wrap.style.webkitTransform = 'translateX(-' + index * 100 + '%)';
                }, 10);
            }, 10);

            vmProductDetail.tab_num = index;

            if(index > 0){
                location.hash = '#page=' + index;
            }

        };

        // 取消默认事件
        var preventDefault = function(e) {
            e.preventDefault();
            e.stopPropagation();
        };

        // 页面内部跳转路由
        window.addEventListener('hashchange', function() {
            var page = Number(Public.getSearchParam('page', location.hash.substr(1))) || 0;
            if(page != index && page >= 0 && page <= size){
                index = page;
                translate();
            }
        });

        if(!isShowDetail){

            // 如果显示头部导航（非微信）
            wrap.addEventListener('touchstart', function(e) {
                    wrap.style.transition = wrap.style.webkitTransition = 'none';
                })
                .addEventListener('swipe', function(e) {
                    var point = e.data;
                    var pointX = point.diffX.keys(0);
                    var pointY = point.diffY.keys(0);

                    if(Math.abs(pointX) > Math.abs(pointY)){
                        preventDefault(e);

                        wrap.style.transform = wrap.style.webkitTransform = 'translateX(' + (-(winWidth * index - pointX)) + 'px)';
                    }

                })
                .addEventListener('swipeLeft', function(e) {
                    preventDefault(e);

                    index++;
                    if(index >= size){
                        index = size - 1;
                    }
                    translate();
                })
                .addEventListener('swipeRight', function(e) {
                    preventDefault(e);

                    index--;
                    if(index < 0){
                        index = 0;
                    }
                    translate();
                })
                .addEventListener('swipeEnd', function(e) {
                    translate();
                });

        }


        return function(i) {
            if(i >= size){
                i = size - 1;
            }
            if(i < 0){
                i = 0;
            }
            index = i;

            translate();
        }

    })();


    // 海外购商品假装有spu
    var createGlobalSKUList = function(data) {

        var product = {
            goods_price: data.sku_price,
            goods_status: data.promotion && data.promotion.discountInfo ? data.promotion.discountInfo.goods_status : 0,
            sku_id: data.id,
            small_path: data.goods_image,
            stock: data.sku_stock,
            rules: [{
                name: '&nbsp;',
                value: data.name
            }]
        };

        // 当前商品
        vmProductDetail.sku_info = product;

        // 商品 - id 键值列表
        vmProductDetail.spu.sku_list = {
            '1':product
        };

        // 商品id列表
        vmProductDetail.spu.sku_id_list = ['1'];

        // 属性 - id 键值列表
        vmProductDetail.spu.spu_list = {
            '1': {
                hide: false,
                id: "1",
                name: "&nbsp;",
                selectable: true,
                selected: true,
                value: data.name
            }
        };

        // 属性id列表
        vmProductDetail.spu.spu_id_list = ['1'];

        // 属性分组数组
        vmProductDetail.spu.spu_select_option = {
            '&nbsp;': [vmProductDetail.spu.spu_list['1']]
        };


        updateSkuState();

    };


    // 根据sku列表生成商品spu筛选信息
    var createSKUList = function(data) {

        var skuList = {};      // 商品 - id 键值列表
        var skuIdList = [];    // 商品id列表

        var spuList = {};      // 属性 - id 键值列表
        var spuIdList = [];    // 属性id列表

        var tempSpu = {};          // 属性分组列表
        var spuSelectOption = {};   // 属性分组数组

        // spu属性id，用于二进制计算，使用字符串模拟二进制
        var id = '1';

        if(data.ruleApp && Public.isObject(data.ruleApp.skuData)){

            Public.forEachIn(data.ruleApp.skuData, function(key, product) {

                // 是否是当前sku
                var isCurrent = data.id == product.sku_id;

                if(isCurrent){
                    // 当前商品
                    vmProductDetail.sku_info = product;
                }

                if(product && product.rules && product.rules.length) {

                    // sku二进制id，由sku属性的二进制id取或值
                    product.selected_id = 0;

                    product.rules.forEach(function(rule) {
                        if(rule.name && rule.value){

                            if(!tempSpu[rule.name]) {
                                tempSpu[rule.name] = {};
                                spuSelectOption[rule.name] = [];
                            }
                            if(!tempSpu[rule.name][rule.value]) {

                                tempSpu[rule.name][rule.value] = spuList[id] = {
                                    id: id,                    // 匹配id
                                    name: rule.name,           // 分组名称
                                    value: rule.value,         // 属性值
                                    selected: isCurrent,       // 是否选中
                                    hide: false,               // 是否隐藏
                                    selectable: true           // 是否可选
                                };

                                spuSelectOption[rule.name].push(spuList[id]);
                                spuIdList.push(id);

                                id += '0';
                            }

                            // 当前商品的spu默认选中
                            if(isCurrent && ! tempSpu[rule.name][rule.value].selected){
                                tempSpu[rule.name][rule.value].selected = isCurrent;
                            }
                            if(tempSpu[rule.name][rule.value].selected){
                                vmProductDetail.spu.selected[rule.name] = tempSpu[rule.name][rule.value].id;
                            }

                            // sku属性的二进制id取或值得到sku id
                            product.selected_id = or(product.selected_id, tempSpu[rule.name][rule.value].id);

                        }
                    });

                    skuList[product.selected_id] = product;

                    skuIdList.push(product.selected_id);

                }

            });
        }

        if(!vmProductDetail.sku_info){

            // 当前商品
            vmProductDetail.sku_info = {
                goods_price: data.sku_price,
                goods_status: data.promotion && data.promotion.discountInfo ? data.promotion.discountInfo.goods_status : 0,
                sku_id: data.id,
                small_path: data.goods_image,
                stock: data.sku_stock,
                rules: [{
                    name: '&nbsp;',
                    value: data.name
                }]
            };

        }

        vmProductDetail.spu.sku_list = skuList;         // 商品 - id 键值列表
        vmProductDetail.spu.sku_id_list = skuIdList;    // 商品id列表
        vmProductDetail.spu.spu_list = spuList;         // 属性 - id 键值列表
        vmProductDetail.spu.spu_id_list = spuIdList;    // 属性id列表
        vmProductDetail.spu.spu_select_option = spuSelectOption;   // 属性分组数组

        updateSkuState();

    };

    // 更新spu选择状态/更新商品信息
    var updateSkuState = function() {

        var selected = vmProductDetail.spu.selected;
        var skuIdList = vmProductDetail.spu.sku_id_list;
        var spuList = vmProductDetail.spu.spu_list;
        var spuIdList = vmProductDetail.spu.spu_id_list;

        // 当前所选品规二进制id值
        var selectedId = 0;
        Public.forEachIn(selected, function(name, id) {
            if(id){
                selectedId = or(selectedId, id);
            }
        });


        // 遍历可用的筛选条件，将不可用的筛选条件隐藏
        spuIdList.forEach(function(spuId) {
            // 当前品规选中的品规值
            var typeId = selected[spuList[spuId].name];

            // 排除当前分类下的筛选条件
            var spuSelectId = xor(selectedId, typeId);

            spuSelectId = or(spuId, spuSelectId);

            // 是否有可选商品
            var isSelectedSku = false;

            skuIdList.forEach(function(id) {
                if(and(spuSelectId, id) == spuSelectId){
                    isSelectedSku = true;
                }
            });

            spuList[spuId].selectable = isSelectedSku;

        });

        vmProductDetail.spu.selected = selected;

        // 返回当前条件的筛选id
        return selectedId;

    };

    // 获取商品信息
    var getProductInfo = function() {

        ajax({
            type: 'post',
            url: config.url + 'background/product/product_detail',
            data: {
                sku_id: productId,
                token: member.token
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200){

                    // 商品信息
                    vmProductDetail.info = data.data;

                    // 提取品规信息
                    if(!vmProductDetail.spu.spu_select_option){

                        if(data.data.ruleApp && data.data.ruleApp.skuData){
                            createSKUList(data.data);
                        } else {
                            createGlobalSKUList(data.data);
                        }
                    }

                    var minPrice = data.data.sku_price;


                    // 商品库存
                    vmProductDetail.stock = data.data.sku_stock;

                    if(data.data.promotion){

                        // 商品最小库存
                        var stock = Math.min(data.data.sku_stock || 200, data.data.promotion.discountInfo.stock || 200, data.data.promotion.limitBuy.limit_number || 200);

                        vmProductDetail.stock = stock;

                        // 商品优惠券列表
                        vmProductDetail.coupon.coupon_list = data.data.promotion.coupon;

                        // 如果有促销优惠价则取最小价格
                        if(data.data.promotion.discountInfo.discount_type != 0) {
                            minPrice = Math.min(minPrice, data.data.promotion.discountInfo.goods_price);
                        }

                        // 商品疗程列表
                        if(data.data.promotion.treatment) {

                            vmProductDetail.treatment.price = minPrice;
                            vmProductDetail.treatment.treatment_list = data.data.promotion.treatment;

                        }

                    }

                    // 商品价格，取最小值
                    vmProductDetail.sku_price = minPrice;

                    // 商品库存
                    if(vmProductDetail.stock > 200){
                        vmProductDetail.stock = 200;
                    }

                    if(data.data.drug_type == 1){
                        // 处方药获取资讯
                        getProductRelated();
                    } else {
                        // 非处方药获取评价
                        getProductComment();
                    }


                    // 微信修改分享文案
                    if( platform.isFromWx ){
                        // 微信全站绑定分享
                        require.async('share', function(Share) {

                            // 绑定分享
                            var shareObject = Share({
                                title: data.data.meta_title || data.data.name,
                                description: data.data.meta_description || data.data.subheading_name,
                                img:  data.data.goods_image ,
                                url: String(window.location).replace(/(isband|token|unionid)=([^&]*)(&|$)/ig, ''),
                                type: 'link'
                            });

                        });

                    }


                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }
            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 获取评价
    var getProductComment = function(callback) {
        ajax({
            type: 'post',
            url: config.url + 'background/product/product_comment_list',
            data: {
                goods_id: productId,                        // 产品 id
                pageSize: vmProductDetail.comment.pageSize,           // 每页显示条数  默认为显示10条
                pageStart: vmProductDetail.comment.pageStart,        // 当前页数
                type: 'all',                                // 评论显示类型  all:全部，best:好评，middle:中评，bad差评，image图片评论
                token: member.token
            },
            dataType: 'json',
            success: function(data) {

                if(data && data.code == 200){

                    if(vmProductDetail.comment.pageStart == 1){
                        vmProductDetail.comment.comment_review = data.data.commentList.slice(0,3);
                        vmProductDetail.comment.comment_count = data.data.commentCount;
                        vmProductDetail.comment.rate_list = data.data.rateList;
                        vmProductDetail.comment.comments = [];
                    }

                    data.data.pageCount && (vmProductDetail.comment.pageCount = data.data.pageCount - 0);
                    data.data.pageStart && (vmProductDetail.comment.pageStart = data.data.pageStart - 0);
                    data.data.pageSize && (vmProductDetail.comment.pageSize = data.data.pageSize - 0);

                    if(data.data.commentList && data.data.commentList.length){
                        vmProductDetail.comment.comments = vmProductDetail.comment.comments.concat(data.data.commentList);
                    }

                    callback && callback();

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            }
        });
    };

    // 获取处方药资讯
    var getProductRelated = function() {
        ajax({
            type: 'post',
            url: config.url + 'background/product/get_related',
            data: {
                goods_id: productId,           // 产品 id
                token: member.token
            },
            dataType: 'json',
            success: function(data) {

                if(data && data.code == 200){

                    vmProductDetail.qa_list = data.data;

                //} else if(!data || data.code != 100006) {
                //    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });
    };

    // 添加足迹/收藏
    var userCollect = function(type) {

        var url, param;

        if(type == 2){
            // 足迹
            url = config.url + 'wap/user_center/user_collect_foot';
            param = {
                token: member.token,              // token校验
                product_id: productId,                 // 收藏id
                type_id: 2                // 添加类型 1：收藏 2：足迹
            };
        } else if(type == 1) {
            // 收藏
            url = config.url + 'wap/user_center/user_collect_foot';
            param = {
                token: member.token,              // token校验
                product_id: productId,                 // 收藏id
                type_id: 1                // 添加类型 1：收藏 2：足迹
            };
        } else if(type == 3) {
            // 取消收藏
            url = config.url + 'wap/user_center/user_collect_delete';
            param = {
                token: member.token,              // token校验
                collection_id_list: JSON.stringify([productId]) // 收藏id
            };
        }

        ajax({
            type: 'post',
            url: url,
            data: param,
            dataType: 'json',
            success: function(data) {

                if(data && data.code == 200){

                    if(type == 1) {
                        vmProductDetail.collect.is_collect = true;
                    } else if(type == 3) {
                        vmProductDetail.collect.is_collect = false;
                    }

                } else if(data && data.code == 201 && /^1|3$/.test(type)) {

                    popup.confirm('您还未登录，是否前往登录？', function() {
                        window.location = '/login.html?redirect=' + encodeURIComponent('/product/' + productId + '.html');
                    });

                }

            }
        });

    };

    //为你推荐
    var getRecommendData = function () {
        ajax({
            type: 'post',
            url: config.url + 'background/product/recommend_product_list',
            data: {
                product_id: productId,           // 商品 id
                token: member.token
            },
            dataType: 'json',
            success: function(data) {

                if(data && data.code == 200){

                    vmProductDetail.recommend_data = data.data;

                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });
    }

    // 商品信息
    var vmProductDetail = MVVM.define('product-detail', {
        // tab页面切换
        tab_num: 0,
        switch_tab: tab,

        // 商品数量
        sku_num: 1,

        // 商品价格
        sku_price: 0,

        // 商品库存
        stock: 0,

        // 购物车数量
        cart_num: 0,

        // 加减商品数量
        set_num: function(num) {

            var stock = vmProductDetail.stock;

            var sku_num =  Number(vmProductDetail.sku_num) + (Number(num) || 0);

            if(sku_num < 1) {
                sku_num = 1;
            }

            if(sku_num > stock) {
                sku_num = stock;
            }

            vmProductDetail.sku_num = sku_num;

            // 修改疗程当前套餐样式
            vmProductDetail.treatment.set_class();

        },

        // 商品信息
        info: null,

        // 当前商品品规信息
        sku_info: null,

        // 评价
        comment: {

            pageCount: 1,       // 总共有多少分页

            pageStart: 1,       // 当前页

            pageSize: 10,        // 每页显示条数

            // 评价信息
            comment_count: null,

            // 好评/差评率
            rate_list: null,

            // 评价预览（前3条）
            comment_review: [],

            // 评价
            comments: [],

            // 点击查看评价图片
            view_comment_img: function (arr, index) {
                vmProductDetail.comment_img = arr;
                vmProductDetail.comment_img_index = index;
                vmProductDetail.show_comment_img = true;
            }
        },

        // 多品规选择
        spu: {

            // 商品 - id 键值列表
            sku_list: null,

            // 商品id列表
            sku_id_list: null,

            // 属性 - id 键值列表
            spu_list: null,

            // 属性id列表
            spu_id_list: null,

            // 属性分组数组(用于展示)
            spu_select_option: null,

            // 已选spu
            selected: {},

            // 点击选择spu
            set_spu: function (name, id) {

                // 已选spu
                var selected = vmProductDetail.spu.selected;
                var skuList = vmProductDetail.spu.sku_list;
                var spuList = vmProductDetail.spu.spu_list;
                var skuIdList = vmProductDetail.spu.sku_id_list;


                // 如果品规可选
                if(skuIdList.length > 1 && !spuList[id].hide && spuList[id].selectable){

                    // 品规选择/取消选择
                    if(!selected[name]){
                        selected[name] = id;
                        spuList[id].selected = true;
                    } else {
                        spuList[selected[name]].selected = false;
                        if(selected[name] != id){
                            selected[name] = id;
                            spuList[id].selected = true;
                        } else {
                            selected[name] = null;
                        }
                    }


                    var selectedId = updateSkuState();


                    // 当前筛选出来的商品
                    if(skuList[selectedId]) {
                        vmProductDetail.sku_info = skuList[selectedId];

                        // 刷新当前商品信息
                        productId = skuList[selectedId].sku_id;
                        // 重置页面信息
                        vmProductDetail.comment.pageStart = 1;
                        // 重置商品数量
                        vmProductDetail.sku_num = 1;
                        // 修改页面url
                        //window.history.pushState('/product/' + productId + '.html', null, '/product/' + productId + '.html');


                        getProductInfo();

                    }

                }

            }
        },

        // 资讯
        qa_list: null,

        // 疗程
        treatment: {

            // 商品原价
            price: 0,

            // 疗程列表
            treatment_list: null,

            // 设置当前疗程样式
            set_class: function(isClick) {

                var num = Number(vmProductDetail.sku_num);

                // 修改疗程当前套餐样式
                var treatment_list = vmProductDetail.treatment.treatment_list;

                if(treatment_list && treatment_list.length){

                    // 判断当前疗程是否被选中
                    treatment_list.forEach(function(item, i) {
                        var min = Number(item.min_goods_number);
                        var max = treatment_list[i + 1] ? Number(treatment_list[i + 1].min_goods_number) : Infinity;

                        if(num >= min && num < max){

                            if(item.active && isClick) {
                                // 如果已选择则取消选择，还原价格和数量
                                item.active = false;
                                vmProductDetail.sku_price = vmProductDetail.treatment.price;
                                vmProductDetail.sku_num = 1;

                            } else {
                                // 修改商品价格为当前疗程价格
                                item.active = true;
                                vmProductDetail.sku_price = item.price;

                            }

                        } else {
                            item.active = false;
                        }
                    });

                    vmProductDetail.__update__();

                }
            },

            // 设置商品数量
            set_num: function(num) {
                vmProductDetail.sku_num = Number(num);
                vmProductDetail.treatment.set_class(true);
            }

        },

        // 加入购物车
        add_to_cart: function(isBuyNow) {

            //if(vmProductDetail.spu.sku_id_list.length > 1 && !vmProductDetail.show_type){
                // 如果商品有多条品规信息且没有弹出多品规选择弹窗则显示多品规选择弹窗
                //vmProductDetail.toggle_type(1);
            //} else
            if(isBuyNow) {
                window.location = '/order-confirm.html?goods_id=' + productId + '&goods_number=' + vmProductDetail.sku_num + '&is_global=' + vmProductDetail.info.is_global;
            } else {
                // 加入购物车
                ajax({
                    type: 'post',
                    url: config.url + 'background/cart/product_add_to_cart',
                    data: {
                        goods_id: productId,                            // 商品id
                        goods_number: vmProductDetail.sku_num,               // 加入购物车的商品数量
                        token: member.token
                    },
                    dataType: 'json',
                    beforeSend: function() {
                        popup.loading('show');
                    },
                    success: function(data) {
                        popup.loading('hide');

                        if(data && data.code == 200){
                            popup.success('加入购物车成功！', function() {
                                // 加入购物车后关闭品规选择弹窗
                                vmProductDetail.toggle_type();
                            });

                            vmProductDetail.cart_num = vmProductDetail.cart_num + vmProductDetail.sku_num;

                            // 加入购物车监测事件
                            try {
                                ga('send', 'event', '加入购物车', '加入购物车成功', window.location.pathname.replace(/[^\d]/g,''));
                            } catch (e) {
                                console.error(e)
                            }

                        } else if(!data || data.code != 100006) {
                            popup.error(data ? data.message : this.url + ' Error');
                        }

                    },
                    error: function() {
                        popup.error(this.url + ' Error');
                    }
                });
            }


        },

        // 套餐加入购物车
        group_add_to_cart: function(id) {

            ajax({
                type: 'post',
                url: Config.url + 'background/cart/add_group_product_to_cart',
                data: {
                    group_id: id,               // 套餐id
                    group_number: 1,           // 套餐数量
                    token: member.token
                },
                dataType: 'json',
                success: function (data) {
                    if (data && data.code == 200) {
                        popup.confirm('加入购物车成功，是否去购物车结算？', function() {
                            window.location = '/shopping-car.html';
                        }, {
                            cancelText: '继续选购',
                            confirmText: '去结算'
                        });
                    } else if(!data || data.code != 100006) {
                        popup.error(data ? data.message : this.url + ' Error');
                    }
                },
                error: function () {
                    popup.success(this.url + ' Error');
                }
            });

        },

        // 优惠券
        coupon: {

            // 优惠券列表
            coupon_list: null,

            // 领取优惠券
            get_coupon: function(coupon_sn) {

                ajax({
                    type: 'post',
                    url: config.url + 'background/user_center/get_coupon',
                    data: {
                        coupon_sn: coupon_sn,                  // 优惠券编码
                        token: member.token
                    },
                    dataType: 'json',
                    beforeSend: function() {
                        popup.loading('show');
                    },
                    success: function(data) {
                        popup.loading('hide');

                        // 更新优惠券状态
                        var coupon_list = vmProductDetail.coupon.coupon_list.concat();

                        var coupon = null;

                        // 剩余优惠券数量
                        var surplus = 0;

                        coupon_list.forEach(function(item) {
                            if(coupon_sn == item.coupon_sn){
                                coupon = item;
                            }
                        });

                        vmProductDetail.coupon.coupon_list = coupon_list;

                        if(data && data.code == 200){

                            coupon.got_num = Number(coupon.got_num) + 1;
                            surplus = coupon.user_limit - coupon.got_num;
                            coupon.is_over_bring_limit = surplus < 1;

                            popup.success('领取成功！');

                        } else if (data && data.code == 31006) {

                            // 已经领取过该优惠券
                            coupon.is_over_bring_limit = true;
                            popup.error(data.message);

                        } else if (data && data.code == 31011) {

                            // 优惠券已领取完
                            coupon.is_over = true;
                            popup.error(data.message);

                        } else if (data && data.code == 201) {

                            popup.confirm('您还未登录，是否前往登录？', function() {
                                window.location = '/login.html?redirect=' + encodeURIComponent('/product/' + productId + '.html');
                            });

                        } else if(!data || data.code != 100006) {

                            popup.error(data ? data.message : this.url + ' Error');

                        }

                    },
                    error: function() {
                        popup.error(this.url + ' Error');
                    }
                });

            }
        },

        // 收藏
        collect: {

            // 是否收藏
            is_collect: false,

            // 加入收藏
            add_collect: function() {

                if(!vmProductDetail.collect.is_collect){
                    // 收藏
                    userCollect(1);
                } else {
                    // 取消收藏
                    userCollect(3);
                }

            }
        },

        // 显示/隐藏评价图片查看弹窗
        show_comment_img: false,
        // 评价图片列表
        comment_img: [],
        // 评价图片当前index
        comment_img_index: 0,
        // 关闭图片查看
        close_comment_img: function() {
            vmProductDetail.show_comment_img = false;
            vmProductDetail.comment_img = null;
            vmProductDetail.comment_img_index = 0;
        },

        // 显示海外购税费
        show_tax: false,
        toggle_tax: function(toggle) {
            vmProductDetail.show_tax = !!Number(toggle || 0);
        },

        // 显示多品规选择
        show_type: false,
        toggle_type: function(toggle) {
            vmProductDetail.show_type = !!Number(toggle || 0);
        },

        // 显示海外购服务弹窗
        show_service: false,
        toggle_service: function(toggle) {
            vmProductDetail.show_service = !!Number(toggle || 0);
        },

        // 显示优惠券弹窗
        show_coupon: false,
        toggle_coupon: function(toggle) {
            vmProductDetail.show_coupon = !!Number(toggle || 0);
        },

        // 显示促销列表弹窗
        show_promotion: false,
        toggle_promotion: function(toggle) {
            vmProductDetail.show_promotion = !!Number(toggle || 0);
        },

        // 显示药师咨询弹窗
        show_reception: false,
        toggle_reception: function(toggle) {
            var is_show = !!Number(toggle || 0);
            if(is_show) {
                vmProductDetail.show_type = !is_show;
            }
            vmProductDetail.show_reception = is_show;
        },

        // 关闭所有遮罩弹窗
        close_popup: function() {
            vmProductDetail.show_comment_img = false;
            vmProductDetail.show_tax = false;
            vmProductDetail.show_type = false;
            vmProductDetail.show_service = false;
            vmProductDetail.show_coupon = false;
            vmProductDetail.show_promotion = false;
            vmProductDetail.show_reception = false;
            vmProductDetail.show_contact = false;
        },

        // 请药师联系我
        show_contact: false,
        //  错误信息
        show_contact_msg: '',
        // 联系号码
        contact_no: '',
        // 保存联系方式
        save_contact: function() {

            // 监测代码
            try{
                ga('send', 'event', '药师回拨', document.getElementById("callMeTel").value, window.location.pathname.replace(/[^\d]/g,''));
            } catch (e){}

            var contact_no = vmProductDetail.contact_no;

            // 保存联系方式
            if(contact_no){
                if(!/^1[3|4|5|7|8][0-9]\d{8,8}$/.test(contact_no)){
                    vmProductDetail.show_contact_msg = '请填写正确的手机号码！';
                } else {

                    vmProductDetail.show_contact_msg = '';

                    ajax({
                        type: 'post',
                        url: config.url + 'background/product/phone_call_back',
                        data: {
                            recall: contact_no,                 // 回访电话号码
                            gid: productId,                // 咨询商品id
                            token: member.token
                        },
                        dataType: 'json',
                        beforeSend: function() {
                            popup.loading('show');
                        },
                        success: function(data) {
                            popup.loading('hide');

                            popup.success(data ? data.message : this.url + ' Error', function() {
                                vmProductDetail.show_contact = false;
                                vmProductDetail.contact_no = '' ;

                            });

                        },
                        error: function() {
                            popup.error(this.url + ' Error');
                        }
                    });

                }
            } else {
                vmProductDetail.show_contact_msg = '请输入您的手机号！';
            }
        },
        toggle_contact: function(toggle) {
            var is_show = !!Number(toggle || 0);
            if(is_show) {
                vmProductDetail.show_reception = !is_show;
            }
            vmProductDetail.show_contact = is_show;

        },

        // 是否在同一页面显示商品详情
        is_show_detail: isShowDetail ,

        //为你推荐 数据
        recommend_data: []

    });


    // 套餐滑动控件       为你推荐
    exbind.register('group-swipe', 'load', function() {
        var node = this,
            listElem = node.children[0],
            wrapWidth = node.offsetWidth,
            scrollWidth = listElem.scrollWidth,
            scrollDiff = 0;

        node.addEventListener('swipeLeft', function(e) {
            e.stopPropagation();
            e.preventDefault();
        }).addEventListener('swipeRight', function(e) {
            e.stopPropagation();
            e.preventDefault();
        }).addEventListener('swipe', function(e) {
            var point = e.data;
            var pointX = point.diffX.keys(0);
            var pointY = point.diffY.keys(0);

            if(Math.abs(pointX) > Math.abs(pointY)){
                e.stopPropagation();
                e.preventDefault();

                listElem.style.transform =
                    listElem.style.webkitTransform =
                        'translateX(' + (pointX - scrollDiff) + 'px)';
            }

        }).addEventListener('swipeEnd', function(e) {
            scrollDiff = scrollDiff - e.data.diffX.keys(0);

            if(scrollDiff < 0 ){
                scrollDiff = 0;
            } else if(scrollDiff + wrapWidth > scrollWidth) {
                scrollDiff = scrollWidth - wrapWidth ;
                scrollDiff = scrollDiff > 0 ? scrollDiff : 0 ;
            }

            listElem.style.transform = listElem.style.webkitTransform = 'translateX(' + (-scrollDiff) + 'px)';
        });
    });


    // 下拉加载评价列表
    exbind.register('comment', 'load', function() {
        var scrollWrap = this,
            winHeight = window.innerHeight + 100,
            scrollLock = false,
            timer;

        scrollWrap.addEventListener('scroll', function () {

            if(!scrollLock){
                clearTimeout(timer);

                timer = setTimeout(function() {
                    if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight &&
                       vmProductDetail.comment.pageCount > vmProductDetail.comment.pageStart){
                        vmProductDetail.comment.pageStart = vmProductDetail.comment.pageStart + 1;
                        scrollLock = true;
                        getProductComment(function() {
                            scrollLock = false;
                        });
                    }
                }, 20);

            }
        });

    });

    // 促销倒计时
    exbind.register('count-down', 'load', function(e) {
        var elem = this,
            timeCount = Number(e.param.time) * 1000,
            format = e.param.format;

        if (timeCount && timeCount > 0) {
            var timer = null;

            var day = 0;
            var hour = 0;
            var minutes = 0;
            var seconds = 0;
            var setTimeCountDown = function() {
                timeCount -= 1000;

                day = Math.floor(timeCount / 86400000);
                hour = Math.floor((timeCount % 86400000) / 3600000);
                minutes = Math.floor((timeCount % 3600000) / 60000);
                seconds = Math.floor((timeCount % 60000) / 1000);

                elem.innerHTML =  format
                    .replace(/D+/g, day < 10 ? '0' + day: day)
                    .replace(/H+/g, hour < 10 ? '0' + hour: hour)
                    .replace(/M+/g, minutes < 10 ? '0' + minutes: minutes)
                    .replace(/S+/g, seconds < 10 ? '0' + seconds: seconds);

                if(timeCount <= 0) {
                    clearInterval(timer);
                }
            };

            if (timeCount > 0) {
                timer = setInterval(setTimeCountDown, 1000);
                setTimeCountDown();
            }
        }

    });


    /* 商品详情页
    * ****************************/
    router.register('', (function() {

        var isReady = false;

        return function() {
            if(!isReady) {
                isReady = true;

                if(!vmProductDetail.info){

                    // 获取商品详情
                    getProductInfo();


                }

                //为你推荐
                getRecommendData();

                // 添加足迹
                userCollect(2);

                // 获取购物车数量
                ajax({
                    type: 'post',
                    url: config.url + 'background/cart/shopping_cart',
                    data: {
                        token: member.token
                    },
                    dataType: 'json',
                    success: function(data) {
                        if(data && data.code == 200) {
                            vmProductDetail.cart_num = Number(data.data.totalQty);
                        }
                    }
                });

            }


        };
    })(), 1);


    /* 套餐列表页
    * ****************************/
    router.register('?package', (function() {

        return function() {

            if(!vmProductDetail.info){

                // 获取商品详情
                getProductInfo();

            }
        };

    })());


});
