/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/20 020
 * @description 购物车
 */

define('yxy-shopping-car',['ajax', 'member', 'popup', 'exbind', 'widget', 'mvvm', 'public', 'router'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var exbind = require('exbind');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var Public = require('public');
    var router = require('router');

    //MVVM.template.helper('console', console);

    var body = document.body;

    var config = window.Config;
    //var platform = config.platform;

    // 延时计时器，防止用户狂操作
    var select_timer, num_timer;

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

    // 页面弹窗的时候fix禁止页面滚动
    var fixPage = function(is_fix) {
        if(!!is_fix){
            document.documentElement.classList.add('fixed-popup');
        } else {
            document.documentElement.classList.remove('fixed-popup');
        }
    };

    // 更新购物车列表
    var updateCart = function(data) {
        var allGoods = {};   // 所有商品
        var globalGoods = {};   // 海外购商品列表
        var shopGoods = {};     // 普通商品列表

        var allGlobalList = [];    // 所有可删除的海外购商品列表
        var allShopList = [];    // 所有可删除的普通商品列表

        // 遍历商品列表
        if(data.globalCart && data.globalCart.goodsList && data.globalCart.goodsList.length) {
            data.globalCart.goodsList.forEach(function(goods) {
                if(goods.goods_status == 0) {
                    // 将商品存入字典
                    goods.selected -= 0;
                    globalGoods[goods.goods_id] = goods;
                }

                allGoods[goods.goods_id] = goods;
                allGlobalList.push(goods.goods_id);
            });

        }

        if(data.shoppingCart && data.shoppingCart.moduleList && data.shoppingCart.moduleList.length) {
            data.shoppingCart.moduleList.forEach(function(goods) {

                goods.goodsList.forEach(function(goodsItem) {
                    goodsItem.selected -= 0;

                    var goodsId = goodsItem.group_id && goodsItem.group_id != 0 ? goodsItem.group_id : goodsItem.goods_id;

                    // 将商品存入字典
                    if(goodsItem.group_id && goodsItem.group_status == 1) {
                        shopGoods[goodsItem.group_id] = goodsItem;
                    } else if(goodsItem.goods_id && goodsItem.goods_status == 0) {
                        shopGoods[goodsItem.goods_id] = goodsItem;
                    }

                    allGoods[goodsId] = goodsItem;
                    allShopList.push(goodsId);

                });

            });

        }

        // 商品选择信息
        vmCart.goods_list.all_selected = Number(data.allSelected);
        vmCart.goods_list.global_selected = Number(data.globalCart.allSelected);
        vmCart.goods_list.shop_selected = Number(data.shoppingCart.allSelected);
        vmCart.goods_list.all_goods = allGoods;
        vmCart.goods_list.global_goods = globalGoods;
        vmCart.goods_list.shop_goods = shopGoods;
        vmCart.goods_list.all_global_list = allGlobalList;
        vmCart.goods_list.all_shop_list = allShopList;

        // 购物车信息
        vmCart.cart = data;

    };

    // 根据sku列表生成商品spu筛选信息
    var createSKUList = function(data, spu_id, sku_id) {

        var skuList = {};      // 商品 - id 键值列表
        var skuIdList = [];    // 商品id列表

        var spuList = {};      // 属性 - id 键值列表
        var spuIdList = [];    // 属性id列表

        var tempSpu = {};          // 属性分组列表
        var spuSelectOption = {};   // 属性分组数组

        // spu属性id，用于二进制计算，使用字符串模拟二进制
        var id = '1';

        // 清除已选spu
        vmCart.spu.selected = {};

        if(data && Public.isObject(data.skuData)){

            Public.forEachIn(data.skuData, function(key, product) {

                // 是否是当前sku
                var isCurrent = vmCart.spu.old_goods_id == product.sku_id;

                if(isCurrent){
                    // 当前商品
                    vmCart.spu.sku_info = product;
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
                            if(isCurrent && !tempSpu[rule.name][rule.value].selected){
                                tempSpu[rule.name][rule.value].selected = isCurrent;
                            }
                            if(tempSpu[rule.name][rule.value].selected){
                                vmCart.spu.selected[rule.name] = tempSpu[rule.name][rule.value].id;
                            }

                            // sku属性的二进制id取或值得到sku id
                            product.selected_id = or(product.selected_id, tempSpu[rule.name][rule.value].id);

                        }
                    });

                    skuList[product.selected_id] = product;

                    skuIdList.push(product.selected_id);

                }

            });


            vmCart.spu.sku_list = skuList;         // 商品 - id 键值列表
            vmCart.spu.sku_id_list = skuIdList;    // 商品id列表
            vmCart.spu.spu_list = spuList;         // 属性 - id 键值列表
            vmCart.spu.spu_id_list = spuIdList;    // 属性id列表
            vmCart.spu.spu_select_option = spuSelectOption;   // 属性分组数组

        } else {

            var goodsInfo = vmCart.goods_list.shop_goods[sku_id] || vmCart.goods_list.global_goods[sku_id];

            if(goodsInfo) {
                // 没有 spu 的时候假装有 spu
                var product = {
                    small_path: goodsInfo.goods_image,
                    sku_id: sku_id,
                    goods_price: goodsInfo.discount_price,
                    stock: goodsInfo.stock,
                    goods_status: goodsInfo.goods_status,
                    rules: [{
                        name: '&nbsp;',
                        value: goodsInfo.goods_name
                    }]
                };


                // 当前商品
                vmCart.spu.sku_info = product;

                // 商品 - id 键值列表
                vmCart.spu.sku_list = {
                    '1': product
                };

                // 商品id列表
                vmCart.spu.sku_id_list = ['1'];

                // 属性 - id 键值列表
                vmCart.spu.spu_list = {
                    '1': {
                        hide: false,
                        id: "1",
                        name: "&nbsp;",
                        selectable: true,
                        selected: true,
                        value: goodsInfo.goods_name
                    }
                };

                // 属性id列表
                vmCart.spu.spu_id_list = ['1'];

                // 属性分组数组
                vmCart.spu.spu_select_option = {
                    '&nbsp;': [vmCart.spu.spu_list['1']]
                };

            }

        }


        // 更新spu选择状态/更新商品信息
        updateSkuState();

    };

    // 更新spu选择状态/更新商品信息
    var updateSkuState = function() {

        var selected = vmCart.spu.selected;       // 可选的商品列表
        var skuIdList = vmCart.spu.sku_id_list;   // 可选的商品id列表
        var spuList = vmCart.spu.spu_list;        // 可选的spu列表
        var spuIdList = vmCart.spu.spu_id_list;   // 可选的spu二进制ID列表

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

        vmCart.spu.selected = selected;

        // 返回当前条件的筛选id
        return selectedId;

    };

    // 获取购物车列表
    var getCartList = function() {
        ajax({
            type: 'post',
            url: config.url + 'background/cart/shopping_cart',
            data: {
                token: member.token
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200) {

                    updateCart(data.data);

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });
    };

    // 修改商品选择状态
    var selectGoods = function(type, id, selected) {
        var url, param = {
            selected: selected, // 选择状态  取值：0，1
            token: member.token
        };

        // type all-全部普通商品或全部海外购商品或全部商品，group-单个套餐，goods-单品
        if(type == 'all'){
            url = config.url + 'background/cart/select_cart_all';
            param.type = id;
        } else if(type == 'group'){
            url = config.url + 'background/cart/select_cart_group';
            param.group_id = id;
        } else if(type == 'goods'){
            url = config.url + 'background/cart/select_cart_goods';
            param.goods_id = id;
        }

        ajax({
            type: 'post',
            url: url,
            data: param,
            dataType: 'json',
            success: function(data) {

                if(data && data.code == 200) {

                    updateCart(data.data);

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error', getCartList);
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 修改商品数量
    var editGoodsNum = function(id, num, is_group) {
        var url, param = {
            token: member.token
        };

        if(is_group){
            // 修改套餐数量
            url = config.url + 'background/cart/edit_cart_group_number';
            param.group_id = id;        // 套餐id
            param.group_number = num;   // 设置套餐的数量
        } else {
            // 修改单个商品数量
            url = config.url + 'background/cart/edit_cart_goods_number';
            param.goods_id = id;        // 商品id
            param.goods_number = num;        // 设置商品的数量
        }

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

                if(data && data.code == 200) {

                    updateCart(data.data);

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error', getCartList);
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });


    };

    // 切换优惠活动
    var switchPromotion = function(promotion_ids, goods_id) {
        ajax({
            type: 'post',
            url: config.url + 'background/cart/switch_promotion',
            data: {
                goods_id: goods_id || '', // 商品ID，如果不为空表示商品的切换优惠，为空表示全场的切换优惠
                promotion_ids: promotion_ids, // 选中的活动id，多个选中活动用逗号隔开
                token: member.token // token校验
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200) {

                    updateCart(data.data);
                    popup.success('切换成功！');

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 批量删除商品
    var removeGoods = function(goods, group) {
        var param = {
            goods_id_list: '',    // 商品id数组
            group_id_list: '',    // 套餐id数组
            token: member.token
        };

        // 普通商品列表
        if(goods && goods.length) {
            param.goods_id_list = goods;
        }

        // 套餐列表
        if(group && group.length) {
            param.group_id_list = group;
        }

        ajax({
            type: 'post',
            url: config.url + 'background/cart/batch_remove_cart_good',
            data: param,
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200) {

                    updateCart(data.data);
                    popup.success('删除成功！');

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error', getCartList);
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });
    };

    // 获取多品规信息
    var getSkuRule = function(spu_id, sku_id) {
        ajax({
            type: 'post',
            url: config.url + 'background/cart/get_sku_rule_all',
            data: {
                spu_id: spu_id, // spu id
                sku_id: sku_id, // 商品ID
                token: member.token
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200) {

                    // 保存旧的商品id，用于切换品规
                    vmCart.spu.old_goods_id = sku_id;
                    createSKUList(data.data, spu_id, sku_id);

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 商品切换品规
    var modifyGoodsSku = function(goods_id, old_goods_id) {
        ajax({
            type: 'post',
            url: config.url + 'background/cart/change_cart_goods',
            data: {
                goods_id: goods_id, // 商品ID
                old_goods_id: old_goods_id, // 旧商品ID
                token: member.token
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200) {

                    updateCart(data.data);
                    popup.success('修改成功！');

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 获取凑单促销列表
    var getPromotionList = function(callback) {
        var param = vmCart.promotion.param;
        var downPrice = parseFloat(param.down_price);     // 最低价
        var upPrice = parseFloat(param.up_price);           // 最高价

        if(isNaN(downPrice)){
            downPrice = '';
        }

        if(isNaN(upPrice)){
            upPrice = '';
        }

        if(/^\d+$/.test(downPrice) && /^\d+$/.test(upPrice) && downPrice > upPrice){
            var temp = downPrice;
            downPrice = upPrice;
            upPrice = temp;
        }

        param.down_price = downPrice;
        param.up_price = upPrice;

        var searchAttr = param.search_attr.filter(function(item) {
            return !!item && item.length;
        }).map(function(arr) {
            if(Array.isArray(arr)){
                return arr.filter(function(item) {
                    return !!item;
                }).join(',')
            } else {
                return arr;
            }
        }).join('_');


        ajax({
            type: 'post',
            url: config.url + 'background/cart/get_promotion_goods_list',
            data: {
                promotionId: vmCart.promotion.promotion_id,    // 促销活动id
                pageStart: param.page_start,              // 当前页码 默认 : 1
                pageSize: param.page_size,               // 每页条数 默认 : 30
                searchAttr: searchAttr,             // 搜索的属性名称 多个用英文逗号隔开
                type: param.type,                   // 排序 默认是综合排序 综合排序：all；人气： hot; 销量：sales；价格：price；
                typeStatus: param.type_status,             // 排序 状态 0降序 1升序
                downPrice: downPrice,              // 开始价格
                upPrice: upPrice,                 // 结束价格
                token: member.token
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(!vmCart.promotion.list_data){
                    vmCart.promotion.list_data = [];
                }

                if(data && data.data) {

                    // 筛选条件列表
                    if(data.data.attrName && data.data.attrName.length){
                        // 将筛选条件分割成名称和ID
                        data.data.attrName.forEach(function(attr) {

                            if(attr && attr.attrValue && attr.attrValue.length){
                                attr.attrValue = attr.attrValue.map(function(item) {

                                    var arr = item.split(',')[0].split('_');

                                    if(arr.length == 2){
                                        return {
                                            name: arr[0],
                                            id: arr[1]
                                        }
                                    } else {
                                        return item;
                                    }

                                });
                            }

                        });

                        vmCart.promotion.attr_name = data.data.attrName;

                    }

                    if(data.data.changeGroup && data.data.changeGroup.length){
                        // 换购商品列表
                        vmCart.promotion.change_group = data.data.changeGroup;
                    }
                    if(data.data.promotionInfo){
                        // 优惠信息
                        vmCart.promotion.promotion_info = data.data.promotionInfo;
                        vmCart.promotion.bought_number = Number(data.data.promotionInfo.bought_number); // 已选购价格
                        vmCart.promotion.lack_number = Number(data.data.promotionInfo.lack_number);     // 还差的金额
                        vmCart.promotion.unit = data.data.promotionInfo.unit;     // 购买的单位（元/件）
                        vmCart.promotion.isCanUse =  data.data.promotionInfo.isCanUse ;  //是否可换购
                    }

                    if(!vmCart.promotion.data_page[param.page_start]){
                        vmCart.promotion.data_page[param.page_start] = true;

                        if(data.data.pageCount){
                            // 商品总页数
                            vmCart.promotion.param.page_count = Number(data.data.pageCount);
                        }

                        if(data.data.listData && data.data.listData.length){
                            // 促销商品列表
                            vmCart.promotion.list_data = vmCart.promotion.list_data.concat(data.data.listData);

                            callback && callback();
                        }


                    }

                } else {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });
    };

    // 加入购物车
    var addToCart = function(goods_id, callback) {
        ajax({
            type: 'post',
            url: config.url + 'background/cart/product_add_to_cart',
            data: {
                goods_id: goods_id,             // 商品id
                goods_number: 1,               // 加入购物车的商品数量
                token: member.token
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200){
                    popup.success('加入购物车成功！', callback);
                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 换购
    var addIncreaseBuy = function(goods_id, increase_buy) {
        ajax({
            type: 'post',
            url: config.url + 'background/cart/add_increase_buy',
            data: {
                goods_id: goods_id || 0,             // 商品ID
                increase_buy: increase_buy,     // 换购活动ID
                token: member.token
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');

                if(data && data.code == 200){
                    popup.success('换购成功！', getPromotionList);
                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 获取推荐商品列表
    var goodsRecommend = function(callback) {
        ajax({
            type: 'post',
            url: config.url + 'background/product/goods_hot_recommended',
            data: {
                pageStart: vmCart.commend.page_start,       // 推荐或热门(Recommend/hot)
                pageSize: vmCart.commend.page_size,          // 当前页(默认1)
                data: vmCart.commend.data,           // 获取条数(默认5)
                yukon:1,							//只加载育学园商品
                token: member.token
            },
            dataType: 'json',
            success: function(data) {

                if(data && data.code == 200){
                    if(data.data.goods && data.data.goods.length){
                        vmCart.commend.commend_list = vmCart.commend.commend_list.concat(data.data.goods);
                    }
                    vmCart.commend.page_count = data.data.pageCount;

                    callback && callback();

                } else if(!data || data.code != 100006) {
                    popup.error(data ? data.message : this.url + ' Error');
                }

            },
            error: function() {
                popup.error(this.url + ' Error');
            }
        });

    };

    // 购物车列表
    var vmCart = MVVM.define('cart-list', {

        // 购物车列表
        cart: null,

        // 商品/套餐列表
        goods_list: {

            // 是否全选
            all_selected: 0,

            // 海外购商品是否全选
            global_selected: 0,

            // 普通商品是否全选
            shop_selected: 0,

            // 所有商品
            all_goods: {},

            // 海外购商品列表
            global_goods: {},

            // 普通商品列表
            shop_goods: {},

            // 删除是否全选
            del_all: 0,

            // 删除海外购商品是否全选
            del_global: 0,

            // 删除普通商品是否全选
            del_shop: 0,

            // 所有可删除的海外购商品列表
            all_global_list: [],

            // 所有可删除的普通商品列表
            all_shop_list: [],

            // 已选择删除的海外购商品列表
            del_global_list: [],

            // 已选择删除的普通商品列表
            del_shop_list: [],

            // 重置删除选择状态
            reset_select: function() {
                vmCart.goods_list.del_all = '';
                vmCart.goods_list.del_global = '';
                vmCart.goods_list.del_shop = '';
                vmCart.goods_list.del_global_list = [];
                vmCart.goods_list.del_shop_list = [];
            }

        },

        // 选择/取消选择
        set_select: function(type, id, is_selected) {
            if(!vmCart.is_edit){
                // type all-全部普通商品或全部海外购商品或全部商品，group-单个套餐，goods-单品
                var selected = Number(!Number(is_selected));
                var goods_list = vmCart.goods_list;

                if(type == 'all'){
                    // 如果是全选

                    if(id == 0){
                        // 全选/取消全选普通商品
                        goods_list.shop_selected = selected;
                        // 是否全选
                        goods_list.all_selected = Number(goods_list.shop_selected && goods_list.global_selected);
                    }
                    if(id == 1){
                        // 全选/取消全选海外购商品
                        goods_list.global_selected = selected;
                        // 是否全选
                        goods_list.all_selected = Number(goods_list.shop_selected && goods_list.global_selected);
                    }
                    if(id == 2){
                        // 全选/取消全选所有商品
                        goods_list.all_selected =
                            goods_list.global_selected =
                                goods_list.shop_selected = selected;
                    }

                    if(id != 0){
                        // 全选/取消全选海外购商品
                        Public.forEachIn(goods_list.global_goods, function(id, value) {
                            goods_list.global_goods[id].selected = selected;
                        });
                    }
                    if(id != 1){
                        // 全选/取消全选普通商品
                        Public.forEachIn(goods_list.shop_goods, function(id, value) {
                            goods_list.shop_goods[id].selected = selected;
                        });
                    }

                } else {

                    // 选择单品或套餐
                    if(id in goods_list.global_goods){

                        // 修改单个商品选择状态
                        goods_list.global_goods[id].selected = selected;

                        if(selected == 0) {
                            // 取消当前分类全选
                            goods_list.global_selected = selected;
                        } else {
                            // 判断当前分类是否全选
                            var global_selected = 1;
                            Public.forEachIn(goods_list.global_goods, function(id, goods) {
                                if(!goods.selected){
                                    global_selected = 0;
                                }
                            });
                            goods_list.global_selected = global_selected;
                        }

                    } else if(id in goods_list.shop_goods) {
                        // 修改单个商品选择状态
                        goods_list.shop_goods[id].selected = selected;

                        if(selected == 0) {
                            // 取消当前分类全选
                            goods_list.shop_selected = selected;
                        } else {
                            // 判断当前分类是否全选
                            var shop_selected = 1;
                            Public.forEachIn(goods_list.shop_goods, function(id, goods) {
                                if(!goods.selected){
                                    shop_selected = 0;
                                }
                            });
                            goods_list.shop_selected = shop_selected;
                        }
                    }

                    // 是否已经全选
                    goods_list.all_selected = Number(goods_list.shop_selected && goods_list.global_selected);

                }

                // 触发页面样式修改
                vmCart.__update__();

                // 将修改结果发送到后台
                clearTimeout(select_timer);
                select_timer = setTimeout((function(type, id, selected) {
                    return function() {
                        selectGoods(type, id, selected);
                    }
                })(type, id, selected), 300);
            }
        },

        // 设置商品数量
        set_num: function(id, num) {
            // 商品字典
            var goods_list = vmCart.goods_list;
            // 当前修改的商品
            var goods = goods_list.shop_goods[id] || goods_list.global_goods[id];

            if(goods) {

                // 是否是套餐
                var is_group = goods.groupGoodsList && goods.groupGoodsList.length;

                // 商品数量
                var goods_num = Number(is_group ? goods.group_number : goods.goods_number);

                if(isNaN(goods_num)){
                    goods_num = 1;
                }

                // 商品库存
                var stock = Number(is_group ? goods.group_stock : goods.stock);

                if(isNaN(stock) || stock > 200){
                    stock = 200;
                }

                goods_num += (Number(num) || 0);

                if(goods_num < 1){
                    goods_num = 1;
                }
                if(goods_num > stock){
                    goods_num = stock;
                }

                if((is_group && goods.group_number != goods_num) || (!is_group && goods.goods_number != goods_num) || num == 0){
                    is_group ? goods.group_number = goods_num : goods.goods_number = goods_num;

                    // 触发页面样式修改
                    vmCart.__update__();

                    // 将修改结果发送到后台
                    clearTimeout(num_timer);
                    num_timer = setTimeout((function(id, num, is_group) {
                        return function() {
                            editGoodsNum(id, num, is_group);
                        }
                    })(id, goods_num, is_group), 1000);
                }

            }
        },

        // 编辑模式
        is_edit: false,

        // 打开/关闭编辑模式
        edit: function() {
            vmCart.is_edit = !vmCart.is_edit;
            if(vmCart.is_edit){
                // 清空已选择删除的商品
                vmCart.goods_list.reset_select();
            }
        },

        // 编辑状态选择/取消选择
        set_delete_state: function(type) {
            // type 0 全选 1 海外购全选 2 百洋全选 3 海外购单品 4 百洋单品

            setTimeout(function() {

                var allGlobalList = vmCart.goods_list.all_global_list;         // 待删除的商品id数组
                var allShopList = vmCart.goods_list.all_shop_list;         // 待删除的商品id数组

                var delGlobalList = vmCart.goods_list.del_global_list;         // 已选择删除的海外购商品列表
                var delShopList = vmCart.goods_list.del_shop_list;         // 已选择删除的普通商品列表

                if(vmCart.is_edit) {

                    if(type == 0){
                        // 全选
                        if(vmCart.goods_list.del_all) {
                            delGlobalList = allGlobalList.concat();
                            delShopList = allShopList.concat();
                            vmCart.goods_list.del_global = 1;
                            vmCart.goods_list.del_shop = 1;
                        } else {
                            delGlobalList = [];
                            delShopList = [];
                            vmCart.goods_list.del_global = 0;
                            vmCart.goods_list.del_shop = 0;
                        }

                    } else if(type == 1) {

                        // 海外购全选
                        if(vmCart.goods_list.del_global){
                            delGlobalList = allGlobalList.concat();
                        } else {
                            delGlobalList = [];
                        }

                    } else if(type == 2) {

                        // 百洋全选
                        if(vmCart.goods_list.del_shop){
                            delShopList = allShopList.concat();
                        } else {
                            delShopList = [];
                        }

                    } else if(type == 3) {

                        // 海外购单品
                        vmCart.goods_list.del_global = Number(allGlobalList.length == delGlobalList.length);

                    } else if(type == 4) {
                        // 百洋单品
                        vmCart.goods_list.del_shop = Number(allShopList.length == delShopList.length);
                    }

                    vmCart.goods_list.del_all = Number(vmCart.goods_list.del_global && vmCart.goods_list.del_shop);

                    vmCart.goods_list.del_global_list = delGlobalList;
                    vmCart.goods_list.del_shop_list = delShopList;
                }

            }, 50);

        },

        // 删除单个商品
        delete_goods: function(is_group, id) {
            if(is_group){
                removeGoods(null, [id]);
            } else {
                removeGoods([id]);
            }
        },

        // 推荐商品
        commend: {
            page_start: 1,              // 当前页码 默认 : 1
            page_size: 10,              // 每页条数 默认 : 30
            page_count: 0,              // 总页数
            data: 'Recommend',          // 推荐或热门(Recommend/hot)

            // 商品列表
            commend_list: [],

            // 加入购物车
            add_to_cart: function(id) {
                addToCart(id, getCartList);
                vmCart.is_edit = false;
            }
        },

        // 点击显示切换优惠弹窗
        switch_promotion: function(promotion, id) {
            if(promotion){
                vmCart.discount_info.goods_id = id;                 // 商品id，没有则切换全场优惠
                vmCart.discount_info.promotion = promotion;       // 优惠信息
                vmCart.selected_discount.length = 0;             // 清空已选择的优惠
                vmCart.toggle_discount(true);
            }
        },

        // 多品规选择
        spu: {
            // 当前编辑的商品skuID
            old_goods_id: null,

            // 当前选中的商品skuID
            goods_id: null,

            // 当前选中的品规信息
            sku_info: null,

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
                var selected = vmCart.spu.selected;
                var skuList = vmCart.spu.sku_list;
                var spuList = vmCart.spu.spu_list;
                var skuIdList = vmCart.spu.sku_id_list;


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

                    // 当前筛选条件的合并二进制ID
                    var selectedId = updateSkuState();


                    // 当前筛选出来的商品
                    if(skuList[selectedId]) {

                        vmCart.spu.sku_info = skuList[selectedId];

                        // 刷新当前商品信息
                        vmCart.spu.goods_id = skuList[selectedId].sku_id;

                    }

                }

            },

            // 点击修改商品sku
            modify_spu: function() {
                if(vmCart.spu.goods_id){
                    modifyGoodsSku(vmCart.spu.goods_id, vmCart.spu.old_goods_id);
                    vmCart.toggle_type(false);
                }
            }
        },

        // 点击获取商品spu
        switch_spu: function(skuId, spuId) {
            if(vmCart.is_edit){
                vmCart.toggle_type(true);
                getSkuRule(spuId, skuId);
            }
        },

        // 多品规选择
        show_type: false,
        toggle_type: function(is_show) {
            vmCart.show_type = !!is_show;
            fixPage(!!is_show);
        },

        // 待切换的优惠信息
        discount_info: {
            goods_id: null,       // 商品id，没有则切换全场优惠
            promotion: null       // 优惠信息
        },
        // 已选中的优惠id
        selected_discount: [],
        // 切换优惠弹窗控制
        show_discount: false,
        toggle_discount: function(is_show) {
            vmCart.show_discount = !!is_show;
            fixPage(!!is_show);
        },
        // 点击切换优惠
        switch_discount: function() {
            if(vmCart.selected_discount.length){
                switchPromotion(vmCart.selected_discount.join(','), vmCart.discount_info.goods_id);
                vmCart.toggle_discount(false);
            } else {
                popup.error('请选择切换的优惠！');
            }
        },

        // 重新换购弹窗控制
        show_switch: false,
        toggle_switch: function(is_show) {
            vmCart.show_switch = !!is_show;
            fixPage(!!is_show);
        },

        // 分开结算弹窗控制
        show_checkout: false,
        toggle_checkout: function(is_show) {
            vmCart.show_checkout = !!is_show;
            fixPage(!!is_show);
        },

        // 搜索弹窗弹窗控制
        show_filter: false,

        // 显示/隐藏筛选菜单
        toggle_filter: function(is_show) {
            vmCart.show_filter = !!is_show;
            fixPage(!!is_show);
        },

        // 关闭所有遮罩弹窗
        close_popup: function() {
            vmCart.show_type = false;
            vmCart.show_discount = false;
            vmCart.show_switch = false;
            vmCart.show_checkout = false;
            vmCart.show_filter = false;
            fixPage(false);
        },

        // 促销/换购
        promotion: {
            // 换购活动id
            promotion_id: '',

            // 已购买数量
            bought_number: 0,

            // 还差数量
            lack_number: 0,

            // 购买的单位（元/件）
            unit: 0,

            // 换购活动请求参数
            param: {
                page_start: '',             // 当前页码 默认 : 1
                page_size: 10,              // 每页条数 默认 : 30
                search_attr: [],            // 搜索的属性名称 多个用英文逗号隔开
                type: 'all',                // 排序 默认是综合排序 综合排序：all；人气： hot; 销量：sales；价格：price；
                type_status: 0,             // 排序 状态 0降序 1升序
                down_price: '',             // 开始价格
                up_price: '',               // 结束价格
                page_count: 0               // 总页数
            },

            // 跳转到促销列表页
            get_list: function(id) {
                vmCart.promotion.promotion_id = id;

                // 跳转到促销列表页
                router.route('?promotion#id=' + id);
            },

            // 筛选/排序
            filter: function(type) {
                var param = vmCart.promotion.param;

                if(!type || (type && (type != param.type || (type == param.type && !/^all|sales$/.test(type))))){

                    if(type){
                        // 点击修改排序
                        if(param.type == type){
                            if(!/^all|sales$/.test(type)){
                                vmCart.promotion.param.type_status = Number(!Number(param.type_status));
                            }
                        } else {
                            vmCart.promotion.param.type = type;
                            vmCart.promotion.param.type_status = 0;
                        }
                    } else {
                        // 按筛选条件获取商品列表
                        vmCart.promotion.param.type = 'all';
                        vmCart.promotion.param.type_status = 0;

                        vmCart.toggle_filter(false);
                    }

                    // 重置促销商品信息
                    vmCart.promotion.param.page_start = 1;
                    vmCart.promotion.param.page_count = 0;

                    vmCart.promotion.list_data = null;
                    vmCart.promotion.data_page = {};

                    getPromotionList();

                }

            },

            // 重置搜索信息
            reset: function() {
                vmCart.promotion.param.search_attr = [];
                vmCart.promotion.param.down_price = '';
                vmCart.promotion.param.up_price = '';

                vmCart.toggle_filter(false);
                getPromotionList();
            },

            // 加入购物车
            add_to_cart: function(id) {

                addToCart(id, getPromotionList);
            },

            // 确定换购
            switch_buy: function() {
                if(vmCart.promotion.change_goods != vmCart.promotion.old_change_goods){
                    vmCart.promotion.old_change_goods = vmCart.promotion.change_goods;
                    addIncreaseBuy(vmCart.promotion.change_goods, vmCart.promotion.promotion_id);
                    vmCart.toggle_switch();
                }
            },

            // 促销商品列表
            list_data: null,

            // 该字段用于判断分页数据是否重复加载
            data_page: {},

            // 商品筛选条件
            attr_name: null,

            // 促销活动信息
            promotion_info: null,

            // 换购商品列表
            change_group: null,

            // 已选择的换购的商品ID
            old_change_goods: null,

            // 已选择的换购的商品ID
            change_goods: null,

            // 已选择的换购的商品ID
            set_change_goods: function(input, id) {
                if(vmCart.promotion.change_goods != id) {
                    vmCart.promotion.change_goods = id;
                    input.checked = true;
                } else {
                    vmCart.promotion.change_goods = null;
                    input.checked = false;
                }
            }

        },

        // 是否是海外购
        is_global: 0,

        // 点击结算
        submit: function() {
            if(vmCart.is_edit){
                // 编辑模式下改成批量删除商品

                var allGoods = vmCart.goods_list.all_goods;                   // 商品列表
                var delGlobalList = vmCart.goods_list.del_global_list;         // 已选择删除的海外购商品列表
                var delShopList = vmCart.goods_list.del_shop_list;         // 已选择删除的普通商品列表

                var groupList = [],                               // 套餐商品id列表
                    goodsList = [];                               // 普通商品id列表

                delGlobalList.forEach(function(id) {
                    goodsList.push(id);
                });

                delShopList.forEach(function(id) {

                    if(allGoods[id].group_id == id){
                        groupList.push(id);
                    } else {
                        goodsList.push(id);
                    }

                });

                if(goodsList.length || groupList.length){
                    // 清空已选择的待删除商品
                    vmCart.goods_list.reset_select();
                    removeGoods(goodsList, groupList);

                } else {
                    popup.error('请选择要删除的商品！');
                }

            } else if(vmCart.cart.selectQty > 0) {
                // 提交订单
                var globalTotal = Number(vmCart.cart.globalCart.selectQty);   // 海外购商品数量
                var shopTotal = Number(vmCart.cart.shoppingCart.selectQty);   // 普通商品数量

                if(globalTotal && shopTotal){
                    // 显示海外购/普通商品确认对话框
                    vmCart.toggle_checkout(1);
                } else {
                    // 提交订单
                    vmCart.is_global = Number(!!Number(globalTotal));
                    vmCart.create_order();
                }

            }
        },

        // 跳转到确认订单页
        create_order: function() {
            window.location = '/order-confirm.html?is_global=' + vmCart.is_global;
        }

    });


    // 商品详情页
    router.register('', (function() {

        // 当前页面是否是促销列表页
        var isCurrentPage = false;

        var winHeight = window.innerHeight + 100,
            scrollLock = false,
            timer;

        window.addEventListener('scroll', function () {

            if(isCurrentPage && vmCart.commend.page_count > 0){

                if(!scrollLock){
                    clearTimeout(timer);

                    timer = setTimeout(function() {
                        // 滑屏加载下一页数据
                        if(body.scrollTop + winHeight >= body.scrollHeight &&
                            vmCart.commend.page_count > vmCart.commend.page_start){
                            vmCart.commend.page_start = vmCart.commend.page_start + 1;
                            scrollLock = true;
                            goodsRecommend(function() {
                                scrollLock = false;
                            });
                        }
                    }, 20);
                }

            }
        });

        // 页面切换事件
        router.onChange(function(page) {
            isCurrentPage = /shopping-car\.html$/.test(page.name);

            if(isCurrentPage){
                // 如果是当前页面则初始化页面头部
                body.scrollTop = 0;
            }
        });


        // 加载促销商品列表
        goodsRecommend();

        return function() {

            // 加载购物车列表
            getCartList();

            // 关闭所有弹窗
            vmCart.toggle_type();
            vmCart.toggle_discount();
            vmCart.toggle_switch();
            vmCart.toggle_checkout();
            vmCart.toggle_filter();

            // 关闭编辑模式
            vmCart.is_edit = false;

        };

    })(), 1);


    // 促销列表页
    router.register('?promotion', (function() {
        // 当前页面是否是促销列表页
        var isCurrentPage = false;

        var winHeight = window.innerHeight + 100,
            scrollLock = false,
            timer;

        var sortNav = document.getElementById('sort-nav'),
            top = sortNav.offsetTop,
            isFixed = false;

        window.addEventListener('scroll', function () {

            if(isCurrentPage){

                if(!scrollLock){
                    clearTimeout(timer);

                    timer = setTimeout(function() {
                        // 滑屏加载下一页数据
                        if(body.scrollTop + winHeight >= body.scrollHeight &&
                            vmCart.promotion.param.page_count > vmCart.promotion.param.page_start){
                            vmCart.promotion.param.page_start = vmCart.promotion.param.page_start + 1;
                            scrollLock = true;
                            getPromotionList(function() {
                                scrollLock = false;
                            });
                        }
                    }, 20);
                }

                // 固定头部筛选菜单
                if(body.scrollTop > top && isFixed){
                    isFixed = false;
                    sortNav.style.cssText = 'position:fixed;top:0;z-index:11';
                } else if(body.scrollTop <= top && !isFixed) {
                    isFixed = true;
                    sortNav.style.cssText = '';
                }
            }
        });

        // 页面切换事件
        router.onChange(function(page) {
            isCurrentPage = /\?promotion$/.test(page.name);

            sortNav.style.cssText = '';
            if(isCurrentPage){
                // 如果是当前页面则初始化页面头部
                body.scrollTop = 0;
                top = sortNav.offsetTop;
            }
        });

        return function() {

            // 获取 promotion id
            if(!vmCart.promotion.promotion_id){
                vmCart.promotion.promotion_id = decodeURIComponent((location.hash.substr(1).match(/(^|&)id=([^&]*)(&|$)/) || [])[2] || '');
            }

            // 重置促销商品信息
            vmCart.promotion.param.page_start = 1;
            vmCart.promotion.param.search_attr = [];
            vmCart.promotion.param.type = 'all';
            vmCart.promotion.param.type_status = '';
            vmCart.promotion.param.down_price = '';
            vmCart.promotion.param.up_price = '';
            vmCart.promotion.param.page_count = 0;

            vmCart.promotion.list_data = null;
            vmCart.promotion.data_page = {};

            vmCart.promotion.attr_name = null;
            vmCart.promotion.change_group = null;
            vmCart.promotion.promotion_info = null;


            // 关闭所有弹窗
            vmCart.toggle_type();
            vmCart.toggle_discount();
            vmCart.toggle_switch();
            vmCart.toggle_checkout();
            vmCart.toggle_filter();

            getPromotionList();
        }

    })());


    // 取消默认事件
    var preventDefault = function(e) {
        e.preventDefault();
        e.stopPropagation();
    };

    // 滑动显示删除按钮
    exbind.register('delete', 'load', (function() {

        // 当前已经打开的删除按钮
        var current_elem = null;

        return function() {
            var elem = this;

            elem.addEventListener('swipe', function(e) {
                    if(!vmCart.is_edit) {

                        var point = e.data;
                        var pointX = point.diffX.keys(0);
                        var pointY = point.diffY.keys(0);

                        if(Math.abs(pointX) > Math.abs(pointY)){
                            preventDefault(e);
                        }

                    }

                })
                .addEventListener('swipeLeft', function(e) {
                    if(!vmCart.is_edit) {
                        preventDefault(e);

                        if (current_elem) {
                            current_elem.classList.remove('delete');
                        }

                        elem.classList.add('delete');

                        current_elem = elem;
                    }
                })
                .addEventListener('swipeRight', function(e) {
                    if(!vmCart.is_edit) {
                        preventDefault(e);
                        elem.classList.remove('delete');
                    }
                });

        }

    })());


    // 换购商品滑动控件
    exbind.register('change-swipe', 'load', function() {
        var node = this,
            listElem = node.children[0],
            scrollDiff = 0;

        node.addEventListener('swipeLeft', preventDefault)
            .addEventListener('swipeRight', preventDefault)
            .addEventListener('swipe', function(e) {
                var point = e.data;
                var pointX = point.diffX.keys(0);
                var pointY = point.diffY.keys(0);

                if(Math.abs(pointX) > Math.abs(pointY)){
                    preventDefault(e);

                    listElem.style.transform =
                        listElem.style.webkitTransform =
                            'translateX(' + (pointX - scrollDiff) + 'px)';
                }

            })
            .addEventListener('swipeEnd', function(e) {
                scrollDiff = scrollDiff - e.data.diffX.keys(0);

                if(scrollDiff < 0 ){
                    scrollDiff = 0;
                } else if(scrollDiff + node.offsetWidth > listElem.scrollWidth) {
                    scrollDiff = listElem.scrollWidth - node.offsetWidth ;
                    scrollDiff = scrollDiff > 0 ? scrollDiff : 0 ;
                }

                listElem.style.transform = listElem.style.webkitTransform = 'translateX(' + (-scrollDiff) + 'px)';
            });
    });

});