/*!
 * @author lixiao
 * @date 2017/5/11
 * @description 拼团抽奖中奖页面
 */
define('group-winners',['member', 'ajax', 'mvvm', 'popup', 'widget', 'public', 'exbind'],function (require, exports) {
	var member = require('member');
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var popup = require('popup');
    var widget = require('widget');
    var Public = require('public');
    var exbind = require('exbind');
    
    var config = window.Config;
	var platform = config.platform;
    
    var act_id = Public.getSearchParam('act_id');
    
    var vmData = MVVM.define('group-winners',{
    	
    	group_data:'',
    	winner_cache:[],				//中奖名单分页缓存
    	more_group_act : [],            //更多团购
    	isClick:false,
    	check_more:function(){			//点击查看更多
    		vmData.isClick = true;
    		vmData.winner_cache = vmData.group_data.winners;
    	}
    });
    
    //获取商品详情
    var get_group_act = function(){
    	ajax({
	        type: 'post',
	        url: Config.url + 'fgroup/won/group_act',
	        data: {
	            token: member.token,
	            act_id: act_id
	        },
	        dataType: 'json',
	        beforeSend: function () {
	            popup.loading('show');
	        },
	        success: function (data) {
	        	popup.loading('hide');
	        	if (data && data.code == 200) {
                    vmData.group_data = data.data;
	        		
	        		if(vmData.group_data.gfa_is_draw == 0){
	        			popup.error('该活动未开奖！', function() {
                            history.back();
	                    });
	        		}
					if(vmData.group_data.winners.length){
						vmData.winner_cache = vmData.group_data.winners.slice(0,7);
					}
					if(vmData.group_data.winners.length <= 7){
						vmData.isClick = true;
					}
					//加载更多
	        		get_more();
               	} else {
					popup.error(data ? data.message : '该活动拼团失败或者未开奖！', function() {
                        history.back();
                    });
                }
	        },
	        error: function () {
	            popup.error('InterFace Error');
	            history.back();
	        }
	    });
    }
    
    get_group_act();
    //获取更多团购
    var get_more = function(){
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
	        	
	        }
	    });
    }
    
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
})