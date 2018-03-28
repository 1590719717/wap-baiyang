/*!
 * @author yuchunfeng
 * @date 2016/6/27 027
 * @description 404错误页面
 */

define('error-page',['widget'],function (require, exports) {
    var widget = require('widget');
    var timer,
        second = 5 ,
        time_text = document.getElementById('time-count') ;

    timer = setInterval(function() {
        second--;
        if(second > 0){
            time_text.innerHTML = second ;
        } else {
            window.location.href = '/index.html' ;
        }
    }, 1000);

    try {
        ga('send', 'event', '网页错误', '404错误', window.location.href);
    } catch (e) {}
});