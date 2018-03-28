/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/9/14 014
 * @description 仿ios联动下拉菜单
 */

define('selector', [], function (require, exports) {

    /*
    * {
    *   data: ''                // array 数据
    *   className: ''           // string 类名
    *   title: []               // array(string...) 标题数组
    *   defaultValue: []        // array(int...) 数组默认值index
    *   display: ''             // string 默认显示出来的字段
    *   cancel: function() {}   // function 取消回调函数
    *   confirm: function() {}  // function 确认回调函数
    * }
    * */
    var Selector = function(param) {
        this.param = param;       // 参数

        this.is_ready = false;    // 是否渲染节点

        this.defaultValue = param.defaultValue || [];          // 默认选择值 int 序号

        this.row = null;           // 下拉菜单父层
        this.cells = [];           // 下拉菜单列数组

        this.init();              // 初始化
    };

    Selector.prototype = {
        constructor: Selector,

        // 获取滚动结果
        get_result: function() {
            var that = this,
                data = that.param.data,             // 需要渲染的数据
                defaultValue = that.defaultValue,
                result = [],
                flag = 0;

            // 根据当前菜单返回具体值
            var get_result = function(data) {

                if(defaultValue[flag] > -1){
                    var defaultData = data[defaultValue[flag]];
                    result.push(defaultData);

                    for(var key in defaultData) {
                        if(defaultData.hasOwnProperty(key) && Array.isArray(defaultData[key])){
                            flag++;
                            get_result(defaultData[key]);
                        }
                    }

                }
            };

            get_result(data);

            return result;
        },

        // 获取到当前值的index位置信息
        get_position: function() {
            var that = this;

            clearTimeout(that.result_timer);

            that.result_timer = setTimeout(function() {
                var defaultValue = that.defaultValue;
                defaultValue.length = 0;

                that.cells.forEach(function(cell) {
                    // 根据高度值计算当前标签的index
                    var index = Math.round(cell.scrollTop / that.pxHeight);
                    defaultValue.push(index);
                });

                that.render();             // 刷新菜单
                that.set_position();       // 滚动列表
            }, 0);
        },

        // 定位滚动
        set_position: function() {
            var that = this;
            var defaultValue = that.defaultValue;

            that.cells.forEach(function(cell, i) {
                var index = 0;
                var list = cell.children;

                // 使用默认值
                if(defaultValue && defaultValue[i] > -1){
                    index = defaultValue[i];
                }

                // 默认值范围错误修正
                if(index >= list.length - 3) {
                    index = list.length - 3;
                }

                cell.scrollTop = that.pxHeight * index;

                // 给当前值节点添加样式
                if(cell.active_child){
                    cell.active_child.classList.remove('active');
                }
                cell.active_child = cell.children[index + 2];
                cell.active_child.classList.add('active');
            });
        },

        // 生成下拉菜单
        render: function() {
            var that = this,
                param = that.param,
                data = param.data,             // 需要渲染的数据
                name = param.display || 'name',          // 显示的名称
                flag = 0,
                defaultValue = that.defaultValue;

            // 遍历数据将数组渲染成列
            var renderCell = function(array) {
                var cell = that.cells[flag];

                // 如果没有列则生成新的列
                if(!cell) {
                    cell = document.createElement('div');
                    cell.className = 'selector-cell';
                    that.cells.push(cell);
                    that.row.appendChild(cell);
                }

                // 遍历生成下拉节点
                var html = '<span>&nbsp;</span><span>&nbsp;</span>',
                    defaultData;

                if(defaultValue && defaultValue[flag] > -1 && array[defaultValue[flag]]){
                    defaultData = array[defaultValue[flag]];
                } else {
                    defaultData = array[0];
                }

                array.forEach(function(cell) {
                    html += '<span>' + cell[name] + '</span>';
                });
                html += '<span>&nbsp;</span><span>&nbsp;</span>';

                cell.innerHTML = html;

                // 遍历数据对象，将数组对象渲染出来
                for(var key in defaultData) {
                    if(defaultData.hasOwnProperty(key) && Array.isArray(defaultData[key])){
                        flag++;
                        renderCell(defaultData[key]);
                    }
                }
            };

            renderCell(data);
        },

        // 打开联动菜单
        show: function() {
            var that = this;

            that.wrap.style.display = 'block';

            // 如果没有生成则生成列表
            if(!that.is_ready) {
                that.render();

                // 计算每个单元格的高度
                if(!that.pxHeight){
                    var cell = that.cells[0];
                    that.pxHeight = cell.scrollHeight / cell.children.length;
                }

                that.set_position();       // 滚动列表

                // 绑定滑屏事件
                that.cells.forEach(function(cell) {
                    var timer = null, is_touch = false, is_scroll = false;

                    // 样式调整
                    cell.style.width = 100 / that.cells.length + '%';

                    // 滑动选择
                    cell.addEventListener('scroll', function() {
                        is_scroll = true;

                        clearTimeout(timer);
                        timer = setTimeout(function() {
                            is_scroll = false;
                            !is_touch && that.get_position();
                        }, 100);
                    });

                    var swipeHandler = function(e) {
                        switch(e.type) {
                            case 'touchstart':
                                is_touch = true;
                                break;
                            case 'touchcancel':
                            case 'touchend':
                                is_touch = false;
                                !is_scroll && that.get_position();
                        }
                    };
                    cell.addEventListener('touchstart', swipeHandler, false);
                    cell.addEventListener('touchend', swipeHandler, false);
                    cell.addEventListener('touchcancel', swipeHandler, false);
                });
            }

            if(that.defaultValue.length == 0){
                that.get_position();
            }
        },

        // 关闭联动菜单
        hide: function() {
            this.wrap.style.display = 'none';
        },

        init: function() {
            var that = this,
                param = that.param;

            if(param && param.data){

                // 生成节点
                var wrap = document.createElement('div');
                wrap.className = 'popup-selector ' + (param.className || '');

                var html = '<div class="selector-content">' +
                                '<div class="selector-bar">' +
                                    '<a href="javascript:;" class="btn-cancel">关闭</a>' +
                                    '<a href="javascript:;" class="btn-confirm">完成</a>' +
                                '</div>';

                // 使用标题
                if(param.title && param.title.length){
                    html +=  '<div class="selector-title">';
                    param.title.forEach(function(title) {
                        html +=  '<span>' + title + '</span>';
                    });
                    html +=  '</div>';
                }

                html += '<div class="selector-current"></div>' +
                            '<div class="selector-row">' +
                        '</div></div>';

                wrap.innerHTML = html;

                that.wrap = wrap;
                document.body.appendChild(wrap);

                that.row = wrap.querySelector('.selector-row');

                // 点击选择地区
                wrap.querySelector('.btn-confirm').addEventListener('click', function() {
                    that.hide();
                    param.confirm && param.confirm(that.get_result());
                });

                // 点击关闭
                wrap.querySelector('.btn-cancel').addEventListener('click', function() {
                    that.hide();
                    param.cancel && param.cancel();
                });

            }

        }
    };

    return Selector;

});