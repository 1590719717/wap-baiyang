/*!
 * @author yuchunfeng,lixiaoxiao
 * @date 2017/5/20
 * @version 2.0
 * @description 参团
 */
define('group-join',['member', 'ajax', 'mvvm', 'popup', 'widget', 'public', 'exbind', 'group-share'],function (require, exports) {
    var member = require('member');
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var popup = require('popup');
    var widget = require('widget');
    var Public = require('public');
    var Share = require('group-share');
    var exbind = require('exbind');

    var group_id = Public.getSearchParam('group_id');
    var is_show = Public.getSearchParam('is_show');
    var shareObject;

	
    var vmData = MVVM.define('group-join',{

        page : 'group_join',             //   group_join:好货团购   group_rule：团购规则
        is_share : false ,               //是否显示分享弹窗
        product_id : '',                 //商品id
        act_id : '',                     //活动id
        group_data : '',
        join_left : 0,                   //缺少的参团人数
        act_overtime : 0 ,              //拼团有效期  0：未过期  1：过期

        more_group_act : [],             //更多团购

        // 页面跳转
        pageRouter: function(page) {
            vmData.page = page;
            pageRouter(page);
        },
		// 点击显示/隐藏参团详情
        is_select_tag: false,
        toggleTag: function() {
            vmData.is_select_tag = !vmData.is_select_tag;
        },
        
        //参加拼团
        submit_group : function( type ) {

            var actId = '';

            if( type == 0 ) {    //参团
                actId =  group_id ;
            } else {             //开团
                actId =  vmData.act_id ;
            }

            member.onLogin(function() {

                if( vmData.group_data.gfa_allow_num != 0 && vmData.group_data.join_number >= vmData.group_data.gfa_allow_num ) {

                    popup.confirm('该活动最多可参加'+vmData.group_data.gfa_allow_num+'次,不要太贪心',function(){

                        window.location = 'group-order.html#all' ;

                    },function(){

                        window.location = 'group-list.html' ;

                    },{
                        cancelText: '其他热团',
                        confirmText: '我的订单'
                    })
                } else{
                    //订单确认
                    ajax({
                        type: 'post',
                        url: Config.url + 'fgroup/buy_now/confirm',
                        data: {
                            token : member.token ,
                            is_open_group: type,
                            is_check:1,
                            act_id : actId
                        },
                        dataType: 'json',
                        beforeSend: function () {
                            popup.loading('show');
                        },
                        success: function (data) {
                            popup.loading('hide');
                            if (data && data.code == 200) {

                                window.location = 'group-order-confirm.html?act_id=' + actId + '&is_open_group=' + type ;

                            } else if( data && data.code == 34624 ) {

                                popup.confirm('您已参团，订单还没支付，<br>快去团购订单-待付款订单支付吧',function(){

                                    window.location = 'group-order.html#paying' ;

                                },{
                                    cancelText: '取消',
                                    confirmText: '确定'
                                }) ;

                            } else {
                                popup.error(data.message);
                            }
                        },
                        error: function () {
                            popup.loading('hide');
                        }
                    });
                }

            });
            member.onLogout(function() {
                window.location = 'login.html?redirect=' + encodeURIComponent('group-join.html?group_id=' + group_id);
            });
        } ,
        //显示分享弹窗
        show_share : function() {
			shareObject.show();

        }
		
    });

    // 页面内部跳转路由
    var pageRouter = Public.stateRouter(function(page) {
        vmData.page = 'group_join';
    });

    //获取商品详情
    ajax({
        type: 'post',
        url: Config.url + 'fgroup/group/group_fight',
        data: {
            token: member.token,
            fg_id: group_id
        },
        dataType: 'json',
        beforeSend: function () {
            popup.loading('show');
        },
        success: function (data) {
            popup.loading('hide');

            if (data && data.code == 200) {

                vmData.product_id = data.data.goods_id;
                vmData.join_left = data.data.gfa_user_count - data.data.fight.gf_join_num  ;
                vmData.act_id = data.data.gfa_id ;

                if( data.data.fight.end_time > 0 ){
                    vmData.act_overtime = 0 ;
                } else {
                    vmData.act_overtime = 1 ;
                }

                vmData.group_data = data.data;
                shareObject = Share({
                    title: vmData.group_data.share_title ,
                    description: vmData.group_data.share_content ,
                    img: vmData.group_data.share_image ,
                    url: seajs.data.cwd + 'group-join.html?group_id=' + group_id,
                    join_left:vmData.join_left
                });
				//是否显示分享弹窗
				if( is_show == 1 && vmData.group_data.fight.gf_state == 1 && vmData.act_overtime == 0  ) {
				    shareObject.show();
				
				}
				
				//获取更多团购
				getMoreAct();
				
            }else {
                popup.error(data.message);
            }
        },
        error: function () {
            popup.error('InterFace Error');
        }
    });
	
    //获取更多团购
    var getMoreAct = function () {
        ajax({
            type: 'post',
            url: Config.url + 'fgroup/group/group_list',
            data: {
                not :  vmData.act_id ,
                page: 1,
                size : 12
            },
            dataType: 'json',
            success: function (data) {
                if (data && data.code == 200) {

                    vmData.more_group_act = data.data.lists ;

                }
            },
            error: function () {
                popup.loading('hide');
            }
        });
    } ;
	
    // 团购有效期倒计时
    exbind.register('count-down', 'load', function (e) {

        var elem = this,
            end_time = e.param.end_time ;

        if ( end_time > 0 ) {

            var timeCount = end_time ;
            var timer = null;

            var day = 0 ;
            var hour = 0;
            var minutes = 0;
            var seconds = 0;
            var setTimeCountDown = function() {
                timeCount -= 1;

                day = Math.floor(timeCount / 86400);
                var leave = Math.floor(timeCount % 86400) ;
                hour = Math.floor(leave / 3600);
                minutes = Math.floor((timeCount % 3600) / 60);
                seconds = Math.floor(timeCount % 60);

                minutes = minutes < 10 ? '0' + minutes : minutes;
                seconds = seconds < 10 ? '0' + seconds : seconds;

                if(day > 0){
                    elem.innerHTML = '<span> ' + day + '</span>天<span>' + hour + '</span>时<span>'+ minutes + '</span>分<span>'+ seconds + '</span>秒后结束' ;
                } else {
                    elem.innerHTML = '<span>' + hour + '</span>时<span>'+ minutes + '</span>分<span>'+ seconds + '</span>秒后结束' ;

                }

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
    
	// 价格分类
    exbind.register('price-part', 'load', function (e) {
        var elem = this,
            param = e.param,
            html = '';
        if(param.price){
        	var arr = parseFloat(param.price).toFixed(2).toString().split('.');
        	html = '&yen;<i>'+ arr[0] + '.</i>'+ arr[1];
        }else{
        	html='&yen;<i>00.</i>00';
        }
        elem.innerHTML = html;
    });
    //显示参团时间
    exbind.register('showJoinTime', 'load', function (e) {
        var elem = this,
            param = e.param,
            html = '';
        if(param.join_time){
        	var newDate = new Date();
			newDate.setTime(param.join_time*1000);
			html += newDate.format('yyyy-MM-dd hh:mm:ss');
        }
        if(param.is_head == 1){
        	html += '<em>开团</em>';
        }else{
        	html += '<em>参团</em>';
        }
        elem.innerHTML = html;
    });
    
	//日期时间格式化
	Date.prototype.format = function(format) {
       var date = {
              "M+": this.getMonth() + 1,
              "d+": this.getDate(),
              "h+": this.getHours(),
              "m+": this.getMinutes(),
              "s+": this.getSeconds(),
              "q+": Math.floor((this.getMonth() + 3) / 3),
              "S+": this.getMilliseconds()
       };
       if (/(y+)/i.test(format)) {
              format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
       }
       for (var k in date) {
              if (new RegExp("(" + k + ")").test(format)) {
                     format = format.replace(RegExp.$1, RegExp.$1.length == 1
                            ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
              }
       }
       return format;
	}

});
