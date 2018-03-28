/*!
 * @author lixiaoxiao@baheal.com
 * @date 2017/09/27 027
 * @description Description
 */

define('user-order-wl',['member', 'ajax', 'mvvm', 'popup', 'widget'],function (require, exports) {
	var exbind = require('exbind');
	var event = require('event');
    var member = require('member');
    var ajax = require('ajax');
    var MVVM = require('mvvm');
    var popup = require('popup');
    var widget = require('widget');

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    var order_id = GetQueryString('id'),
        payment_id =  GetQueryString('payment_id'),
        is_global = GetQueryString('is_global') || 0;

    //用JS获取地址栏参数
    function GetQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    }


	var vmData = MVVM.define('my-logistics',{
		payment_id:payment_id,	//支付方式
        logistics:[],	//包裹数据
        size:0	//包裹个数
    });
    
    member.onLogin(function() {
    	ajax({
            type: 'POST',               // 请求类型
            url: Config.url + 'wap/order/order_logistics',                   // 请求url
            data: {              // 请求参数
                token : member.token,
                order_id : order_id,
                express_sn:0,
                channel_name:'wap'
            },
            dataType: 'json',              // 获取的数据类型
            beforeSend: function () {
                popup.loading('show');
            },
            success: function(data) {     // 成功回调
                popup.loading('hide');
                if(data && data.code == 200){
                	if(is_global && is_global == 0){
                		vmData.logistics = data.data.logistics;
                    	vmData.size = data.data.logistics.length;
                	}else{
                		vmData.logistics = [data.data];
                    	vmData.size = 1;
                	}
                }
            },
            error: function() {          // 失败回调
                popup.loading('hide');
                popup.error('请求失败！');
            }
        });
    });
    
   
    var tab_hd,tab;
    //绑定物流tab切换
    exbind.register('wl_hd', 'load', function (e) {
    	//顶部tab滑动效果
	    tab_hd = (function() {
	    	var wrap = document.getElementById('tab_hd');
	    	var winWidth = window.innerWidth;
	    	var index = 0;
	    	var wrap_li = [].slice.call(wrap.children);
	        var size = vmData.size;
	        var currentTitle = wrap_li[0];
	        
	        var liWidth;
	        
	        var swipeLen = 0;	//上次滑动位置
	        
	        if(!wrap){
	        	return;
	        }
	        	        
	        
	        //初始化active
	        currentTitle.classList.add('active');
	        
	        //如果需要滚动，则添加滑动事件
	        if(size > 2){
	        	var hd_time = setInterval(function(){
	        		liWidth = wrap_li[0].clientWidth;
	        		if(liWidth){
	        			clearInterval(hd_time);
		        		wrap.style.width = liWidth * size + 'px';
		        	}
	        	},10);
	        	
	        	wrap.addEventListener('touchstart', function(e) {
	                
	                wrap.style.transition = wrap.style.webkitTransition = 'none';
	                
	            })
	            .addEventListener('swipe', function(e) {
	            	preventDefault(e);
	                var point = e.data;
	                var pointX = point.diffX.keys(0);
	                var pointY = point.diffY.keys(0);
	
	                if(Math.abs(pointX) > Math.abs(pointY)){
	                    wrap.style.transform = wrap.style.webkitTransform = 'translateX(' + (swipeLen + pointX) + 'px)';
	                }
	
	            })
	            .addEventListener('swipeEnd', function(e) {
	                var point = e.data;
	                var pointX = point.diffX.keys(0);
	                var pointY = point.diffY.keys(0);
	            	swipeLen = swipeLen + pointX;
	            	wrap.style.transition = wrap.style.webkitTransition = 'all .3s ease';
	            	if(swipeLen > 0){
	            		wrap.style.transform = wrap.style.webkitTransform = 'translateX(0)';
	            		swipeLen = 0;
	            	}
	            	if((swipeLen + liWidth * size) < winWidth){
	            		wrap.style.transform = wrap.style.webkitTransform = 'translateX(-'+ (liWidth * size - winWidth) +'px)';
	            		swipeLen = -(liWidth * size - winWidth);
	            	}
	            	
	            });
	        	
	        }
	        
	        //tab内容区滚动，active元素居中显示
	    	var timer;
	        var translate = function() {
	
	            clearTimeout(timer);
	
	            timer = setTimeout(function() {
	                var left = index * liWidth;
	                var wrapLeft = (winWidth - liWidth)/2;
	                var right = (size - (index+1)) * liWidth;
	                setTimeout(function() {
	                	wrap.style.transition = wrap.style.webkitTransition = 'all .3s ease';
	                	if((left - wrapLeft) > 0 && (right - wrapLeft) > 0){
	                		swipeLen = - (left - wrapLeft);
	                		wrap.style.transform = wrap.style.webkitTransform = 'translateX(-' + (left - wrapLeft) + 'px)';
	                	}
	                	if((left - wrapLeft) <= 0){
	                		swipeLen = 0;
	                		wrap.style.transform = wrap.style.webkitTransform = 'translateX(0)';
	                	}
	                	if((right - wrapLeft) <= 0){
	                		swipeLen = - (liWidth * size - winWidth);
	                		wrap.style.transform = wrap.style.webkitTransform = 'translateX(-' + (liWidth * size - winWidth) + 'px)';
	                	}
	                	
	                }, 10);
	            }, 10);
	
	        };
	    	// 取消默认事件
	        var preventDefault = function(e) {
	            e.preventDefault();
	            e.stopPropagation();
	        };
	        
	        //tab  active切换
	        var currentFun = function(){
	        	currentTitle.classList.remove('active');
	            currentTitle = wrap_li[index];
	            currentTitle.classList.add('active');
	        }
	        
	        wrap_li.forEach(function (li, i) {
	        	li.addEventListener('tap', function () {
	        		index = i;
	        		currentFun();
	                tab(i);
	        	});
	        });
	    	
	    	
	    	return function(i) {
	            if(i >= size){
	                i = size - 1;
	            }
	            if(i < 0){
	                i = 0;
	            }
	            index = i;
				translate();
	            currentFun();
	        }
	    })();
    });
    //绑定物流内容区切换
    exbind.register('wl_bd', 'load', function (e) {
    	// tab切换
	    tab = (function() {
	        var wrap = document.getElementById('wl_tab');
	        var index = 0;
	        var size = vmData.size;
	        var winWidth = window.innerWidth;
			
			for(var j = 0;j < size;j ++){
				wrap.children[j].style.left = j * 100 +'%';
			}
			
	        var timer;
	        var translate = function() {
	
	            clearTimeout(timer);
	
	            timer = setTimeout(function() {
	                wrap.style.transition = wrap.style.webkitTransition = 'all .3s ease';
	                setTimeout(function() {
	                    wrap.style.transform = wrap.style.webkitTransform = 'translateX(-' + index * 100 + '%)';
	                }, 10);
	            }, 10);
	
	        };
	
	        // 取消默认事件
	        var preventDefault = function(e) {
	            e.preventDefault();
	            e.stopPropagation();
	        };
	        
	        
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
	            	if(tab_hd){
	            		tab_hd(index);
	            	}
	                translate();
	            });
	
	        
	
	
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
    })

});