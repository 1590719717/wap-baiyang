/*!
 * @author yuchunfeng
 * @date 2016/6/27 027
 * @description Description
 */

define('user-evaluate-share',['member', 'ajax', 'popup', 'widget', 'mvvm', 'router', 'public', 'image-manage'],function (require, exports) {
    var member = require('member');
    var ajax = require('ajax');
    var popup = require('popup');
    var widget = require('widget');
    var MVVM = require('mvvm');
    var router = require('router');
    var Public = require('public');
    var image_manage = require('image-manage');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var parten = /^\s*$/ ;   // 判断空格
    var order_id = Public.getSearchParam('order_id'),
        which_page = Public.getSearchParam('which_page') || 0 ;


    var mvData = MVVM.define('evaluate',{
        which_page : which_page  ,            // 0晒单列表   1评价   3查看评价

        title:'评价',                     // 标题
        order_id : order_id ,             //订单编号
        product_list : [] ,         //评价晒单列表
        goods_msg: null ,           //评价单个商品 的商品信息

        degree : 5 ,                //红心数量  评级
        message : '' ,              //评价内容
        img_photo : [] ,            // 评论图片
        update_photo : [] ,            // 待上传的评论图片
        comment_id:'',             //评论id  追加评论时才有


        // 评价图片列表
        photo_arr : [] ,
        // 评价图片当前index
        scroll_index : 1 ,

        // 显示/隐藏评价图片查看弹窗
        show_comment_img: false,
        // 关闭图片查看
        close_comment_img: function() {
            mvData.show_comment_img = false;
            mvData.photo_arr = null;
            mvData.scroll_index = 0;
        },

        //获取评价的商品信息
        getGoodsMsg: function( index ) {
            mvData.goods_msg  = mvData.product_list[index] ;

        } ,

        // 点击设置红心
        setDegree: function(num) {
            mvData.degree = Number(num);
        },

        // 上传照片
        getFile: function(input) {
            setTimeout(function() {
                var imgFiles = [].slice.call(input.files);

                var len = imgFiles.length;

                if(imgFiles.length + mvData.update_photo.length > 4) {
                    imgFiles.length = len = 4 - mvData.update_photo.length;
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

        // 查看图片
        scrollImg: function( index ) {
            mvData.scroll_index = index;
            mvData.photo_arr = mvData.img_photo ;
            mvData.show_comment_img = true;
        },

        submitData : function(){
            if( mvData.message.length <= 0 && parten.test(mvData.message) ){
                popup.error('评论内容不能为空');
            }else if(mvData.update_photo.length > 4){
                popup.error('上传图片不能超过4张');
            }else{

                var data = {
                    'token' : member.token ,
                    'order_sn' : mvData.order_id ,
                    'goods_id' : mvData.goods_msg.goods_id ,
                    'star' : mvData.degree ,
                    'contain' : mvData.message

                } ;

                if( mvData.comment_id ) {
                    data.comment_id = mvData.comment_id ;
                }

                if( mvData.update_photo && mvData.update_photo.length ){
                    data.upload_image = JSON.stringify(mvData.update_photo) ;
                }

                //提交评价
                ajax({
                    type: 'POST',
                    url: Config.url + 'background/order/submit_order_product_comment',
                    data: data,
                    dataType: 'json',
                    beforeSend: function() {
                        popup.loading('show');
                    },
                    success: function(data) {

                        popup.loading('hide');

                        if(data && data.code == 200){

                            popup.success('发表评论成功！',function(){
                                history.back();
                                getGoodsMsg();
                            });

                        }else{
                            popup.error(data.message);
                        }
                    },
                    error: function () {
                        popup.error(this.url + ' Error');
                    }
                });
            }
        }
    });


    //请求评价晒单列表
    var getGoodsMsg = function() {
        // 请求数据
        ajax({
            type: 'POST',
            url: Config.url + 'background/order/evaluating_product_status',
            data: {
                token : member.token ,
                order_sn : mvData.order_id
            },
            dataType: 'json',
            beforeSend: function() {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');
                if(data && data.code == 200){

                    mvData.product_list = data.data ;

                    //判断跳转
                    if( which_page == 1 ) {
                        mvData.goods_msg = mvData.product_list[0] ;
                        router.route('?goods_evaluate' , 1 ) ;

                    } else if( which_page == 3  ) {
                        mvData.goods_msg = mvData.product_list[0] ;
                        router.route('?look_evaluate' , 1 ) ;

                    }


                }else if( data.code == 30001 || data.code == 500 ) {
                    popup.error(data.message);
                } else {
                    popup.error(data.message,function() {
                        history.back();
                    });
                }
            },
            error: function () {
                popup.error(this.url + ' Error');
            }
        });
    };

    //请求已评价信息
    var getEvaluateMsg = function() {
        // 请求评论
        ajax({
            type: 'POST',
            url: Config.url + 'wap/order/view_order_product_comment',
            data: {
                token : member.token ,
                order_id : mvData.order_id ,
                product_id : mvData.goods_msg.goods_id
            },
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');
                if(data && data.code == 200){

                    mvData.degree = data.data.degree ;
                    mvData.message = data.data.message ;
                    mvData.comment_id = data.data.comment_id ;
                    if( data.data.pictures_path && data.data.pictures_path.length ){
                        mvData.img_photo = data.data.pictures_path ;
                    } else {
                        mvData.img_photo = [] ;
                    }

                }else{
                    popup.error(data?data.message:this.url + ' Error');
                }
            } ,
            error: function () {
                popup.error(this.url + ' Error');
            }
        });
    };

    member.onLogin(function() {
        getGoodsMsg();


    });

    //评价 商品列表
    router.register('', function(){
        mvData.message = '';
        mvData.degree = 5 ;
        mvData.comment_id = '' ;
        mvData.img_photo = [] ;
        mvData.update_photo = [] ;
        mvData.photo_arr = [] ;

    }, 1 );


    // 评价
    router.register('?goods_evaluate', function(){
        if( mvData.goods_msg.comment_status == 1 ){
            mvData.title = '追加晒单' ;
            getEvaluateMsg();
        } else {
            mvData.title = '评价' ;
        }

    }, 0, 0);

    // 查看评价
    router.register('?look_evaluate', function(){
        mvData.title = '查看评价' ;
        // 请求评论
        ajax({
            type: 'POST',
            url: Config.url + 'wap/order/view_order_product_comment',
            data: {
                token : member.token ,
                order_id : mvData.order_id ,
                product_id : mvData.goods_msg.goods_id
            },
            dataType: 'json',
            beforeSend: function () {
                popup.loading('show');
            },
            success: function(data) {
                popup.loading('hide');
                if(data && data.code == 200){
                    mvData.degree = data.data.degree ;
                    mvData.message = data.data.message ;
                    mvData.img_photo = data.data.pictures_path ;


                }else{
                    popup.error(data?data.message:this.url + ' Error');
                }
            } ,
            error: function () {
                popup.error(this.url + ' Error');
            }
        });


    }, 0, 0);

});