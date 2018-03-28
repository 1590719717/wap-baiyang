/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/9/26 026
 * @description 全站公共方法
 */

define('public',[],function (require, exports) {

    var toString = Object.prototype.toString;
    var lang = {
        weekFormatFull: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        weekFormat: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    };

    return {
        // 对象遍历方法
        forEachIn: function(object, callback) {
            for(var key in object){
                if(object.hasOwnProperty(key)){
                    if(callback(key, object[key]) === false) {
                        break;
                    }
                }
            }
        },

        // 判断是否为空对象
        isEmpty: function(obj) {
            if(obj && toString.call(obj) === "[object Object]"){
                for(var i in obj){
                    if(obj.hasOwnProperty(i)){
                        return false;
                    }
                }
            }
            return true;
        },
        // 判断是否是对象
        isObject: function (obj) {
            return toString.call(obj) === "[object Object]"
        },
        // 判断是否是字符串
        isString: function (obj) {
            return toString.call(obj) === "[object String]"
        },
        // 判断是否是数字
        isNumber: function (obj) {
            return toString.call(obj) === "[object Number]"
        },
        // 判断是否是日期
        isDate: function (obj) {
            return toString.call(obj) === "[object Date]"
        },
        // 判断是否是数组
        isArray: function (obj) {
            return toString.call(obj) === "[object Array]"
        },
        // 判断是否是boolean值
        isBoolean: function (obj) {
            return toString.call(obj) === "[object Boolean]"
        },
        // 判断是否是函数
        isFunction: function (obj) {
            return toString.call(obj) === "[object Function]"
        },

        // 从字符串中获取日期对象
        getDateFromString: function(date) {
            var that = this;
            var dataObj = null;
            if (date && that.isString(date) || that.isNumber(date)) {

                var dataStr = String(date).match(/\d{4}\W\d{1,2}\W\d{1,2}/g) || '';

                if(dataStr.length){
                    var _dataStr = dataStr[0].split(/\W/);

                    if(Number(_dataStr[0]) > 0 && Number(_dataStr[1]) > 0 && Number(_dataStr[2]) > 0){
                        dataObj = new Date(Number(_dataStr[0]), Number(_dataStr[1] - 1), Number(_dataStr[2]));

                        var timeStr = String(date).match(/\b\d{1,2}:\d{1,2}:\d{1,2}\b/g) || '';

                        if(timeStr.length){
                            dataObj.setHours.apply(dataObj, timeStr[0].split(':'));
                        }
                    }

                } else if(/^\d+$/.test(date)) {
                    dataObj = new Date();
                    dataObj.setTime(date * 1000);
                }

            } else if (date && that.isDate(date)) {
                dataObj = date;
            }
            return dataObj;
        },

        // 获取特定格式日期字符串
        getDateString: function(date , format , isStamp) {
            var that = this;
            var dTemp = that.getDateFromString(date);

            if(arguments.length == 2){
                !(({}).toString.call(format) === '[object String]') ? isStamp = format : null;
            }
            format = (({}).toString.call(format) === '[object String]') ? format : 'Y-M-D w';

            if(dTemp){

                if(!!isStamp){
                    return Math.floor(dTemp.getTime() / 1000);
                } else {

                    var year = String(dTemp.getFullYear());                // 年
                    var mon = Number(dTemp.getMonth()) + 1;                // 月
                    var date = Number(dTemp.getDate());                    // 日
                    var day = lang.weekFormatFull[dTemp.getDay()];                // 星期
                    var dayMin = lang.weekFormat[dTemp.getDay()];              // 星期缩写

                    var hours = dTemp.getHours();                          // 时
                    var minutes = dTemp.getMinutes();                      // 分
                    var seconds = dTemp.getSeconds();                      // 秒

                    return format
                        .replace(/y+/g, year.substr(2, 2))
                        .replace(/m+/g, mon)
                        .replace(/d+/g, date)
                        .replace(/w+/g, dayMin)
                        .replace(/h+/g, hours)
                        .replace(/i+/g, minutes)
                        .replace(/s+/g, seconds)

                        .replace(/Y+/g, year)
                        .replace(/M+/g, mon < 10 ? '0' + mon: mon)
                        .replace(/D+/g, date < 10 ? '0' + date: date)
                        .replace(/W+/g, day)
                        .replace(/H+/g, hours < 10 ? '0' + hours: hours)
                        .replace(/I+/g, minutes < 10 ? '0' + minutes: minutes)
                        .replace(/S+/g, seconds < 10 ? '0' + seconds: seconds)
                }

            } else {
                return '';
            }
        },

        // 获取一个月的天数
        getMonthDays: function(yy, mm) {
            yy = Number(yy), mm = Number(mm);
            var getCheckYear = function(yy) {
                if (yy % 4 !== 0) {
                    return false;
                }
                if (yy % 100 === 0 && yy % 400 !== 0) {
                    return false;
                }
                return true;
            };

            if (getCheckYear(yy) && mm === 2) {
                return 29;
            }

            if (!getCheckYear(yy) && mm === 2) {
                return 28;
            }

            if (mm === 4 || mm === 6 || mm === 9 || mm === 11) {
                return 30;
            }

            return 31;
        },

        // 根据传入参数返回当前日期的前几天或后几天
        plusDate: function(n, format, isStamp) {
            var that = this;
            var uom = new Date();
            uom.setDate(uom.getDate() + n);
            return that.getDateString(uom, format, isStamp);
        },

        // 获取日期相差天数
        getDaysNum: function (time1 , time2){

            var that = this;
            var _times1 = that.getDateFromString(time1);
            var _times2 = that.getDateFromString(time2);

            if(_times1 && _times2){
                _times1.setHours(0,0,0,0);
                _times2.setHours(0,0,0,0);
                return parseInt((_times2.getTime() - _times1.getTime()) / 8.64E7);
            } else {
                return 0;
            }

        },

        // 根据参数名获取URL中参数值，URL中没有该参数则返回null
        getSearchParam: function(name, url) {
            var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
            var r = (url || location.search.substr(1)).match(reg);
            if (r !== null) {
                return decodeURIComponent(r[2]);
            }
            return '';
        },

        // 获取url传递参数
        getUrlParam: function(url) {
            url = url || location.search.substr(1);

            var param = {};
            var searchArr = url.split('&');
            searchArr.forEach(function(string) {
                var index = string.indexOf('=');
                if(index > -1){
                    var name = string.substr(0, index);
                    var value = decodeURIComponent(string.substr(index + 1));
                    name && (param[name] = value || '');
                }
            });
            return param
        },

        // 页面无刷新路由(通过hash跳转)
        pageRouter: function(callback) {
            var that = this;
            window.addEventListener('hashchange', function() {
                callback(that.getUrlParam(location.hash.substr(1)));
            });
            callback(that.getUrlParam(location.hash.substr(1)));
        },

        // 页面无刷新路由(通过history跳转)
        stateRouter: function(callback) {
            var stateArr = [];
            // 监听返回按钮
            window.addEventListener("popstate", function(event) {
                var state = stateArr.pop();
                if(state){
                    callback(state);
                }
            });

            return function(name){
                stateArr.push(name);
                window.history.pushState(name, null, window.location);
            };
        }
    };
});