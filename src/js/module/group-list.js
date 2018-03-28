/*!
 * @author yuchunfeng,lixiaoxiao@baiyjk.com
 * @date 2017/05/06
 * @version 2.0.0
 * @description Description
 */
define('group-list',['member', 'ajax', 'mvvm', 'popup', 'widget','exbind', 'public'],function (require, exports) {
    var member = require('member');
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var popup = require('popup');
    var widget = require('widget');
    var Public = require('public');
    var exbind = require('exbind');

	var config = window.Config;
	var platform = config.platform;
	
    var type =  Public.getSearchParam('type') || 'group_hot_list';

    var vmData = MVVM.define('group-list',{

        group_type : type ,     //   group_hot_list:热门拼团   group_hot_list：我的拼团

        group_hot_list: {                  // 热门拼团的页数，请求的数量，总数
            page : 1,
            size : 10 ,
            total : 0 ,
            ready : false
        } ,
        group_my_list: {                   // 我的拼团的页数，请求的数量，总数
            page : 1,
            size : 10 ,
            total : 0 ,
            ready : false
        } ,

        hot_group: [] ,                  //热门拼团
        my_group : [] ,                  //我的拼团

        is_show : false ,                //是否显示分享弹窗


        //获取热门拼团
        getGroupHot : function( callback ) {

            vmData.group_type = 'group_hot_list' ;

            if( !vmData.group_hot_list.ready ) {

                ajax({
                    type: 'POST',
                    url: Config.url + 'fgroup/group/group_list',
                    data: {
                        page : vmData.group_hot_list.page ,
                        size : vmData.group_hot_list.size
                    },
                    dataType: 'json',
                    beforeSend: function () {
                        popup.loading('show');
                    },
                    success: function(data) {

                        popup.loading('hide');

                        if(data && data.code == 200){

                            vmData.group_hot_list.ready = true ;
                            vmData.group_hot_list.total = Math.ceil(data.data.total_items / vmData.group_hot_list.size) ;


                            vmData.hot_group = vmData.hot_group.concat(data.data.lists);

                            callback && callback();

                        } else if( data && data.code == 30001 ){

                            vmData.group_hot_list.page = -1;
                        }
                    },
                    error: function() {
                        popup.error('InterFace Error');
                    }
                });
            }

        },

        //获取我的拼团
        getGroupMy : function(callback) {

            vmData.group_type = 'group_my_list' ;

            if( !vmData.group_my_list.ready ) {
                ajax({
                    type: 'POST',
                    url: Config.url + 'fgroup/group/group_my_fight_list',
                    data: {
                        token : member.token ,
                        page : vmData.group_my_list.page,
                        size : vmData.group_my_list.size
                    },
                    dataType: 'json',
                    beforeSend: function () {
                        popup.loading('show');
                    },
                    success: function(data) {

                        popup.loading('hide');

                        if(data && data.code == 200){

                            vmData.group_my_list.ready = true ;
                            vmData.group_my_list.total = Math.ceil(data.data.total_items / vmData.group_my_list.size) ;

                            data.data.lists.forEach(function(item){
                                if( item.gf_end_time > Math.floor(new Date().getTime()/1000) ) {
                                    item.group_overtime = 0 ;     //没有超过拼团有效期
                                } else {
                                    item.group_overtime = 1 ;      //超过拼团有效期
                                }

                            });

                            vmData.my_group = vmData.my_group.concat(data.data.lists);

                            callback && callback();

                        } else if( data.code == 201 ) {
                            
                            window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                        } else if( data && data.code == 30001 ) {

                            if(vmData.group_my_list.page == 1){

                                  vmData.is_show = true  ;
                            }
                            vmData.group_my_list.page = -1;


                        }
                    },
                    error: function() {
                        popup.error('InterFace Error');
                    }
                });
            }

        },

        // 滚动向下加载
        init : function() {

            if(!vmData[vmData.group_type].ready) {
				
                if( vmData.group_type == 'group_hot_list' ){
                    vmData.getGroupHot() ;
                } else {
                    vmData.getGroupMy() ;
                }
				
				// 滚动区域
			    var scrollWrap = document.body,
			        header = document.getElementById('header'),
			        nav = document.getElementById('nav-wrap'),
			        hHeight = header.scrollHeight  ,
			        navHeight = nav.scrollHeight;
				
				
				
				// 滑动到底部则自动更新
			    var winHeight = window.innerHeight + 100,
			        headIsShow = true,
			        scrollLock = false,
			        timer;
			    window.addEventListener('scroll', function () {

			        if(!scrollLock){
			            clearTimeout(timer);
			            timer = setTimeout(function() {
			                if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && (vmData[vmData.group_type].page < vmData[vmData.group_type].total)){
			                    vmData[vmData.group_type].page += 1;
                                vmData[vmData.group_type].ready = false ;
                                scrollLock = true;
                                
			                    if( vmData.group_type == 'group_hot_list' ){
                                    vmData.getGroupHot(function() {
                                        scrollLock = false;
                                    });
                                } else if( vmData.group_type == 'group_my_list' ){
                                    vmData.getGroupMy(function() {
                                        scrollLock = false;
                                    });
                                }
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
            }

        }

    });
   
    
    // 根据URL参数跳转栏目
    var pageRouter = (function() {
    	
        var currentPage = null;

        return function() {
            var hash = location.hash.substr(1);

            var type = hash || 'group_hot_list';
            
            vmData.group_type = type;
            
            vmData.init();

        }

    })();

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
	
    // tab切换事件
    window.addEventListener('hashchange', function() {
        var hash = location.hash.substr(1);
        if(hash == 'group_hot_list'){
        	vmData.getGroupHot();
        }else{
        	vmData.getGroupMy();
        }
    });

    
    pageRouter();
    
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

});
