/*!
 * @author liyuelong1020@gmail.com
 * @date 2017/3/22 022
 * @description APP链接与wap链接互相转换
 */

define('app-url', [], function (require, exports) {

    // 获取 APP url 参数
    var getAppParam = function(url) {
        url = String(url).trim();

        var param = {};

        if(/^App:\/\//i.test(url)) {
            var paramArr = url.replace(/^App:\/\//i,'').split(/&+/g);

            paramArr.forEach(function(item) {
                var index = item.indexOf('=');
                if(index > -1){
                    var name = item.substr(0, index);
                    var value = item.substr(index + 1);
                    name && (param[name] = value || '');
                }
            });

        }

        return param;

    };

    // 根据app参数返回对应的wap链接
    var getWapUrlFromAppUrl = function(param, url) {
        var type = param.type,
            value = param.value,
            result = {};

        if(type == '1') {
            // 商品详情
            result.href = '/product/' + value + '.html';

        } else if(type == '2') {
            // 品牌详情
            result.href = '/brand/' + value + '.html';

        } else if(type == '3') {
            // url跳转
            result.href = value;

        } else if(type == '4') {
            // 商品搜索
            result.href = '/product-list.html?keyword=' + value + '';

        } else if(type == '14') {
            // 产品分类页
            result.href = '/category-list.html';

        } else if(type == '15') {
            // 优惠券中心
            result.href = '/user-assets.html#page=coupon';

        } else if(type == '16') {
            // 客服咨询
            result.href = 'javascript:;';
            result['data-act'] = 'ntkf';

        } else if(type == '18') {
            // 首页
            result.href = '/index.html';

        } else if(type == '19') {
            // 品牌街首页
            result.href = '/brand.html';

        } else if(type == '20') {
            // 发红包界面
            result.href = '/user-bonus-index.html';

        } else {
            result.href = url;

        }

        return result;
    };

    // 根据url返回app链接
    var getAppUrlFromWapUrl = function(url) {
        // 获取URL路径
        var script = document.createElement('script');
        script.src = url;

        var href = script.src;
        var filePath = href.replace(/^[a-zA-z]+:\/\//, '').split('?')[0].split('/');

        filePath.shift();

        var pathname = filePath.join('/');


        if(!/^App:\/\//i.test(href)){

            var type = '', value = '';

            if(/^product\/\d+\.html$/.test(pathname)) {
                // 商品详情
                type = 1;
                value = (pathname.match(/product\/(\d+)\.html/) || [])[1] || '';
            } else if(/^brand\/\d+\.html$/.test(pathname)) {
                // 品牌详情
                type = 2;
                value = (pathname.match(/brand\/(\d+)\.html/) || [])[1] || '';
            } else if(/^product-list\.html$/.test(pathname)) {
                // 商品搜索
                type = 4;
                value = ((href.split('?')[1] || '').match(/(^|&)keyword=([^&]*)(&|$)/) || [])[2] || '';
            } else if(/^category-list\.html$/.test(pathname)) {
                // 产品分类页
                type = 14;
            } else if(/^user-assets\.html$/.test(pathname)) {
                // 优惠券中心
                type = 15;
            } else if(!pathname || /^index\.html$/.test(pathname)) {
                // 首页
                type = 18;
            } else if(/^brand\.html$/.test(pathname)) {
                // 品牌街首页
                type = 19;
            } else if(/^user-bonus-index\.html$/.test(pathname)) {
                // 发红包首页
                type = 20;
            } else {
                // url跳转
                type = 3;
                value = href;
            }

            return 'App://type=' + type + '&&&value=' + value;

        } else {

            return url;
        }
    };

    return {

        app_to_wap: function(url) {
            var param = getAppParam(url);
            return getWapUrlFromAppUrl(param, url);
        },

        wap_to_app: getAppUrlFromWapUrl

    }
});