/*!
 * @author liyuelong1020@gmail.com
 * @date 15-11-11 下午3:37
 * @version 1.0.0
 * @description 分享插件
 *
 * 支持平台：微信/QQ/QQ浏览器/UC浏览器
 *
 * 使用方法： new Share(config)
 *
 * setShareConfig(config)   // 设置分享参数
 * shareWxTimeLine()        // 分享到微信朋友圈
 * shareWxFriend()          // 分享到微信好友
 * shareSinaWb()            // 分享到新浪微博
 * shareTxWb()              // 分享到腾讯微博
 * shareQzone()             // 分享到QQ空间
 * shareQQ()                // 分享到QQ好友
 *
 *  // 分享配置参数
 * @config [object]
 * {
 *     title: [String]          // 分享标题
 *     description: [String]    // 分享描述
 *     img: [String]            // 分享配图链接
 *     url: [String]            // 分享url
 *     type: [String]           // 分享类型,music、video或link，不填默认为link
 *     dataUrl: [String]        // 如果type是music或video，则要提供数据链接，默认为空
 *     trigger: [Function]      // 分享开始回调
 *     success: [Function]      // 分享成功回调
 *     cancel: [Function]       // 分享取消回调
 *     fail: [Function]         // 分享失败回调
 * }
 */

