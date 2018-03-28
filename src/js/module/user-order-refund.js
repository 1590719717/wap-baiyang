/*!
 * @author yuchunfeng
 * @date 2016/6/27 027
 * @description Description
 */

define('user-order-refund',['member', 'ajax', 'popup', 'widget', 'mvvm', 'event','public' , 'image-manage', 'router'],function (require, exports) {
    var member = require('member');
    var ajax = require('ajax');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var event = require('event');
    var Public = require('public');
    var image_manage = require('image-manage');
    var router = require('router');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var parten = /^\s*$/,   // 判断空格
        order_id = Public.getSearchParam('id'),    //订单id
        refund_all = Public.getSearchParam('refund_all')  ; //是否全部退款

    document.title = refund_all==1?'申请退款':'申请售后' ;

    var mvData = MVVM.define('refund-data',{

        order_id : order_id,
        is_refund_all: refund_all,                 //是否全部退款  1：全部退款

        reason_data: [],                //接口返回的退款理由
        product_data: [],               //商品列表信息

        reason_finish: '',             //最终退款理由
        reason_list: '',               //退款理由
        reason_desc: '' ,              //退款说明
        update_photo : [] ,            // 待上传的评论图片
        goods_content: [] ,            //选择退款的商品

        chosen_goods: [],              //选中的商品
        count : 0 ,                    // flag 检测修改商品数量

        has_refund: false ,            // 全部退款 是否已经退款过

        goods_info:{
            'goods_id':'' ,
            'goods_num':''
        } ,

        is_show_reason: false ,        //是否显示退款理由

        // 上传照片
        getFile: function(input) {

            setTimeout(function() {
                var imgFiles = [].slice.call(input.files);

                var len = imgFiles.length;

                if(imgFiles.length + mvData.update_photo.length > 5) {
                    imgFiles.length = len = 5 - mvData.update_photo.length;
                }
                imgFiles.forEach(function(item, index) {
                    var fileReader = new FileReader();
                    fileReader.onload = function(e) {

                        var img = new Image();

                        img.onload = function() {

                            // 压缩图片大小
                            var finally_width =  img.width > 640 ? 640 : img.width,
                                finally_height =  img.height > 640 ? 640 : img.height ;

                            image_manage(img, finally_width, finally_height / img.width * img.height, function(canvas) {
                                mvData.update_photo.push(canvas.toDataURL('image/png').split(',')[1]);

                                len--;

                                if(!len) {
                                    // 手动刷新图片预览列表
                                    mvData.__update__();
                                }
                            });
                        };

                        img.src = e.target.result;

                    };
                    fileReader.readAsDataURL(item);
                });

            }, 0);
        } ,

        // 删除图片
        deleteImg : function(index) {
            mvData.update_photo.splice(index, 1);
            mvData.__update__();
        },

        blur_substring: function() {
            if( mvData.reason_desc.length > 200 ){
                mvData.reason_desc = mvData.reason_desc.substring(0,200) ;
            }
        },

        //显示退款理由
        show_reason: function() {
            mvData.is_show_reason = true  ;
            document.documentElement.classList.add('fixed-popup');
        } ,

        //关闭退款理由
        close_popup: function() {
            mvData.is_show_reason = false  ;
            document.documentElement.classList.remove('fixed-popup');
        },

        //选择退款理由
        chosen_reason: function () {

            if( mvData.reason_list && mvData.reason_list.length ){
                mvData.reason_finish = mvData.reason_list ;
                mvData.is_show_reason = false ;
                document.documentElement.classList.remove('fixed-popup');
            }
        } ,

        //申请退款接口
        refund_submit: function() {

            if( !mvData.reason_finish.length ){
                popup.error('请选择退款原因');

            } else if( !mvData.reason_desc.length || parten.test(mvData.reason_desc) ){
                popup.error('退款理由不能为空');

            } else {

                var data_para = {
                    'token' : member.token ,
                    'order_sn' : mvData.order_id ,
                    'explain' : mvData.reason_desc,
                    'reason' : mvData.reason_finish
                } ;

                if( mvData.update_photo && mvData.update_photo.length ) {
                    data_para.images = JSON.stringify(mvData.update_photo) ;
                }

                //全部退款
                if( mvData.is_refund_all == 1 ) {
                    mvData.product_data.forEach(function(item) {
                        var refund_goods = {};
                        refund_goods.goods_id = item.goods_id ;
                        refund_goods.goods_num = item.max_refund_number ;
                        mvData.goods_content.push(refund_goods);
                    });

                } else if( mvData.chosen_goods && mvData.chosen_goods.length ){
                    //部分退款
                    mvData.chosen_goods.forEach(function(item) {
                        var refund_goods = {};
                        refund_goods.goods_id = mvData.product_data[item].goods_id ;
                        refund_goods.goods_num = mvData.product_data[item].max_refund_number ;
                        mvData.goods_content.push(refund_goods);
                    });
                }

                if(mvData.goods_content && mvData.goods_content.length ) {
                    data_para.goods_content = JSON.stringify(mvData.goods_content) ;
                }

                ajax({
                    type: 'POST',
                    url: Config.url + 'background/order/refund_submit',
                    data: data_para,
                    dataType: 'json',
                    beforeSend: function () {
                        popup.loading('show');
                    },
                    success: function(data) {
                        popup.loading('hide');
                        if(data && data.code == 200){
                            window.location.href = 'user-refund-list.html';

                        }else{
                            popup.error(data?data.message:this.url + ' Error');
                        }
                    } ,
                    error: function () {
                        popup.error(this.url + ' Error');
                    }
                });

            }

        } ,

        // 设置商品数量
        set_num: function(index, num) {

            // 当前修改的商品
            var goods = mvData.product_data[index];

            if(goods) {

                var goods_num = Number(goods.max_refund_number) ;

                if(isNaN(goods_num)){
                    goods_num = 1;
                }
                goods_num += (Number(num) || 0);

                if(goods_num < 1){
                    goods_num = 1;
                }

                if(goods_num > goods.stock){
                    goods_num = goods.stock;
                }

                goods.max_refund_number =  goods_num  ;
                mvData.count += 1 ;

            }
        }

    });

    member.onLogin(function() {

        // 请求商品列表
        ajax({
            type: 'POST',
            url: Config.url + 'background/order/can_service_goods_list',
            data: {
                token : member.token ,
                order_sn : mvData.order_id
            },
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');
                if(data && data.code == 200){

                    if(data.data && Array.isArray(data.data)){
                        data.data.forEach(function(item) {
                            item.stock = item.max_refund_number ;
                        });
                    }

                    if(data.data[0].max_refund_number == 0 ){
                        mvData.has_refund = true ;
                    } else {
                        mvData.has_refund = false ;
                    }

                    mvData.product_data = data.data ;

                }else{
                    popup.error(data.message);
                }
            },
            error: function () {
                popup.error(this.url + ' Error');
            }
        });

    });

    //数据清空
    var reset_data = function() {
        mvData.is_show_reason = false ;
        document.documentElement.classList.remove('fixed-popup');
        mvData.update_photo = [] ;
        mvData.reason_desc = '' ;
        mvData.reason_finish = '' ;
        mvData.reason_list = '';
        mvData.goods_content = [] ;
    } ;


    // 全部退款
    router.register('?refund_all', function(){
        reset_data();

    }, 1 );

    // 填写退款理由
    router.register('?refund_reason', function(){

        if( !mvData.reason_data.length ) {
            ajax({
                type: 'POST',
                url: Config.url + 'background/order/get_order_refund_reason',
                data: {
                    token : member.token ,
                    order_sn: mvData.order_id
                },
                dataType: 'json',
                beforeSend: function () {
                    popup.loading('show');
                },
                success: function(data) {
                    popup.loading('hide');
                    if(data && data.code == 200){
                        mvData.reason_data = data.data;

                    }else{
                        popup.error(data.message);
                    }
                },
                error: function () {
                    popup.error(this.url + ' Error');
                }
            });
        }


    }, 0 , 0 );

});