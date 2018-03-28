

module.exports = {
    "local": {
        "debug": 1,                                    // 是否开启调试   0：关闭 1：开启
        "platform": "local",                           // 本地环境 和 58 测试环境
        "ajax_url": "https://mstest.baiyangwang.com/",       // 接口请求的url域名
        "auth_url": "",                                // 微信授权地址
        "cdn_url": "",                                 // 静态资源地址
        "login_appid": "wx204a7e7dba41a742",           // 微信授权appid

        "skin_file": "local.less"                      // 换肤的less文件

    },
    "stg": {
        "debug": 1,
        "platform": "stg",
        "ajax_url": "https://mstest.baiyangwang.com/",
        "auth_url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx1f628d662cfea925&redirect_uri=",
        "cdn_url": "https://wapcdnstg.baiyangwang.com/",
        "login_appid": "wx1f628d662cfea925",

        "skin_file": "local.less"

    },
    "prod": {
        "debug": 0,
        "platform": "prod",
        "ajax_url": "https://mservice.baiyjk.com/",
        "auth_url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx62eaed8770f89f93&redirect_uri=",
        "cdn_url": "https://wapstatic.baiyangwang.com/wap/",
        "login_appid": "wxea88f5e6b8956165",

        "skin_file": "local.less"

    }
};

