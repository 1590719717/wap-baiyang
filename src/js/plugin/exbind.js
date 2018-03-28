/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/1
 * @version 1.0.0
 */

define('exbind', [], function(require, exports) {

    // 遍历对象方法
    var forEachIn = function(object, callback) {
        for(var i in object){
            if(object.hasOwnProperty(i)){
                callback(i, object[i]);
            }
        }
    };

    // 判断是否是对象
    var isObject = function (obj) {
        return ({}).toString.call(obj) === "[object Object]"
    };
    // 判断是否是数组
    var isArray = Array.isArray || function (obj) {
            return ({}).toString.call(obj) === '[object Array]';
        };
    // 判断是否是字符串
    var isString = function (obj) {
        return ({}).toString.call(obj) === "[object String]"
    };
    // 判断是否是函数
    var isFunction = function (obj) {
        return ({}).toString.call(obj) === "[object Function]"
    };

    // 获取节点方法
    var getAct = function(str) {
        var actArr = String(str || '').split(',');
        return actArr.map(function(item) {
            return item.trim();
        });
    };

    // 获取节点参数
    var getParam = function(str) {
        var param = {};
        (str || '').split('&').forEach(function(paramStr) {
            var index = paramStr.indexOf('=', 0);
            if(index > 0 && index < paramStr.length - 1){
                var name = paramStr.substring(0, index).trim();
                param[name] = paramStr.substring(index + 1, paramStr.length).trim();
            }
        });
        return param;
    };

    // HTML节点控件对象
    var Act = function(node, actArr, param) {
        this.node = node;                               // 绑定控件的节点
        this.actArr = actArr;                           // 控件数组
        this.param = isObject(param) ? param : null;    // 节点参数
        this.isLock = false;                            // 是否锁定
    };
    Act.prototype.bind = function(event, eventMap) {
        var that = this;

        // 执行事件链
        var execute = function(e) {
            var index = 0;

            var data = {
                // 停止执行事件链
                stop: function() {
                    that.isLock = true;
                },
                // 继续执行事件链
                next: function() {
                    that.isLock = false;
                    next();
                },
                param: that.param
            };

            // 执行下一个事件
            var next = function() {
                while(!eventMap[that.actArr[index]] && index < that.actArr.length) {
                    index++;
                }

                if(index < that.actArr.length){
                    eventMap[that.actArr[index]].call(that.node, data, e);

                    if(event === 'load'){
                        that.actArr.splice(index, 1);
                    } else {
                        index++;
                    }

                    if(!that.isLock){
                        next();
                    }
                }
            };

            if(!that.isLock){
                next();
            }
        };

        if(event === 'load'){
            // 如果是load事件则立刻执行
            setTimeout(function() {
                execute();
            }, 0);
        } else if(!that.event){
            // 避免重复绑定
            that.event = true;
            that.node.addEventListener(event, execute, false);
        }
    };

    //
    var ExBindFrame = function () {
        this.actMap = {};            // 控件对应NODE节点字典
        this.eventMap = {};          // 事件对应控件回调字典
        this.init();
    };
    ExBindFrame.prototype = {
        constructor: ExBindFrame,

        // 注册控件
        register: function(actName, event, call) {
            var that = this;
            if(isString(actName) && isString(event) && isFunction(call)){
                if(!that.eventMap[event]){
                    that.eventMap[event] = {};
                }
                // 将控件回调方法存根据事件存储在字典
                if(!that.eventMap[event][actName]){
                    that.eventMap[event][actName] = call;
                    // 绑定事件
                    if(that.actMap[actName] && that.actMap[actName].length){
                        that.actMap[actName].forEach(function(nodeObj) {
                            nodeObj.bind(event, that.eventMap[event]);
                        });
                    }
                }
            }
        },

        // 注册节点
        registerNode: function(node, actArr, param) {
            var that = this;
            // 控件名称数组
            actArr = actArr || getAct(node.getAttribute('data-act') || '');
            // 参数
            param = param || getParam(node.getAttribute('data-param') || '');

            if(isArray(actArr)){
                // 创建控件对象
                var nodeObj = new Act(node, actArr, param);

                // 将控件存储在控件字典
                actArr.forEach(function(act) {
                    if(isString(act)){
                        if(!that.actMap[act]){
                            that.actMap[act] = [];
                        }
                        that.actMap[act].push(nodeObj);

                        // 绑定事件
                        forEachIn(that.eventMap, function(event, eventMap) {
                            if(eventMap[act]){
                                nodeObj.bind(event, eventMap);
                            }
                        });
                    }
                });
            }

            node.removeAttribute('data-act');
            node.removeAttribute('data-param');
        },

        // 扫描节点
        scan: function(elem) {
            var that = this;
            elem = elem || document.body;

            if(elem.nodeType === 1) {
                // 遍历节点
                var nodes = elem.querySelectorAll('[data-act]');

                if(elem.hasAttribute('data-act')){
                    that.registerNode(elem);
                }
                // 获取节点绑定的控件名称和参数
                [].slice.call(nodes).forEach(function(node) {
                    that.registerNode(node);
                });
            }
        },

        // 初始化事件
        init: function() {
            var that = this;
            that.scan();

            // 监听HTML节点变动
            //var MutationObserver = window.MutationObserver
            //    || window.WebKitMutationObserver
            //    || window.MozMutationObserver;
            //var observer = new MutationObserver(function(mutations) {
            //    (function(mutations) {
            //        setTimeout(function() {
            //            mutations.forEach(function(mutation) {
            //                if(mutation.addedNodes && mutation.addedNodes.length) {
            //                    for(var i = 0, len = mutation.addedNodes.length; i < len; i++) {
            //                        that.scan(mutation.addedNodes[i]);
            //                    }
            //                }
            //            });
            //        }, 0);
            //    })(mutations);
            //});
            //observer.observe(document.body, {
            //    'childList': true,
            //    'characterData': true,
            //    'subtree':true
            //});

            var nodeArr = [], timer = null;
            document.addEventListener('DOMNodeInserted',function(e){
                nodeArr.push(e.target);
                clearTimeout(timer);
                timer = setTimeout(function() {
                    var newArr = [];

                    nodeArr.forEach(function(node) {
                        if(node.nodeType == 1 && newArr.indexOf(node) < 0){
                            newArr.push(node);
                        }
                    });
                    nodeArr.length = 0;

                    newArr.forEach(function(node) {
                        that.scan(node);
                    });
                }, 100);
            });
        }

    };

    return new ExBindFrame();
});
