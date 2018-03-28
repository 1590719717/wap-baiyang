/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/27 027
 * @description 主题管理
 */

(function(win, dom, ls) {

    // 主题名称
    var skin_name;

    try {
        skin_name = ls['__skin_name__'] || '';
    } catch (e) {
        skin_name = 'default';
    }

    var scripts = dom.scripts,
        head = document.head || document.querySelector('head') || document.documentElement,
        script = scripts[scripts.length - 1],
        src = script.getAttribute("src"),
        // 版本号
        version = '{{Config.version}}',
        // 资源目录
        dir = src = src.match(/[^?#]*\//)[0];


    var id = Date.now();

    if(skin_name){
        dom.write('<link rel="stylesheet" id="' + id + '" href="' + dir + skin_name + '/css/skin.css?v=' + version + '"/>');
    }

     //接口请求后台主题
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {

        if(xhr.readyState === 4){

            xhr.onreadystatechange = null;

            if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                var data;
                try {
                    data = JSON.parse(xhr.response || xhr.responseText);
                } catch (e) {
                    data = null;
                }

                if(data && data.code == 200){

                    var skin = data.data && data.data.path ? data.data.path : '';

                    if(skin != skin_name){
                        // 如果主题跟现在主题不同则切换到新主题
                        skin_name = skin;

                        var old_style = dom.getElementById(id);
                        old_style && head.removeChild(old_style);

                        if(skin_name){
                            var link = dom.createElement('link');
                            link.setAttribute('rel', 'stylesheet');
                            link.setAttribute('href', dir + skin_name + '/css/skin.css?v=' + version);
                            head.appendChild(link);
                        }


                        try {
                            ls['__skin_name__'] = skin_name;
                        } catch (e) {}
                    }

                }
            }
        }
    };

    xhr.responseType = 'text';
    xhr.open('POST', '{{Config.ajax_url}}wap/wap_theme/get_theme', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(null);

})(window, document, localStorage);


