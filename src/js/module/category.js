/*!
 * @author yuchunfeng
 * @date 2016/6/26
 * @description 产品分类页
 */

define('category',['exbind', 'widget', 'event', 'popup', 'mvvm', 'ajax', 'member'], function (require, exports) {
    var exbind = require('exbind');
    var widget = require('widget');
    var event = require('event');
    var popup = require('popup');
    var MVVM = require('mvvm');
    var ajax = require('ajax');
    var member = require('member');

    var category_list = document.getElementById('category-list');
    var vmData = MVVM.define('category-list', {

        all_data : [] ,                //左侧导航栏数据
        son: [] ,                      // 右侧栏
        grandson:[],                   // 右侧栏
        spread : '',                   // 右侧顶部广告位
        nav_flag: 0 ,                  // 右侧栏已点击的索引

        getCategory: function(){
            // 加载品牌列表
            ajax({
                type: 'post',
                url: Config.url + 'background/Category/category_list',
                data: {
                    token: member.token
                },
                dataType: 'json',
                beforeSend: function() {
                    popup.loading('show');
                },
                success: function(data) {
                    popup.loading('hide');
                    if(data && data.code == 200) {
                        vmData.all_data = data.data ;

                        //第一次请求默认点击选择左侧第一个nav
                        if( vmData.all_data[0].ad ){
                            vmData.spread = vmData.all_data[0].ad ;
                        } else {
                            vmData.spread = [] ;
                        }
                        vmData.son = vmData.all_data[0].son ;
                        vmData.grandson = vmData.son && vmData.son.length ? vmData.son[0].son : [] ;
                        vmData.nav_flag = 0 ;

                    } else if(data && data.code == 10006) {
                        popup.error('结果为空',function() {
                            window.history.back();
                        });

                    } else {
                        popup.error(data ? data.message : this.url + ' Error');
                    }
                },
                error: function() {
                    popup.error(this.url + ' Error');

                }
            });
        } ,

        //点击切换右侧导航栏
        navChange: function( obj , index ) {

            if( index != vmData.nav_flag ) {
                var navList = document.getElementsByClassName('nav');
                for(var i = 0;i < navList.length;i++){
                    navList[i].className = 'nav';
                }
                obj.className = 'nav active';

                if( vmData.all_data[index].ad ){             //获取广告图片
                    vmData.spread = vmData.all_data[index].ad ;
                } else {
                    vmData.spread = [] ;
                }

                vmData.son = vmData.all_data[index].son ;
                vmData.nav_flag = index ;

                category_list.scrollTop = 0 ;

            }
        }

    });

    vmData.getCategory() ;

});