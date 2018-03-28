/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/25 025
 * @description 账户管理
 */

define('user-account',['member', 'popup', 'public', 'widget', 'image-manage', 'mvvm','ajax'],function (require, exports) {
    var member = require('member');
    var popup = require('popup');
    var widget = require('widget');
    var image_manage = require('image-manage');
    var MVVM = require('mvvm');
    var Public = require('public');
    var ajax = require('ajax');

    var parten = /[@#$%^&!！*()+{}（）:'"“”’‘<>=?？。、.,，《》/]/;

    // 根据参数跳转栏目
    var pageRouter = (function() {
        var currentPage = null;
        var columns = [
            document.getElementById('wrap-index'),
            document.getElementById('wrap-nick'),
            document.getElementById('wrap-gender'),
            document.getElementById('wrap-baby')
        ];

        return function(param) {
            currentPage && currentPage.classList.add('hide');
            if(param.page == 'nick'){
                // 修改昵称
                currentPage = columns[1];
                vmData.page_title = '修改昵称' ;
                currentPage.classList.remove('hide');

            } else if(param.page == 'gender') {
                // 修改性别
                vmData.sex = vmData.gender ;
                currentPage = columns[2];
                vmData.page_title = '修改性别' ;
                currentPage.classList.remove('hide');

            } else if(param.page == 'baby') {
                // 完善宝宝资料
                vmData.identity_baby_id = vmData.identity_id ;
                vmData.baby_time = vmData.baby_flag ;
                currentPage = columns[3];
                vmData.page_title = '完善宝宝资料' ;
                currentPage.classList.remove('hide');
            } else {
                // 账户管理首页
                currentPage = columns[0];
                vmData.page_title = '账号管理' ;
                currentPage.classList.remove('hide');
            }
        }
    })();

    var vmData = MVVM.define('user-account', {
        is_ready: 0,

        portrait: '',               // 头像
        nick_name: '',              // 昵称
        gender: 3,                 // 性别 1:女 2:男 3:保密     账号管理获取的参数
        birthday: '',               // 出生日期
        identity_id: '',            // 妈妈身份id  3：已有宝宝 2:我是准妈妈 1:正在备孕      账户管理首页
        baby_time: '',              // 宝宝时间  如：2015-10-1
        sex : 3,                   // 性别 1:女 2:男 3:保密      修改性别的参数
        identity_baby_id: '',      // 完善宝宝资料  3：已有宝宝 2:我是准妈妈 1:正在备孕
        baby_flag : '' ,           // 原始的baby_time
        is_from_wechat: Config.platform.isFromWx,     // 是否在微信内

        // 页面跳转
        pageRouter: pageRouter,
        // 页面标题
        page_title: '账号管理',

        // 获取性别
        getGender: function(gender) {
            if(gender == 1){
                return '女'
            } else if(gender == 2){
                return '男'
            } else {
                return '保密'
            }
        },
        // 修改性别
        modifyGender: function() {
            vmData.gender = vmData.sex ;
            updateUserInfo({
                gender: vmData.sex
            }, function() {
                window.history.back();
            });
        },

        // 获取生日
        getBirthday: function(birthday) {
            return Public.getDateString(birthday, 'Y-M-D');
        },
        // 修改生日
        modifyBirthday: function() {
            setTimeout(function() {
                updateUserInfo({
                    birthday: Public.getDateString(vmData.birthday, 'Y-M-D')
                });
            }, 100);
        },

        // 获取宝宝资料
        getBaby: function(identity_id) {
            if(identity_id == 3){
                return '已有宝宝'
            } else if(identity_id == 2){
                return '我是准妈妈'
            } else if(identity_id == 1){
                return '正在备孕'
            } else {
                return ''
            }
        },

        // 重新设置baby_time
        resetBabytime: function(){
           vmData.baby_time = '' ;
        },

        // 新昵称
        new_nick: '',
        // 修改新昵称
        modifyNick: function() {

            if(!vmData.new_nick){
                popup.error('请输入昵称！');
                return;
            }

            var len = 0;
            for (var i=0; i<vmData.new_nick.length; i++) {
                if (vmData.new_nick.charCodeAt(i)>127 || vmData.new_nick.charCodeAt(i)==94) {
                    len += 2;
                } else {
                    len ++;
                }
            }

            if(len > 20) {
                popup.error('昵称超过指定长度！');
            } else if(len < 4){
                popup.error('昵称不能少于4个字符');
            } else if(parten.test(vmData.new_nick)){
                popup.error('昵称不能出现非法字符');
            }else if( vmData.new_nick.match(/\ud83c[\udf00-\udfff]|\ud83d[\udc00-\ude4f]|\ud83d[\ude80-\udeff]/g) != null || vmData.new_nick.match(/[\ue000-\uefff ]/g) != null   ){
                popup.error('昵称不能出现非法字符');
            }else if( /[\u4e00-\u9fa5A-Za-z0-9_\-]{1,}/.test(vmData.new_nick) ) {
                updateUserInfo({
                    nick_name: vmData.new_nick
                }, function() {
                    window.history.back();
                    vmData.new_nick = '' ;
                });

            } else {
                popup.error('昵称格式错误');
            }
        },

        // 保存宝宝资料
        modifyBaby: function() {
            if(vmData.baby_time) {
                updateUserInfo({
                    identity_id: vmData.identity_baby_id,
                    baby_time: Public.getDateString(vmData.baby_time, 'Y-M-D', true)
                }, function() {
                    window.history.back();
                });

            } else if(vmData.identity_baby_id == 1) {
                updateUserInfo({
                    identity_id: vmData.identity_baby_id
                }, function() {
                    window.history.back();
                });
            } else if(vmData.identity_baby_id == 2) {
                popup.error('请选择宝宝的预产日期！');
            } else if(vmData.identity_baby_id == 3) {
                popup.error('请选择宝宝的出生日期！');
            }
        },

        // 退出按钮变灰
        isDisabled: false,

        // 退出登录
        logout : function() {
            !vmData.isDisabled && popup.confirm('是否确定退出登录状态',function() {
                vmData.isDisabled = true;

                member.logout(function(data) {
                    if(data && data.code == 200){
                        window.location.replace('index.html') ;
                    }
                }) ;
            });
        },

        // 微信内 解绑解绑账号
        tiedAccount: function() {
            !vmData.isDisabled && popup.confirm('确定要解绑当前账户吗？', function() {

                vmData.isDisabled = true;

                popup.loading('show');
                member.logout(function(data) {
                    popup.loading('hide');

                    if(data && data.code == 200){

                        popup.success('解绑成功！', function() {
                            window.location.replace('index.html') ;
                        });

                    } else {
                        popup.error(data ? data.message : '解绑失败！');
                    }
                });

            })
        }
    });

    // 获取账户管理数据
    var getUserInfo = function() {
        // 获取账户管理数据
        popup.loading('show');
        ajax({
            type: 'post',
            url: Config.url + 'wap/user_center/user_info',
            data: {
                token: member.token
            },
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');
                if(data && data.code == 200){
                    vmData.is_ready = 1;

                    for(var key in data.data){
                        if(data.data.hasOwnProperty(key)){
                            vmData[key] = data.data[key];
                        }
                    }
                    if(vmData.gender == '0'){
                        vmData.gender = 3 ;
                    }
                    if(vmData.baby_time) {
                        vmData.baby_flag = vmData.baby_time ;
                    }
                    vmData.sex = vmData.gender;
                    vmData.identity_baby_id = vmData.identity_id ;

                } else if(data && data.code == 201) {
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));

                } else {
                    popup.error(data ? data.message : '信息加载失败！');
                }
            },
            error: function() {
                popup.error('信息加载失败！');
            }
        });
    };


    // 更新用户信息
    var updateUserInfo = function(param, callback) {
        popup.loading('show');
        param.token = member.token;
        ajax({
            type: 'post',
            url: Config.url + 'wap/user_center/user_info_update',
            data: param,
            dataType: 'json',
            success: function(data) {
                popup.loading('hide');
                if(data && data.code == 200){

                    // 回到账户管理首页
                    callback && callback();

                    getUserInfo();
                } else if(data && data.code == 201) {
                    window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
                } else {
                    popup.error(data ? data.message : '信息修改失败！');
                }
            },
            error: function() {
                popup.error('信息修改失败！');
            }
        });
    };


    // 照片修改表单
    document.getElementById('user-photo').addEventListener('change', function(e) {
        var file = this.files[0];

        if(file){
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    // 压缩图片大小
                    image_manage(img, 100, 100, function(canvas) {
                        updateUserInfo({
                            avatar: canvas.toDataURL('image/png').split(',')[1]
                        })
                    });
                };
                img.src = e.target.result;


            };
            reader.readAsDataURL(file);
        }
    });

    // 会员登录事件
    member.onLogout(function() {
        window.location.replace('login.html?redirect=' + encodeURIComponent(window.location));
    });

    member.onLogin(function() {
        getUserInfo();
    });

    Public.pageRouter(pageRouter);
});
