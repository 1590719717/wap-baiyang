/*!
 * @author lixiaoxiao@baiyjk.com
 * @date 2016/10/24 006
 * @description 订单支付成功
 */

define('group-submit-successfully',['ajax', 'member', 'popup', 'widget', 'mvvm', 'exbind'],function (require, exports) {
    var ajax = require('ajax');
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var exbind = require('exbind');

    var config = window.Config;
	var platform = config.platform;
	
    // 订单详情
    var vmData = MVVM.define('group-success', {
        order_id: '',           // 订单id
        real_pay: '0.00',       // 订单金额
        order_status: '',       // 订单状态
        payment_id : 0 ,        //支付方式
        payment_name:'',		//支付方式名称
        gfa_type:0,			//是否抽奖
		
		is_head : 0,          //是否是团长
		gfa_user_count : 0,    //成团人数
		gfa_join_num : 0,      //参团人数
		fight_buy : [],        //参团头像
		vacancy_num : 0,		//参团空缺位置
        bottom_link: '',         // 底部广告链接
        bottom_img: '',         // 底部广告图片


        is_touch_machine: Config.platform.isFromBYTouchMachine ,      //是否是触屏机
        is_popup_logout: false ,  // 是否显示退出登录的弹窗
        is_click_popup : false ,  // 5s后自动出现弹窗后，点击继续购物后，将不会再出现退出弹窗

        click_url: '' ,          //点击继续购物按钮的跳转链接
        time_count: null ,       //定时器


        // 返回首页
        view_url: function(url) {

            if( vmData.is_touch_machine && !vmData.is_click_popup){

                clearTimeout(vmData.time_count);
                vmData.is_popup_logout = true ;
                if( url ){
                    vmData.click_url = url ;
                }

            } else {
                window.location.replace(url);
            }
        },

        //继续购物
        goBuy: function(){
            if( vmData.click_url ){
                window.location.replace( vmData.click_url );
            } else {
                vmData.is_popup_logout = false ;
                vmData.is_click_popup = true ;
                window.location.replace('index.html');
            }

        } ,
        //返回首页
        goExit: function() {
            popup.loading('show');
            member.logout(function(data) {
                popup.loading('hide');

                if(data && data.code == 200){
                    window.location = 'index.html';
                }
            }) ;
        } ,

        gf_id : ''        // 拼图id

    });

    // 获取订单详情
    var getOrderInfo = function(order_id) {
        ajax({
            type: 'post',
            url: Config.url + 'fgroup/order/detail',
            data: {
                order_id: order_id,            // 订单id
                token: member.token
            },
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function (data) {
                popup.loading('hide');
                if(data && data.code == 200 && data.data){
                    vmData.order_id = data.data.orderInfo.order_sn;
                    
                    vmData.order_status = data.data.orderInfo.status;
                    vmData.payment_id = data.data.orderInfo.payment_id ;
                    vmData.payment_name = data.data.orderInfo.payment_name;//支付方式
                        
                    vmData.real_pay =  data.data.orderInfo.real_pay ;
                    
                    vmData.is_head = data.data.fight.is_head;
                    vmData.gfa_user_count = data.data.fight.gfa_user_count;
                    vmData.gfa_join_num = data.data.fight.gf_join_num;
                    vmData.fight_buy = data.data.fight.user_list;
                    vmData.vacancy_num = Number(vmData.gfa_user_count) - Number(vmData.gfa_join_num);
                    vmData.gf_id = data.data.fight.gf_id ;
                    vmData.gfa_type = data.data.fight.gfa_type;
					
					// 微信修改分享文案
	                if( platform.isFromWx || platform.isFromQQ){
	                    // 微信全站绑定分享
	                    require.async('group-share', function(Share) {
	                        // 绑定分享
	                        var shareObject = Share({
	                            title: data.data.fight.share_title ,
			                    description: data.data.fight.share_content ,
			                    img: data.data.fight.share_image ,
	                            url: seajs.data.cwd + 'group-join.html?group_id=' + vmData.gf_id,
	                            type: 'link'
	                        });
	
	                    });
	
	                }
					
                    // 订单支付成功监测代码
                    if(data.data.orderInfo.order_status != 'paying') {
                        try {
                            ga('require', 'ecommerce');

                            ga('ecommerce:addTransaction', {
                                'id': data.data.orderInfo.order_sn,                       // 订单ID
                                'revenue': data.data.orderInfo.order_total,                  // 订单总额
                                'affiliation': [(member.userInfo ? member.userInfo.phone: ''), data.data.orderInfo.telephone].join(',')       // 账户绑定的手机号,收货人的手机号.
                            });

                            data.data.goodsList.forEach(function(product) {
                                ga('ecommerce:addItem', {
                                    'id': data.data.order_id,                   // 订单ID
                                    'name': product.product_name,               // 商品名称
                                    'sku': product.product_id,                  // 商品编号
                                    'price': product.price,                     // 商品价格
                                    'quantity': product.qty                     // 商品数量
                                });
                            });

                            ga('ecommerce:send');

                        } catch (e) {
                            console.error(e)
                        }
                    }

                } else {
                    popup.error(data ? data.message : '订单参数错误！', function() {
                        window.location.replace('group-order.html');
                    });
                }
            },
            error: function () {
                popup.error('InterFace Error');
            }
        });
    };

    // 订单id
    var order_id = decodeURI((location.search.substr(1).match(/(^|&)order_id=([^&]*)(&|$)/) || [])[2] || '');

    if(order_id){
        getOrderInfo(order_id);
    } else {
        // 返回订单中心
        popup.error('订单参数错误！', function() {
            window.location.replace('group-order.html');
        });
    }

    // 获取底部广告位
    ajax({
        type: 'post',
        url: Config.url + 'wap/payment/pay_success_ad',
        data: {
            token: member.token
        },
        dataType: 'json',
        success: function (data) {
            popup.loading('hide');
            if(data && data.code == 200 && data.data && data.data.spread && data.data.spread[0]){
                var spread = data.data.spread[0];
                if(spread.location || spread.image_url) {
                    vmData.bottom_link = spread.location;
                    vmData.bottom_img = spread.image_url;
                }
            }
        }
    });

    //触屏机5秒后自动出现退出弹窗
    if( vmData.is_touch_machine && !vmData.is_popup_logout){

        vmData.time_count = setTimeout(function() {
            vmData.is_popup_logout = true ;
        },5000);
    }
});