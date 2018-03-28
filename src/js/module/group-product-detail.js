/*!
 * @author yuchunfeng,lixiaoxiao@baiyjk.com
 * @date 2017/05/06
 * @version 2.0.0
 * @description Description
 */
define('group-product-detail',['member', 'ajax', 'mvvm', 'popup', 'widget', 'public', 'exbind', 'app-url'],function (require, exports) {
    var member = require('member');
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var popup = require('popup');
    var widget = require('widget');
    var Public = require('public');
    var exbind = require('exbind');
    var appUrl = require('app-url');

    var group_id = Public.getSearchParam('group_id');
    var config = window.Config;
	var platform = config.platform;
	//浮点数相加
	function accAdd(arg1,arg2){  
		var r1,r2,m;  
		try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0};
		try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0};
		m=Math.pow(10,Math.max(r1,r2));
	    return (arg1*m+arg2*m)/m;
	}
	//浮点数相减
	function accSub(arg1,arg2){      
	    return accAdd(arg1,-arg2);
	}
	
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
	
    var vmData = MVVM.define('group-detail',{

        product_id : '',                 //商品id
        join_left : 0,                   //缺少的参团人数
        saveMoney : 0,					//省多少钱
        group_data : [] ,                //团购详情数据
        
        rule_time:'',					//活动规则时间
        
        group_state : {
        	//活动方面
			gfa_type : 0,					//是否抽奖 0 不抽奖 , 1 抽奖
			gfa_is_draw : 0,				//是否开奖 0 没开奖 1 已开奖
			gfa_user_type : 0,				//0 不限制 , 1新用户可参团
			act_overtime : 1,             	//活动是否过期  0：未过期  1：过期
			gfa_allow_num : 0, 				//限制参加次数 0不限制
			//用户方面
	        act_is_join : 0,             //是否已经参加  0：未参加 1：已参加
	        act_new_user : 0,            //是否是新用户  0：新用户 1：老用户
	        gfa_draw_num : 0,  			 //用户已参加参加次数
        },

        more_group_act : [],          //其他团购
        group_partner : [],			//小伙伴邀请开团

        page : 'group_detail',         //   group_detail:活动详情页  group_rule：团购规则
        // 页面跳转
        pageRouter: function(page) {
            vmData.page = page;
            pageRouter(page);
        },

        //参加拼团
        submit_group : function(type) {

            member.onLogin(function() {

                if( vmData.group_state.act_overtime == 1 ){
                    popup.error('该活动已过期');
                } else {
                    //订单确认
                    ajax({
                        type: 'post',
                        url: Config.url + 'fgroup/buy_now/confirm', 
                        data: {
                            token :  member.token,
                            is_open_group: type,
                            is_check:1,
                            act_id : group_id
                        },
                        dataType: 'json',
                        beforeSend: function () {
                            popup.loading('show');
                        },
                        success: function (data) {
                            popup.loading('hide');
                            if (data && data.code == 200) {

                                window.location = 'group-order-confirm.html?act_id=' + group_id +'&is_open_group=' + type ;

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
                            popup.error('InterFace Error');
                        }
                    });
                }

            });
            member.onLogout(function() {
                window.location = 'login.html?redirect=' + encodeURIComponent('group-product-detail.html?group_id=' + group_id );
            });
        }
    });

    // 页面内部跳转路由
    var pageRouter = Public.stateRouter(function(page) {
        vmData.page = 'group_detail';

    });

    //获取商品详情
    ajax({
        type: 'post',
        url: Config.url + 'fgroup/group/group_act',
        data: {
            token: member.token,
            act_id: group_id
        },
        dataType: 'json',
        beforeSend: function () {
            popup.loading('show');
        },
        success: function (data) {
            popup.loading('hide');

            if (data && data.code == 200) {
				
                if( data.data.gfa_endtime > Math.floor(new Date().getTime()/1000) ){
                    vmData.group_state.act_overtime = 0 ;
                } else {
                    vmData.group_state.act_overtime = 1 ;
                }
                
                vmData.group_state.act_is_join = (data.data.is_join - 0) || 0;//默认未参加
                vmData.group_state.act_new_user = (data.data.is_new_user - 0) || 1;//默认老用户
				vmData.group_state.gfa_type = data.data.gfa_type - 0;
				vmData.group_state.gfa_is_draw = data.data.gfa_is_draw - 0;
				vmData.group_state.gfa_user_type = data.data.gfa_user_type - 0;
				vmData.group_state.gfa_allow_num = data.data.gfa_allow_num - 0;
				vmData.group_state.join_number = (data.data.join_number - 0) || 0;//默认参加次数0
				
				vmData.product_id = data.data.goods_id;
                vmData.join_left = data.data.gfa_user_count - data.data.gfa_join_num ;
                vmData.group_data = data.data;
				vmData.saveMoney = accSub(data.data.market_price , data.data.gfa_price);
                
                //活动规则时间
                if(data.data.gfa_starttime && data.data.gfa_endtime){
                	var html = '活动时间：';
                	var newDate = new Date();
					newDate.setTime(data.data.gfa_starttime*1000);
					html += newDate.format('yyyy年MM月dd日 hh:mm:ss');
					html += '-';
					newDate.setTime(data.data.gfa_endtime*1000);
					html += newDate.format('yyyy年MM月dd日 hh:mm:ss');
					
					vmData.rule_time = html;
                }
				
				// 微信修改分享文案
                if( platform.isFromWx || platform.isFromQQ){
                    // 微信全站绑定分享
                    require.async('group-share', function(Share) {
                        // 绑定分享
                        var shareObject = Share({
                            title: vmData.group_data.goods_name || vmData.group_data.gfa_name,
                            description: vmData.group_data.goods_introduction,
                            img:  vmData.group_data.first_image ,
                            url: String(window.location).replace(/(isband|token|unionid)=([^&]*)(&|$)/ig, ''),
                            type: 'link'
                        });

                    });

                }

				
            }else{
                popup.error( data.data.message );
            }
        },
        error: function () {
            popup.error('InterFace Error');
        }
    });

    //获取更多团购
    ajax({
        type: 'post',
        url: Config.url + 'fgroup/group/group_list',
        data: {
            not :  group_id ,
            page: 1,
            size : 12
        },
        dataType: 'json',
        beforeSend: function () {

        },
        success: function (data) {

            if (data && data.code == 200) {

              vmData.more_group_act = data.data.lists ;
            }
        },
        error: function () {
			
        }
    });
	//小伙伴邀请参团
	ajax({
        type: 'post',
        url: Config.url + 'fgroup/group/group_opened',
        data: {
            group_id: group_id,
            num:2
        },
        dataType: 'json',
        beforeSend: function () {
        },
        success: function (data) {

            if (data && data.code == 200) {
            	vmData.group_partner = data.data;
            }
        },
        error: function () {
            
        }
    });
    // 团购结束倒计时
    exbind.register('count-down', 'load', function (e) {
        var elem = this,
            endtime = e.param.endtime,
            nowtime = Math.floor (new Date().getTime()/1000 );

        if ( endtime > nowtime ) {

            var timeCount = endtime - nowtime ;
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
                    elem.innerHTML = '<em> ' + day + '</em>天<em>' + hour + '</em>时<em>'+ minutes + '</em>分<em>'+ seconds + '</em>秒后结束' ;
                } else {
                    elem.innerHTML = '<em>' + hour + '</em>时<em>'+ minutes + '</em>分<em>'+ seconds + '</em>秒后结束' ;

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
	// 小伙伴邀请参团倒计时
    exbind.register('group-down', 'load', function (e) {
        var elem = this,
            param = e.param;
        if (param.time) {
            var timeCount = param.time*1000;
            var timer = null;

            var hour = 0;
            var minutes = 0;
            var seconds = 0;
            var setTimeCountDown = function() {
                timeCount -= 1000;

                hour = Math.floor(timeCount / 3600000);
                minutes = Math.floor((timeCount % 3600000) / 60000);
                seconds = Math.floor((timeCount % 60000) / 1000);

                minutes = minutes < 10 ? '0' + minutes : minutes;
                seconds = seconds < 10 ? '0' + seconds : seconds;

                elem.innerHTML =  hour + ':' + minutes + ':' + seconds;

                if(timeCount <= 0) {
                	location.reload();
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