/*!
 * @author liyuelong1020@gmail.com
 * @date 15-6-17 上午9:57
 * @version 1.0.0
 * @description 手机端控制台
 */

define('log', [], function(require, exports) {
    var log, textarea, icon, input, button;
    var isHidden = true, isCreate = false;

    var isDebug = Config.debug;

    // 显示弹窗
    var showLog = function() {
        textarea.style.display = 'block';
        input.style.display = 'block';
        button.style.display = 'block';
        icon.innerHTML = '&times;';
        icon.style.left = 'auto';
        icon.style.right = 0;
        isHidden = false;
    };

    // 隐藏弹窗
    var hideLog = function() {
        textarea.style.display = 'none';
        input.style.display = 'none';
        button.style.display = 'none';
        icon.style.left = 0;
        icon.style.right = 'auto';
        icon.innerHTML = '&gt;';
        isHidden = true;
    };

    // 创建弹窗
    var createLog = function() {

        // 代码执行框
        input = document.createElement('input');
        input.type = 'text';

        // 执行按钮
        button = document.createElement('button');
        button.type = 'button';
        button.innerText = '执行';

        // 输出框
        textarea = document.createElement('textarea');
        icon = document.createElement('i');
        log = document.createElement('div');
        icon.innerHTML = '&times;';

        // 样式设置
        textarea.style.cssText = 'border: 0;margin: 0;padding: 0;resize: none;background: #000;color: #fff;width: 100%;height: 5rem;color: #fff;font: 400 0.75rem/1rem "sans-serif";vertical-align: top;';
        input.style.cssText = 'box-sizing: border-box;border: 1px solid #333;width: 100%;height: 2rem;line-height: 2rem;padding: 0;margin: 0;display: block;background: #f0f0f0;color: #666;font-size: 1rem;';
        button.style.cssText = 'width: 4rem;height: 2rem;text-align: center;line-height: 2rem;color: #666;position: absolute;right: 0;bottom: 0;font-size: 1rem;padding: 0;';
        icon.style.cssText = 'position: absolute;right: 0; top: 100%;display: block;width: 1.2rem;height: 1.2rem;background-color: #fff;box-shadow: 0 0 2px 2px #eee inset;color: #000;font: 400 0.75rem/1.2rem "sans-serif";text-align: center;';
        log.style.cssText = 'position: absolute;z-index: 9999;width: 100%;left: 0;font-size: 0;top: 0';

        log.appendChild(textarea);
        log.appendChild(input);
        log.appendChild(button);
        log.appendChild(icon);
        document.body.appendChild(log);

        isHidden = false;

        // 点击执行调试代码
        button.addEventListener('click', function(e) {
            var code = input.value;
            print_log((new Function('try{return ' + code.replace(/console\.\w+/, 'print_log') + '} catch(e) {return "' + code + '"}')).call(window));
        }, false);

        // 点击打开/关闭调试窗
        icon.addEventListener('click', function(e) {
            if(!isHidden){
                hideLog();
            } else {
                showLog();
            }
        }, false);

        isCreate = true;
    };

    // 类型判断
    var is = function(name, obj) {
        return Object.prototype.toString.call(obj) === '[object ' + name + ']';
    };
    // 对象遍历
    var forEachIn = function(object, callback) {
        for(var key in object){
            if(object.hasOwnProperty(key)){
                callback(key, object[key]);
            }
        }
    };

    // 对象格式化
    var stringify = function(object) {
        if(is('String', object) || is('Number', object) || is('Boolean', object)){
            return String(object);
        } else if(is('Array', object)){
            return '[' + object.join(',') + ']';
        } else if(object instanceof Element) {
            return object.outerHTML;
        } else {
            var param = {};

            forEachIn(object, function(key, value) {
                if(is('String', value) || is('Number', value) || is('Boolean', value)){
                    param[key] = String(value);
                } else if(is('Array', value)){
                    param[key] = '[' + value.join(',') + ']';
                } else if(value instanceof Element) {
                    param[key] = value.outerHTML;
                } else {
                    param[key] = String(value);
                }
            });

            return JSON.stringify(param, null , '    ');
        }

    };

    var print_log = function(obj) {

        if(isDebug){

            var val = '';
            [].slice.call(arguments).forEach(function(arg) {
                val += stringify(arg) + '\n';
            });

            textarea.value = val + '\n---------------------------------\n' + textarea.value;

            if(isHidden){
                showLog();
            }

        }


    };

    // url传递调试参数
    if(isDebug){

        // 创建调试窗口
        createLog();
        hideLog();

        // 赋值给全局变量
        window.print_log = print_log;

        // 调试模式参数
        var debug_code = decodeURI((location.search.substr(1).match(/(^|&)debug=([^&]*)(&|$)/) || [])[2] || '');

        if(debug_code){
            input.value = debug_code;
            print_log((new Function('try{return ' + debug_code.replace(/console\.\w+/, 'print_log') + '} catch(e) {return "' + debug_code + '"}')).call(window));
        }
    }

    return print_log;

});
