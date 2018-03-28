/*!
 * @author liyuelong1020@gmail.com   yuchunfeng
 * @date 2016/6/22 022
 * @description 品牌街
 */

define('brand', ['ajax', 'mvvm', 'event', 'widget', 'popup', 'member', 'exbind', 'router'], function (require, exports) {
    var ajax = require('ajax');
    var event = require('event');
    var MVVM = require('mvvm');
    var widget = require('widget');
    var popup = require('popup');
    var member = require('member');
    var exbind = require('exbind');
    var router = require('router');

    var brandId = window.brandId || '';

    // 品牌列表
    router.register('', (function() {
        var isReady = false;

        // 滑动到底部则自动更新
        var scrollWrap = document.body,
            sortNav = document.getElementById('sort-nav'),
            winHeight = window.innerHeight + 100,
            scrollLock = false,
            timer;

        var vmData = MVVM.define('brand-list', {
            brand_id: brandId,        //品牌id
            data: null,               //返回的数据
            sort: 'all',              //排序 默认是综合排序 综合排序：all；人气： hot; 销量：sales；价格：price；评价：comment
            sort_type: 'asc',         //  排序 状态 0降序 1升序  中间值
            typeStatus: 0 ,           //   排序 状态 0降序 1升序
            page: 1,                  //页数
            total: 0,                 //总数

            filter: function(type) {
                if(type != vmData.sort){
                    vmData.sort = type;
                    vmData.sort_type = 'desc';
                } else if(vmData.sort != 'all') {

                    if(type == 'sales'){       //销量只有降序
                        vmData.sort_type = 'desc' ;

                    } else {
                        vmData.sort_type = vmData.sort_type == 'asc' ? 'desc' : 'asc';
                    }

                }
                vmData.typeStatus = vmData.sort_type == 'asc' ? 1 : 0 ;
                vmData.page = 1;
                vmData.data.length = 0;

                getProductList();

                scrollWrap.scrollTop = 0;
            }
        });

        var getProductList = function(callback) {

            // 加载品牌列表
            ajax({
                type: 'post',
                url: Config.url + 'background/Brand_street/brand_product_list',
                data: {
                    brandId: vmData.brand_id,
                    pageStart: vmData.page,
                    type: vmData.sort,
                    typeStatus: vmData.typeStatus,
                    pageSize: 10
                },
                dataType: 'json',
                beforeSend: function() {
                    popup.loading('show');
                },
                success: function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200) {

                        if (!vmData.total) {
                            vmData.total = data.data.pageCount;
                        }
                        !vmData.data && (vmData.data = []);
                        vmData.data = vmData.data.concat(data.data.listData);

                        callback && callback();

                    } else if( data && data.code != 100006 )  {
                        popup.error(data ? data.message : 'InterFace Error！');
                    }
                },
                error: function() {
                    popup.error(this.url + ' Error');
                }
            });

        };

        var init = function() {

            getProductList();

            if(sortNav){

                var top = 0,
                    offsetTop = sortNav.offsetTop + sortNav.scrollHeight,
                    fragment = document.createElement('div'),
                    flag = null;

                fragment.style.cssText = 'width:100%;height:' + sortNav.offsetHeight + 'px;display:none;';

                var setOffset = function() {
                    var scrollTop = scrollWrap.scrollTop;

                    if(scrollTop > offsetTop + top && flag !== 1){

                        flag = 1;
                        sortNav.style.cssText = 'position: fixed;left: 0;top: ' + top + 'px;z-index: 9';
                        fragment.style.display = 'block';
                        document.body.appendChild(sortNav);

                    } else if(scrollTop <= offsetTop + top && flag !== 2) {

                        flag = 2;
                        sortNav.style.cssText = '';
                        fragment.style.display = 'none';
                        fragment.parentNode.insertBefore(sortNav, fragment);

                    }
                };

                sortNav.parentNode.insertBefore(fragment, sortNav);

                // 页面滚动到底部则加载下一页
                window.addEventListener('scroll', function () {

                    setOffset();

                    if(!scrollLock){
                        clearTimeout(timer);

                        timer = setTimeout(function() {
                            if(scrollWrap.scrollTop + winHeight >= scrollWrap.scrollHeight && vmData.page < vmData.total){
                                vmData.page += 1;
                                scrollLock = true;
                                getProductList(function() {
                                    scrollLock = false;
                                });
                            }
                        }, 20);

                    }
                });
            }

        };

        return function() {
            if(!isReady && brandId){
                isReady = true;
                init();
            }
        };
    })(), 1);


    // 品牌详情
    router.register('?detail', function() {});

    // 微信绑定分享
    if(Config.platform.isFromWx){
        // 微信全站绑定分享
        require.async('share', function(Share) {

            // 绑定分享
            var shareObject = Share({
                title: '百洋商城品牌街-妈妈的网上药店，专营大品牌、高品质、正流行产品',
                description: '百洋商城品牌街-妈妈的网上药店，专营大品牌、高品质、正流行产品',
                img: Config.cdn + 'images/icon-download.png',
                url: String(window.location).replace(/(isband|token|unionid)=([^&]*)(&|$)/ig, ''),
                type: 'link'
            });

        });
    }

});