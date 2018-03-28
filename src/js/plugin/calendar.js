/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/26 026
 * @description Description
 */

define('calendar', ['selector', 'public'], function (require, exports) {
    var Selector = require('selector');
    var Public = require('public');

    /*
     * option:
     * @event 触发事件
     * @min 最小日期
     * @max 最大日期
     * @format 日期格式
     */

    var Calendar = function (option) {
        this.option = {
            'target': null,               // 触发日历的HTML节点
            'event': 'focus',             // 触发事件
            'min': '',                    // 最小日期
            'max': '',                    // 最大日期
            'format': 'Y-M-D'             // 日期格式
        };

        if (({}).toString.call(option) === '[object Object]') {
            for (var key in option) {
                if (option.hasOwnProperty(key) && option[key]) {
                    this.option[key] = option[key];
                }
            }
        }

        this.selector = null;                  // 下拉菜单对象
        this.dateArr = [];                     // 日期列表

        this.init();
    };

    Calendar.prototype = {
        constructor: Calendar,

        // 设置默认日期
        setDefault: function (year, month, date) {
            var that = this,
                defaultValue = that.selector.defaultValue;

            if (year && month && date) {
                defaultValue.length = 0;

                that.dateArr.forEach(function (yearArr, i) {
                    if (yearArr.name == year) {
                        defaultValue.push(i);

                        yearArr.list.forEach(function (monthArr, j) {
                            if (monthArr.name == month) {
                                defaultValue.push(j);

                                monthArr.list.forEach(function (dateArr, k) {
                                    if (dateArr.name == date) {
                                        defaultValue.push(k);
                                    }
                                });
                            }
                        });
                    }
                });
            }

        },

        // 打开日历
        show: function () {
            this.selector.show();
        },

        // 关闭日历
        hide: function () {
            this.selector.hide();
        },

        init: function () {
            var that = this;
            var option = that.option,            // 日期配置信息
                target = option.target;          // 控件节点

            if (target) {

                // 下拉菜单初始化参数
                var selectParam = {
                    data: that.dateArr,
                    title: ['年', '月', '日'],
                    display: 'name',
                    confirm: function (data) {
                        target.value = Public.getDateString(data[0].name + '/' + data[1].name + '/' + data[2].name, option.format);
                        target.trigger('input');
                        target.trigger('change');
                    }
                };


                var minTime = Public.getDateFromString(option.min);     // 最小日期
                var maxTime = Public.getDateFromString(option.max);     // 最大日期

                var minYear, minMonth, minDate, maxYear, maxMonth, maxDate;

                if (!minTime) {
                    minTime = new Date();
                    minTime.setFullYear(minTime.getFullYear() - 100);
                }

                if (!maxTime) {
                    maxTime = new Date();
                    maxTime.setFullYear(Number(maxTime.getFullYear()) + 100);
                }

                minYear = minTime.getFullYear();                     // 最小年
                minMonth = Number(minTime.getMonth()) + 1;           // 最小月
                minDate = minTime.getDate();                         // 最小日

                maxYear = maxTime.getFullYear();                     // 最大年
                maxMonth = Number(maxTime.getMonth()) + 1;           // 最大月
                maxDate = maxTime.getDate();                         // 最大日


                // 遍历生成
                for (var y = minYear; y <= maxYear; y++) {
                    var year = {
                        name: y,
                        list: []
                    };
                    for (var m = (y == minYear) ? minMonth : 1, max_m_l = (y == maxYear) ? maxMonth : 12; m <= max_m_l; m++) {
                        var month = {
                            name: m,
                            list: []
                        };
                        for (var d = (y == minYear && m == minMonth) ? minDate : 1, max_d_l = (y == maxYear && m == maxMonth) ? maxDate : Public.getMonthDays(y, m); d <= max_d_l; d++) {
                            month.list.push({
                                name: d
                            });
                        }
                        year.list.push(month);
                    }
                    selectParam.data.push(year);
                }


                that.selector = new Selector(selectParam);

                // 点击打开日历
                target.addEventListener(option.event, function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var defaultDate = Public.getDateFromString(target.value) || new Date();
                    that.setDefault(defaultDate.getFullYear(), Number(defaultDate.getMonth()) + 1, defaultDate.getDate());
                    that.show();
                });

            }

        }
    };


    return Calendar;

});