define('share', ['weixin', 'popup', "base64", 'qrcode'], function (require, exports) {
    var weixin = require('weixin');
    var popup = require('popup');
    var base64 = require('base64');
    var QRCode = require('qrcode');

    var url_jsapi = "//jsapi.qq.com/get?api=app.setShareInfo,app.share",
        url_qqapi = "//open.mobile.qq.com/sdk/qqapi.js?_bid=152",
        url_mdc = "http://mdc.html5.qq.com/d/directdown.jsp?channel_id=10349",
        url_mobile = "http://openmobile.qq.com/api/check2?page=qzshare.html&loginpage=loginindex.html&logintype=qzone",
        url_mqqapi = "mqqapi://share/to_fri?src_type=web&version=1&file_type=news&",
        url_qzone = "mqqapi://share/to_qzone?src_type=app&version=1&file_type=news&req_type=1&",
        url_friend = "mqqapi://share/to_fri?file_type=news&src_type=app&version=1&generalpastboard=1&shareType=1&cflag=1&objectlocation=pasteboard&callback_type=scheme&callback_name=QQ41AF4B2A&";

    var platform = Config.platform;

    var htmlDecode = function (html) {
        return html.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    };

    var getUrlParam = function (url) {
        var param = {};
        var arr = (url || location.search.substr(1)).split('&');
        arr.forEach(function (item) {
            var arr = item.split('=');
            if (arr.length === 2) {
                param[decodeURIComponent(arr[0])] = decodeURIComponent(arr[1]);
            }
        });
        return param;
    };

    var Share = function (options) {
        this.config = {
            title: document.title,
            description: document.title,
            img: '',
            url: location.href,
            state: "index5_show",
            ifMap: {
                wx: "",
                sinaWb: "",
                txWb: "",
                qzone: "",
                qq: ""
            }
        };

        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                this.config[key] = options[key];
            }
        }

        this.config.title = htmlDecode(this.config.title);
        this.config.description = htmlDecode(this.config.description);
        this.shareUrlMap = {};
        this.init();
    };

    Share.prototype = {

        init: function () {
            this._setShareUrlIf();
            this._loadQbWxShareUrl();
            this._initWxshareSet();
            this._initMobileQQShareSet();
            this._setQbShareInfo();
        },

        _setShareUrlIf: function () {
            function getUrl(type) {
                var e = url;
                -1 == href[0].indexOf("g_f=") && (e = href[0] + search + "g_f=" + ifMap[type] + hash);
                return e;
            }

            this._filterShareUrlLogPara();

            var config = this.config,
                url = config.url,
                ifMap = config.ifMap,
                map = this.shareUrlMap,
                href = url.split("#"),
                search = href[0].indexOf("?") > 0 ? "&" : "?",
                hash = href[1] ? "#" + href[1] : "";

            map.wx = ifMap.wx ? getUrl("wx") : url;
            map.sinaWb = ifMap.sinaWb ? getUrl("sinaWb") : url;
            map.txWb = ifMap.txWb ? getUrl("txWb") : url;
            map.qzone = ifMap.qzone ? getUrl("qzone") : url;
            map.oriQQ = ifMap.qq ? getUrl("qq") : url;
            map.qq = this._base64EncodeQQUrl(map.oriQQ);
        },

        // QQ浏览器初始化微信分享
        _loadQbWxShareUrl: function () {
            var that = this;

            if (platform.isFromQQBrower && "undefined" == typeof browser) {
                require.async(url_jsapi, function () {
                    that.otherWxShare()
                })
            } else {
                that.otherWxShare()
            }

        },

        // QQ浏览器设置分享参数
        _setQbShareInfo: function () {
            function setShareInfo() {
                browser.app.setShareInfo({
                    title: config.title,
                    url: config.url,
                    description: config.description,
                    img_url: config.img
                })
            }

            var config = this.config;

            if (platform.isFromQQBrower) {
                if (window.browser && browser.app && browser.app.setShareInfo) {
                    setShareInfo()
                } else {
                    require.async(url_jsapi, function () {
                        window.browser && browser.app && browser.app.setShareInfo && setShareInfo()
                    })
                }
            }

        },

        // 初始化微信分享
        _initWxshareSet: function () {
            var that = this,
                config = that.config,
                param = {
                    title: config.title,
                    desc: config.description,
                    imgUrl: config.img,
                    link: config.url,
                    type: config.type,
                    dataUrl: config.dataUrl,
                    trigger: config.trigger,
                    success: config.success,
                    cancel: config.cancel,
                    fail: config.fail
                };

            /**
             * title    标题，
             * desc     描述文字 ，
             * imgUrl   图片 ，
             * link     分享链接，
             * type     分享类型,music、video或link，不填默认为link
             * dataUrl  如果type是music或video，则要提供数据链接，默认为空
             * trigger  事件触发函数
             * success  成功回调函数
             * cancel   取消回调函数
             * fail     失败回调函数
             *
             */

                // 接口就绪后执行回调函数
            weixin.ready(function () {
                // 分享给朋友
                weixin.onMenuShareAppMessage(param);
                // 分享到朋友圈
                weixin.onMenuShareTimeline(param);
                // 分享到QQ
                weixin.onMenuShareQQ(param);
                // 分享到腾讯微博
                weixin.onMenuShareWeibo(param);
                // 分享到QQ空间
                weixin.onMenuShareQZone(param);
            });
        },

        // 初始化QQ分享
        _initMobileQQShareSet: function () {
            function setShareInfo() {
                mqq.data.setShareInfo({
                    share_url: that.shareUrlMap.oriQQ,
                    title: config.title,
                    desc: config.description,
                    image_url: config.img
                })
            }

            var that = this,
                config = this.config;

            if (platform.isFromQQ) {
                if (window.mqq && mqq.data && mqq.data.setShareInfo) {
                    setShareInfo()
                } else {
                    require.async(url_qqapi, function () {
                        setShareInfo()
                    })
                }
            }

        },

        // 过滤分享链接中的其他参数
        _filterShareUrlLogPara: function () {
            var url = this.config.url,
                param = getUrlParam(url),
                g_f = param.g_f;

            this.config.url = url = url.replace(/([?&])sid=[^&#]*/g, "$1rsid=1")
                .replace(/([?&])i_f=[^&#]*/g, "$1rif=1")
                .replace(/([?&])iarea=[^&#]*/g, "$1rarea=1")
                .replace(/([?&])f_l=[^&#]*/g, "$1rfl=1")
                .replace(/([?&])f_pid=[^&#]*/g, "$1rfpid=1")
                .replace(/([?&])f_aid=[^&#]*/g, "$1rfaid=1")
                .replace(/([?&])f_aid_ext=[^&#]*/g, "$1rfaide=1")
                .replace(/oauth_state=0&/g, "");

            if (!(g_f && [23830, 23916].indexOf(parseInt(g_f)) > -1) && /g_f=/i.test(url)) {
                var hash_arr = url.split("#"),
                    hash = hash_arr[1] ? "#" + hash_arr[1] : "",
                    search = hash_arr[0].split("?"),
                    url_param = [];

                if (search[1]) {
                    var search_arr = search[1].split("&");
                    search_arr.forEach(function (item) {
                        item.indexOf("g_f") < 0 && url_param.push(item)
                    })

                }
                this.config.url = search[0] + "?" + url_param.join("&") + hash
            }
        },

        // 加密QQ分享链接
        _base64EncodeQQUrl: function (text) {
            var config = this.config;
            return url_mqqapi + [
                    "share_id=1101685683",
                    "title=" + base64.encode(config.title),
                    "thirdAppDisplayName=" + base64.encode("百洋商城"),
                    "url=" + base64.encode(text)
                ].join("&");
        },

        // 分享到QQ空间网页版
        _shareWebQzone: function () {
            var config = this.config,
                url = encodeURIComponent(this.shareUrlMap.qzone),
                description = config.description.substring(0, 200),
                href = [
                    "title=" + encodeURIComponent(config.title),
                    "imageUrl=" + encodeURIComponent(config.img),
                    "desc=" + encodeURIComponent(description),
                    "summary=" + encodeURIComponent(description),
                    "url=" + url,
                    "successUrl=" + url,
                    "failUrl=" + url,
                    "callbackUrl=" + url
                ].join("&");

            window.location.href = url_mobile + "&" + href;
        },

        // 唤醒QQ浏览器
        isQbInstalled: function (param) {
            param = param || {};
            var url = param.testUrl || location.href,
                success_call = param.onSucc,
                fail_call = param.onFail,
                stamp = Date.now(),
                index = 0,
                ua = navigator.userAgent,
                version = 0,
                is_from_iphone = ua.match(/iphone\s*os\s*\d\d?/gi);

            if (is_from_iphone) {
                version = parseInt(is_from_iphone[0].split(" ")[2]);
            }

            url = "mttbrowser://url=" + url.replace(/http:\/\//gi, "");

            var check_share = function () {
                stamp += 1e3;
                index += 1;
                if (3 > index) {
                    setTimeout(check_share, 1e3);
                } else if (Math.abs(stamp - Date.now()) > 1e3) {
                    success_call && success_call()
                } else {
                    fail_call && fail_call()
                }

            };

            if (version > 8) {
                location.href = url;
            } else {
                var iframe = document.createElement("iframe");
                iframe.src = url;
                iframe.id = "qbInstallValidator_" + Date.now();
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                setTimeout(check_share, 1e3);
                setTimeout(function () {
                    iframe && iframe.parentNode && iframe.parentNode.removeChild(iframe)
                }, 5e3)
            }

        },

        // 重置分享参数
        setShareConfig: function (config) {
            for (var key in config) {
                if (config.hasOwnProperty(key)) {
                    this.config[key] = config[key];
                }
            }

            this._setShareUrlIf();
            this._initWxshareSet();
            this._setQbShareInfo();
        },

        // qq浏览器分享到微信
        qbWxShare: function (type) {
            var that = this,
                config = this.config;

            window.browser && browser.app && browser.app.share && browser.app.share({
                title: config.title,
                description: config.description,
                url: that.shareUrlMap.wx,
                img_url: config.img,
                to_app: type
            }, function (data) {
                if (1 == data.code) {
                    // 分享成功
                    //config.success();
                } else {
                    // 分享失败
                    //config.fail();
                }

            })
        },

        // UC浏览器分享到微信
        ucWxShare: function (type) {
            var config = this.config,
                wx = this.shareUrlMap.wx,
                from = {
                    ios: "kWeixinFriend",
                    android: "WechatTimeline"
                };

            if (1 == type) {
                from.ios = "kWeixin";
                from.android = "WechatFriends"
            }
            if (platform.isFromIos && ucbrowser) {
                ucbrowser.web_share(config.title, config.description, wx, from.ios, "", "@百洋商城", "")
            } else if (platform.isFromAndroid && ucweb) {
                ucweb.startRequest("shell.page_share", [config.title, config.description, wx, from.android, "", "", ""])
            }

        },

        // 非微信设置微信分享链接
        otherWxShare: function () {
            var that = this,
                param = getUrlParam(),
                isFromQQBrower = platform.isFromQQBrower;

            if (param.fromsharefriend && 1 == param.fromsharefriend && isFromQQBrower) {
                history.replaceState(null, document.title, location.href.replace(/fromsharefriend=1/g, ""));
                setTimeout(function () {
                    that.qbWxShare(1)
                }, 50)
            } else if (param.fromsharetimeline && 1 == param.fromsharetimeline && isFromQQBrower) {
                history.replaceState(null, document.title, location.href.replace(/fromsharetimeline=1/g, ""));
                setTimeout(function () {
                    that.qbWxShare(8)
                }, 50)
            }

        },

        // 唤起微信分享
        callWxShare: function (share_type) {
            var url = this.config.url.split("#"),
                symbol = url[0].indexOf("?") > 0 ? "&" : "?",
                hash = url[1] ? "#" + url[1] : "",
                type = 1 == share_type ? "fromsharefriend=1" : "fromsharetimeline=1",
                href = url[0] + symbol + type + hash;

            if (platform.isFromWx) {
                popup.share()
            } else if (platform.isFromQQ) {
                popup.share()
            } else if (platform.isFromUC) {
                this.ucWxShare(share_type)
            } else if (platform.isFromQQBrower) {
                this.qbWxShare(share_type)
            } else if (platform.isFromQQBrowerLight) {
                location.href = url_mdc;
            } else {
                this.isQbInstalled({
                    testUrl: href,
                    onSucc: function () {

                    },
                    onFail: function () {
                        location.href = url_mdc
                    }
                })
            }

        },

        // 分享到微信朋友圈
        shareWxTimeLine: function () {
            this.callWxShare(8)
        },

        // 分享到微信好友
        shareWxFriend: function () {
            this.callWxShare(1)
        },

        // 分享到新浪微博
        shareSinaWb: function () {
            var config = this.config;
            // 新浪微博分享链接
            var linkStr = "http://service.weibo.com/share/mobile.php?";
            // 微博分享参数
            var paramStr = [];

            // 分享至微博
            config.description && paramStr.push("title=" + encodeURIComponent(config.description));
            config.url && paramStr.push("url=" + encodeURIComponent(config.url));
            config.img && paramStr.push("pic=" + encodeURIComponent(config.img));

            if (platform.isFromWx || platform.isFromQQ) {
                setTimeout(function () {
                    window.location = linkStr + paramStr.join('&');
                }, 0);
            } else {
                window.open(linkStr + paramStr.join('&'));
            }

        },

        // 分享到腾讯微博
        shareTxWb: function () {
            var config = this.config;
            // 腾讯微博分享链接
            var linkStr = "http://share.v.t.qq.com/index.php?c=share&a=index&";
            // 微博分享参数
            var paramStr = [];

            // 分享至微博
            config.description && paramStr.push("title=" + encodeURIComponent(config.description));
            config.url && paramStr.push("url=" + encodeURIComponent(config.url));
            config.img && paramStr.push("pic=" + encodeURIComponent(config.img));

            if (platform.isFromWx || platform.isFromQQ) {
                setTimeout(function () {
                    window.location = linkStr + paramStr.join('&');
                }, 0);
            } else {
                window.open(linkStr + paramStr.join('&'));
            }
        },

        // 分享到qq空间
        shareQzone: function () {
            var temp_div, timer, stamp, that = this,
                config = this.config,
                img = base64.encode(config.img),
                title = base64.encode(config.title),
                description = base64.encode(config.description.substring(0, 200)),
                qzone = base64.encode(this.shareUrlMap.qzone),
                web = base64.encode("百洋商城"),
                url = url_qzone + ["image_url=" + img, "title=" + title, "description=" + description, "url=" + qzone, "app_name=" + web].join("&");

            if (platform.isFromIos) {
                url = url_friend + [
                        "description=" + description,
                        "url=" + qzone,
                        "title=" + title,
                        "thirdAppDisplayName=" + web,
                        "previewimageUrl=" + img
                    ].join("&");
            }

            if (platform.isFromQQBrower) {
                this.callWxShare(3);
            } else {
                stamp = Date.now();

                if (platform.isFromAndroid && platform.isFromUC) {
                    temp_div = document.createElement("div");
                    temp_div.style.visibility = "hidden";
                    temp_div.innerHTML = '<iframe src="' + url + '" scrolling="no" width="1" height="1"></iframe>';
                    document.body.appendChild(temp_div);
                    setTimeout(function () {
                        that._shareWebQzone();
                        temp_div && temp_div.parentNode && temp_div.parentNode.removeChild(temp_div)
                    }, 3e3);
                } else if (platform.isFromQQBrowerLight) {
                    that._shareWebQzone()
                } else {
                    location.href = url;
                    timer = setTimeout(function () {
                        var t = Date.now() - stamp;
                        1e3 > t && that._shareWebQzone()
                    }, 1e3)
                }
            }

        },

        // 分享到qq好友
        shareQQ: function () {
            var url_qq = this.shareUrlMap.qq,
                div = null;
            if (platform.isFromWx) {
                popup.share();
            } else if (platform.isFromQQ) {
                popup.share();
            } else if (platform.isFromQQBrower) {
                this.qbWxShare(4)
            } else if (platform.isFromQQBrowerLight) {
                location.href = url_mdc;
            } else if (platform.isFromAndroid && platform.isFromUC) {
                div = document.createElement("div");
                div.style.visibility = "hidden";
                div.innerHTML = '<iframe src="' + url_qq + '" scrolling="no" width="1" height="1"></iframe>';
                document.body.appendChild(div);
                setTimeout(function () {
                    div && div.parentNode && div.parentNode.removeChild(div);
                }, 5e3)
            } else {
                location.href = url_qq;
            }

        }
    };

    return (function () {

        var share,                       // 分享对象
            dialog,                      // 分享弹窗
            is_code_share = false,       // 是否显示二维码
            html = document.documentElement;

        // 显示分享弹窗
        var showDialog = function() {
            dialog.classList.remove('hide');
            html.classList.add('fixed-popup');
        };

        // 关闭分享弹窗
        var hideDialog = function() {
            is_code_share = false;
            dialog.classList.add('hide');
            html.classList.remove('fixed-popup');
        };

        // 初始化分享弹窗/绑定事件
        var createPopup = function () {
            dialog = document.createElement('div');
            dialog.className = 'popup popup-bonus-share hide';
            dialog.innerHTML = '<div class="popup-content-share">' +
                '<div class="share-list" id="share-list">' +
                '<ul>' +
                '<li><a href="javascript:;" id="share-wf"><i class="icon icon-share-wf"></i><span>微信好友</span></a></li>' +
                '<li><a href="javascript:;" id="share-wp"><i class="icon icon-share-wp"></i><span>朋友圈</span></a></li>' +
                '<li><a href="javascript:;" id="share-qf"><i class="icon icon-share-qf"></i><span>QQ好友</span></a></li>' +
                '<li><a href="javascript:;" id="share-qk"><i class="icon icon-share-qk"></i><span>QQ空间</span></a></li>' +
                '<li><a href="javascript:;" id="share-weibo"><i class="icon icon-share-weibo"></i><span>微博</span></a></li>' +
                '<li><a href="javascript:;" id="share-code"><i class="icon icon-share-code"></i><span>二维码</span></a></li>' +
                '</ul>' +
                '</div>' +
                '<div class="hide share-code" id="share-qrcode">' +
                '<div class="share-code-pic" id="qrcode"></div>' +
                '</div>' +
                '<a class="close-cancel-btn" href="javascript:;" id="cancel-btn">取消</a>' +
                '</div>' +
                '<i class="layout" id="close-btn"></i>';

            document.body.appendChild(dialog);

            var $ = function (selector) {
                return dialog.querySelector(selector);
            };

            var share_list = $('#share-list');
            var share_qrcode = $('#share-qrcode');

            var qrcode = $('#qrcode');

            // 二维码对象
            var bonus_code = new QRCode(qrcode);

            // 分享到微信好友
            $('#share-wf').addEventListener('click', function () {
                share.shareWxFriend();
            });
            // 分享到微信朋友圈
            $('#share-wp').addEventListener('click', function () {
                share.shareWxTimeLine();
            });
            // 分享到QQ好友
            $('#share-qf').addEventListener('click', function () {
                share.shareQQ();
            });
            // 分享到QQ空间
            $('#share-qk').addEventListener('click', function () {
                share.shareQzone();
            });
            // 分享到新浪微博
            $('#share-weibo').addEventListener('click', function () {
                share.shareSinaWb();
            });
            // 二维码分享
            $('#share-code').addEventListener('click', function () {
                is_code_share = true;
                bonus_code.clear();
                bonus_code.makeCode(share.config.url);   //生成二维码

                share_list.classList.add('hide');
                share_qrcode.classList.remove('hide');
            });

            // 取消按钮
            $('#cancel-btn').addEventListener('click', function () {
                if (is_code_share) {
                    is_code_share = false;

                    share_list.classList.remove('hide');
                    share_qrcode.classList.add('hide');

                } else {
                    hideDialog();
                }
            });

            // 点击遮罩关闭分享弹窗
            $('#close-btn').addEventListener('click', function () {
                hideDialog();
                share_list.classList.remove('hide');
                share_qrcode.classList.add('hide');
            });

        };


        return function (config) {

            if (!share) {   // 如果没有初始化分享对象则初始化
                share = new Share(config);
            } else {       // 设置分享参数
                share.setShareConfig(config);
            }

            if (!dialog) {               // 初始化分享弹窗
                createPopup();
            }

            return {
                share: share,
                show: function() {
                    if(platform.isFromWx || platform.isFromQQ){   //微信/QQ内
                        popup.share();
                    } else {
                        showDialog();
                    }
                },
                hide: hideDialog,
                config: function(config) {
                    share.setShareConfig(config);
                }
            }
        };
    })();

});