<!DOCTYPE html>
<html lang="zh-cmn-Hans">
<head>
    {{require('template/head.html')}}

    <?php
    //error_reporting(0);
    if(isset($_GET['id'])){

        require_once 'config.php';
        require_once 'product_detail.class.php';

        $params = array();
        $params['sku_id'] = $_GET['id'];  //商品id
        $url = $config['pro_url'];

        $content = new pro_Details();
        $p= $content->request_post($url,$params);

        //28为CURL请求失败
        if($p != 28){

            $data = json_decode($p,true);

            //如果code参数不是200 反回空
            if($data['code']!=200){
                echo '<script type="text/javascript">alert("'.$data['message'].'");window.location = "/index.html"</script>';
                die;
            }
        } else {
                echo '<script type="text/javascript">alert("请求失败！");window.location = "/index.html"</script>';
        }
    } else {
            echo '<script type="text/javascript">alert("请求失败！");window.location = "/index.html"</script>';
    }
    ?>
    <meta name="Keywords"  content="<?php if(isset($data['data']['meta_keyword'])){ echo $data['data']['meta_keyword']; } else { echo $data['data']['name']; } ?>" />
    <meta name="description" content="<?php if(isset($data['data']['meta_description'])) { echo $data['data']['meta_description']; } else { echo $data['data']['subheading_name']; } ?>" />
    <meta name="applicable-device" content="mobile">
    <link rel="canonical" href="https://www.baiyangwang.com/product/<?php echo $params['sku_id'] ?>.html">
    <title><?php if(isset($data['data']['meta_title'])){ echo $data['data']['meta_title']; } else { echo $data['data']['name']; } ?></title>
    <link rel="stylesheet" href="/css/product-detail.css"/>

    <script type="text/javascript">
        // 商品id
        var productId = <?php echo '"' . $params['sku_id'] . '";'; ?>;
    </script>
</head>
<body class="product-detail" vm-controller="product-detail">

    <!--商品详情页-->
    <div class="wrap box" page-router="">

        <!--头部app下载链接-->
        <div class=" top-download hide" id="top-download">
            <a href="javascript:;" id="btnOpenApp" class="downbtn"></a>
            <a href="javascript:;" class="close-download" id="close-download">&times;</a>
            <i class="col-2 icon-download"></i>
            <span>百洋商城APP购买 <br>首次下单最高立减40元！</span>
            <a href="http://a.app.qq.com/o/simple.jsp?pkgname=com.baiyang.store" class="go-download">下载APP</a>
        </div>

        <header class="top-header">
            <div class="tab">
                <a vm-on-click="switch_tab(0)" vm-attr-class="tab_num==0?'active':''" href="javascript:;">商品</a>
                <a vm-on-click="switch_tab(1)" vm-attr-class="tab_num==1?'active':''" href="javascript:;">详情</a>
                <a vm-on-click="switch_tab(2)" vm-attr-class="tab_num==2?'active':''" href="javascript:;"><?php if($data['data']['drug_type'] == '1'){ echo '资讯'; } else { echo '评价'; } ?></a>
            </div>
            <a href="javascript:history.back();" class="btn-back"><i class="icon icon-arrow"></i></a>
            <!--头部右边按钮 导航菜单 -->
            {{require('template/topnav.html', {'page':''})}}

        </header>

        <div class="flex product-tab" id="product-tab">

            <!-- 商品-->
            <section class="product-info tab-content flex-content" vm-html="info">
                <script type="text/html">
                    <% if(info){ %>

                    <!-- 图片轮播-->
                    <div class="swipe-wrap" data-act="swipe" id="pic-switch">
                        <ul class="swipe-list clear">
                            <% if(info.sku_img && info.sku_img.length){ %>
                                <% info.sku_img.forEach(function(item) { %>
                                    <li class="swipe-item pull-left" style="background-image: url(<%= item.sku_big_image %>)"></li>
                                <% }) %>
                            <% } %>
                        </ul>
                    </div>

                    <!--标题价格-->
                    <div class="title-price">

                        <!--标签价-->
                        <% if(info.promotion && info.promotion.discountInfo.discount_type != 0){ %>
                            <% var discountInfo = info.promotion.discountInfo; %>
                            <div class="vip-price clear side">
                                <em class="pull-left price" vm-html="'&yen;'+ (sku_price-0).toFixed(2) ">&yen;<%= (sku_price-0).toFixed(2) %></em>
                                <p class="old-price pull-left">
                                    <em>&yen;<%= (discountInfo.market_price-0).toFixed(2) %></em>
                                    <% if(discountInfo.end_time == 0){ %>
                                    <br>
                                    <% } %>
                                    <i class="icon-discount">
                                        <% if(discountInfo.tag_name){ %>
                                            <%= discountInfo.tag_name %>
                                        <% } else if(discountInfo.rebate) { %>
                                            <%= discountInfo.rebate %>折
                                        <% } %>
                                    </i>
                                    <% if(discountInfo.end_time > 0){ %>
                                    <br>
                                    <span class="count-down" data-act="count-down" data-param="time=<%= discountInfo.end_time %>&format=剩余<i>D</i>天<i>H</i>小时<i>M</i>分<i>S</i>秒"></span>
                                    <% } %>
                                </p>
                                <% if(info.drug_type != 1){ %>
                                <span class="volume pull-right">已售<%= info.sales_number %>件</span>
                                <% } %>
                            </div>
                        <% } %>


                        <!-- 标题-->
                        <h1 class="title side">
                            <% if(info.is_global == 1){ %>
                                <i class="icon icon-hwg">海外优选</i>
                            <% } %>
                            <% if(info.drug_type == 1){ %>
                                <i class="icon icon-rx"></i>
                            <% } %>
                            <% if(info.drug_type == 2){ %>
                                <i class="icon icon-otc1"></i>
                            <% } %>
                            <% if(info.drug_type == 3){ %>
                                <i class="icon icon-otc2"></i>
                            <% } %>
                            <%= info.name %>
                        </h1>
                        <!--副标题-->
                        <h2 class="sub-title side"><%= info.subheading_name %></h2>
                        <!--价格-->
                        <% if(!info.promotion || info.promotion && info.promotion.discountInfo.discount_type == 0){ %>
                        <p class="sell-price clear side">
                            <em class="pull-left price" vm-html="'&yen;'+ (sku_price-0).toFixed(2) ">&yen;<%= (sku_price-0).toFixed(2) %></em>
                            <span class="old-price pull-left">&yen;<%= (info.sku_market_price-0).toFixed(2) %></span>
                            <% if(info.drug_type != 1){ %>
                            <span class="volume pull-right">已售<%= info.sales_number %>件</span>
                            <% } %>
                        </p>
                        <% } %>

                        <!--海外购标识-->
                        <% if(info.is_global == 1 && info.globalInfo){ %>
                        <p class="hwg-tax clear side">
                            <span class="pull-left">
                                <i class="icon-country" style="background-image: url(<%= info.globalInfo.flag %>)"></i>
                                <%= info.globalInfo.country %>品牌 <%= info.globalInfo.custom_name %>保税仓发货
                            </span>
                            <a href="javascript:;" class="tax-info pull-right" vm-on-click="toggle_tax(1)"><span>税费</span><i class="icon icon-quest"></i></a>
                        </p>
                        <% } %>

                    </div>

                    <!--优惠券/促销-->
                    <% var promotion = info.promotion  %>
                    <% if(info.promotion && (
                        (info.promotion.coupon&&info.promotion.coupon.length)||
                        (info.promotion.fullGift&&info.promotion.fullGift.length)||
                        (info.promotion.fullOff&&info.promotion.fullOff.length)||
                        (info.promotion.fullMinus&&info.promotion.fullMinus.length)||
                        (info.promotion.increaseBuy&&info.promotion.increaseBuy.length)||
                        (info.promotion.expressFree&&info.promotion.expressFree.length)||
                        (info.promotion.limitBuy&&info.promotion.limitBuy.promotion_id>0))){ %>
                    <div class="coupon-wrap side">
                        <% if(info.promotion && info.promotion.coupon && info.promotion.coupon.length) { %>
                        <div class="coupon row" vm-on-click="toggle_coupon(1)">
                            <label class="col-2">领券</label>
                            <ul class="col-9 clear">
                                <% info.promotion.coupon.forEach(function(item) { %>
                                    <li class="pull-left"><%= item.coupon_name %></li>
                                <% }) %>
                            </ul>
                            <i class="icon-more col-1">&hellip;</i>
                        </div>
                        <% } %>
                        <% if(info.promotion.fullGift.length ||
                        info.promotion.fullOff.length ||
                        info.promotion.fullMinus.length ||
                        info.promotion.increaseBuy.length ||
                        info.promotion.expressFree.length ||
                        info.promotion.limitBuy.promotion_id>0) { %>
                        <div class="promotion row" vm-on-click="toggle_promotion(1)">
                            <label class="col-2">促销</label>
                            <ul class="col-9">
                                <%
                                    var icon_index = 0;
                                    var is_overflow = (info.promotion.fullGift.length || 0) +
                                                        (info.promotion.fullOff.length || 0) +
                                                        (info.promotion.fullMinus.length || 0) +
                                                        (info.promotion.increaseBuy.length || 0) +
                                                        (info.promotion.expressFree.length || 0) +
                                                        (info.promotion.limitBuy.promotion_id>0?1:0)>3;
                                %>
                                <%
                                    info.promotion.fullMinus.forEach(function(item) {
                                    icon_index++;
                                %>
                                    <% if(!is_overflow || icon_index < 3){ %>
                                        <li><i class="icon-text">满减</i><%= item.copywriter %></li>
                                    <% } else { %>
                                        <li class="inline"><i class="icon-text">满减</i></li>
                                    <% } %>
                                <% }) %>
                                <%
                                    info.promotion.fullOff.forEach(function(item) {
                                    icon_index++;
                                %>
                                    <% if(!is_overflow || icon_index < 3){ %>
                                        <li><i class="icon-text">满折</i><%= item.copywriter %></li>
                                    <% } else { %>
                                        <li class="inline"><i class="icon-text">满折</i></li>
                                    <% } %>
                                <% }) %>
                                <%
                                    info.promotion.fullGift.forEach(function(item) {
                                    icon_index++;
                                %>
                                    <% if(!is_overflow || icon_index < 3){ %>
                                        <li><i class="icon-text">满赠</i><%= item.copywriter %></li>
                                    <% } else { %>
                                        <li class="inline"><i class="icon-text">满赠</i></li>
                                    <% } %>
                                <% }) %>
                                <%
                                    info.promotion.increaseBuy.forEach(function(item) {
                                    icon_index++;
                                %>
                                    <% if(!is_overflow || icon_index < 3){ %>
                                        <li><i class="icon-text">加价购</i><%= item.copywriter %></li>
                                    <% } else { %>
                                        <li class="inline"><i class="icon-text">加价购</i></li>
                                    <% } %>
                                <% }) %>
                                <%
                                    info.promotion.expressFree.forEach(function(item) {
                                    icon_index++;
                                %>
                                    <% if(!is_overflow || icon_index < 3){ %>
                                        <li><i class="icon-text">包邮</i><%= item.copywriter %></li>
                                    <% } else { %>
                                        <li class="inline"><i class="icon-text">包邮</i></li>
                                    <% } %>
                                <% }) %>
                                <%
                                    if(info.promotion.limitBuy&&info.promotion.limitBuy.promotion_id>0) {
                                    icon_index++;
                                %>
                                    <% if(!is_overflow || icon_index < 3){ %>
                                        <li><i class="icon-text">限购</i><%= info.promotion.limitBuy.copywriter %></li>
                                    <% } else { %>
                                        <li class="inline"><i class="icon-text">限购</i></li>
                                    <% } %>
                                <% } %>
                            </ul>
                            <i class="icon-more col-1">&hellip;</i>
                        </div>
                        <% } %>
                    </div>
                    <% } %>

                    <!--品规选择-->
                    <div class="screening side row" vm-on-click="toggle_type(1)">
                        <label class="col-2">已选</label>
                        <% if(sku_info && sku_info.rules && sku_info.rules.length){ %>
                            <em class="col-9">
                                <% sku_info.rules.forEach(function(item) { %>
                                <%= item.value || '' %>
                                <% }); %>
                                &nbsp;<span vm-html="sku_num"><%= sku_num %></span>件
                            </em>
                        <% } %>
                        <i class="icon-arrow col-1">&gt;</i>
                    </div>

                    <!-- 疗程 -->
                    <% if(treatment.treatment_list && treatment.treatment_list.length){ %>
                    <div class="treatment side">
                        <label>疗程优惠</label>
                        <ul class="course-list clear">
                            <%
                            treatment.treatment_list.forEach(function(item, i) {
                                var invalid = item.canSelected == 1;
                            %>
                                <li vm-attr-class="'pull-left <%= invalid ? '': 'invalid ' %>' + (treatment.treatment_list[<%= i %>]&&treatment.treatment_list[<%= i %>].active?'active ':'')" <% if(invalid){ %>vm-on-click="treatment.set_num(<%= item.min_goods_number %>)"<% } %>>
                                    <span><%= item.promotion_msg %></span>
                                    <em>&yen;<%= item.price %></em>
                                </li>
                            <% }); %>
                        </ul>
                    </div>
                    <% } %>

                    <!-- 套餐 -->
                    <% if(info.promotion && info.promotion.good_set && info.promotion.good_set.list && info.promotion.good_set.list.length){ %>
                    <div class="package side">
                        <a href="?package" class="clear package-title">
                            <div class="pull-left">套餐优惠<span>最高省<%= info.promotion.good_set.max_save_money %>元</span></div>
                            <div class="pull-right">共<%= info.promotion.good_set.list.length %>个套餐<i class="icon-arrow">&gt;</i></div>
                        </a>
                        <div class="product-package clear" data-act="group-swipe">
                            <ul class="product-package-item clear">
                                <% info.promotion.good_set.list.forEach(function(item, i) { %>
                                    <% if(item.sku_info && item.sku_info.length){ %>
                                        <li class="clear">
                                            <a href="?package">
                                                <span>套餐<%= i + 1 %></span>
                                                <div class="package-list clear">
                                                    <% item.sku_info.forEach(function(sku, j) { %>
                                                        <div style="background-image: url(<%= sku.goods_image %>)"></div>
                                                        <% if(j < item.sku_info.length - 1){ %>
                                                            <span>+</span>
                                                        <% } %>
                                                    <% }) %>
                                                </div>
                                            </a>
                                        </li>
                                    <% } %>
                                <% }) %>
                            </ul>
                        </div>
                    </div>
                    <% } %>

                    <!--服务说明-->
                    <% if(info.serviceInfoList && info.serviceInfoList.length) { %>
                    <div class="guarantee clear" vm-on-click="toggle_service(1)">
                        <% info.serviceInfoList.forEach(function(item) { %>
                        <span class="pull-left"><i class="icon icon-hook"></i><%= item.tag_name %></span>
                        <% }); %>
                    </div>
                    <% } %>

                    <!-- 海外购 / 处方药   提示 -->
                    <% if(info.kindly_reminder){ %>
                    <div class="drug-tips side row">
                        <i class="icon icon-warn col-1"></i>
                        <span class="col-11"><%= '温馨提示：' + info.kindly_reminder %></span>
                    </div>
                    <% } %>

                    <!--商品评价-->
                    <div class="hide" vm-html="comment.comment_review" vm-attr-class="comment.comment_review&&comment.comment_review.length?'comment side':'hide'">
                        <%== '<' + 'script type="text/html"' + '>' %>
                        <%== '<'+'% if(comment.comment_review&&comment.comment_review.length){ %'+'>' %>
                        <a href="javascript:;" class="clear comment-title" vm-on-click="switch_tab(2)">
                            <div class="pull-left">商品评价<span>(<%== '<'+'%= comment.comment_count.all %'+'>' %>)</span></div>
                            <div class="pull-right"><em><%== '<'+'%= comment.rate_list.bestRate %'+'>' %>%</em>好评<i class="icon-arrow">&gt;</i></div>
                        </a>
                        <ul class="comment-list">
                            <%== '<'+'% comment.comment_review.forEach(function(item) { %'+'>' %>
                                <li class="comment-item">
                                    <p class="user-name clear">
                                        <span class="pull-left"><%== '<'+'%= item.nickname %'+'>' %></span>
                                        <span class="pull-right star star-<%== '<'+'%= item.star %'+'>' %>"></span>
                                    </p>
                                    <article class="text"><%== '<'+'%= item.contain %'+'>' %></article>
                                    <%== '<'+'% if(item.message_reply){ %'+'>' %>
                                    <article class="reply">客服回复:<%== '<'+'%= item.message_reply %'+'>' %></article>
                                    <%== '<'+'% } %'+'>' %>
                                </li>
                            <%== '<'+'% }); %'+'>' %>
                        </ul>
                        <a class="more-comment" href="javascript:;" vm-on-click="switch_tab(2)">查看所有评论</a>
                        <%== '<'+'% } %'+'>' %>
                        <%== '<' + '/script' + '>' %>
                    </div>

                    <!--处方药资讯-->
                    <div class="hide" vm-html="qa_list" vm-attr-class="qa_list&&qa_list.length?'medicine-qa side':'hide'">
                        <%== '<' + 'script type="text/html"' + '>' %>
                        <%== '<' + '% if(qa_list && qa_list.length){ %' + '>' %>
                        <a href="javascript:;" class="clear package-title" vm-on-click="switch_tab(2)">
                            <div class="pull-left">相关资讯</div>
                            <div class="pull-right"><em><%== '<'+'%= qa_list.length %'+'>' %></em>条相关资讯<i class="icon-arrow">&gt;</i></div>
                        </a>
                        <ul class="qa-list">
                            <%== '<'+'%' %>
                            <%== 'var len = 2;' %>
                            <%== 'if(len > qa_list.length){' %>
                            <%== '    len = qa_list.length;' %>
                            <%== '}' %>
                            <%== 'for(var i = 0; i < len; i++){' %>
                            <%== '%'+'>' %>
                            <li class="qa-item">
                                <article class="question">Q:<%== '<'+'%= qa_list[i].title %'+'>' %></article>
                                <article class="answer">A:<%== '<'+'%= qa_list[i].post_content %'+'>' %></article>
                            </li>
                            <%== '<'+'% } %'+'>' %>
                        </ul>
                        <%== '<' + '% } %' + '>' %>
                        <%== '<' + '/script' + '>' %>
                    </div>

                    <!-- 相关产品  -->
                    <div class="recommend-con " vm-html="recommend_data" >
                        <%== '<' + 'script type="text/html"' + '>' %>
                            <%== '<' + '% if(recommend_data && recommend_data.length){ %' + '>' %>
                                <p class="title" >相关产品</p>
                                <div class="recommend-list" data-act="group-swipe" >
                                    <ul>
                                    <%== '<' + '% recommend_data.forEach(function(item){ %' + '>' %>
                                         <li>
                                             <a href="<%== '<'+'%= item.product_id %'+'>' %>.html" >
                                                 <div class="goods-img">
                                                     <span style="background-image: url(<%== '<'+'%= item.default_image %'+'>' %>)" ></span>
                                                 </div>
                                                 <p class="goods-name" ><%== '<'+'%= item.product_name %'+'>' %></p>
                                                 <p class="goods-price" >
                                                     <span>&yen;<%== '<'+'%= item.price %'+'>' %></span>
                                                     <span>&yen;<%== '<'+'%= item.market_price %'+'>' %></span>
                                                 </p>
                                             </a>
                                         </li>

                                     <%== '<' + '% }) %' + '>' %>
                                    </ul>
                                </div>
                            <%== '<' + '% } %' + '>' %>
                        <%== '<' + '/script' + '>' %>

                    </div>


                    <% if(is_show_detail) { %>
                    <!--图文详情-->
                    <div class="product-direction">
                        <% if(info.instruction && info.sku_desc){ %>
                        <div class="tab" data-act="tab">
                            <ul class="tab-title row">
                                <li class="js-tab-title col-6"><span>商品介绍</span></li>
                                <li class="js-tab-title col-6"><span>说明书</span></li>
                            </ul>
                            <div class="tab-content">
                                <% } %>
                                <% if(info.sku_desc){ %>
                                <div class="js-tab-content direction-body sku-desc">
                                    <%== FormatHTML(info.sku_desc) %>
                                </div>
                                <% } %>

                                <% if(info.instruction){ %>
                                <div class="js-tab-content direction-body instruction">
                                    <%== FormatHTML(info.instruction) %>
                                </div>
                                <% } %>
                                <% if(info.instruction && info.sku_desc){ %>
                            </div>
                        </div>
                        <% } %>
                    </div>
                    <% } else { %>
                    <!--图文详情按钮-->
                    <div class="view-info" vm-on-click="switch_tab(1)">
                        <label class="pull-left">图文详情</label>
                        <i class="icon icon-arrow pull-right">&gt;</i>
                    </div>
                    <% } %>

                    <% } %>
                </script>
            </section>

            <!-- 详情-->
            <section class="product-direction tab-content flex-content" vm-html="info">
                <script type="text/html">
                    <% if(info){ %>
                    <% if(info.instruction && info.sku_desc){ %>
                    <div class="tab" data-act="tab">
                        <ul class="tab-title row">
                            <li class="js-tab-title col-6"><span>商品介绍</span></li>
                            <li class="js-tab-title col-6"><span>说明书</span></li>
                        </ul>
                        <div class="tab-content">
                    <% } %>
                            <% if(info.sku_desc){ %>
                                <div class="js-tab-content direction-body sku-desc">
                                    <%== FormatHTML(info.sku_desc) %>
                                </div>
                            <% } %>

                            <% if(info.instruction){ %>
                            <div class="js-tab-content direction-body instruction">
                                <%== FormatHTML(info.instruction) %>
                            </div>
                            <% } %>
                            <% if(info.instruction && info.sku_desc){ %>
                        </div>
                    </div>
                    <% } %>
                    <% } %>
                </script>
            </section>

            <?php

            if($data['data']['drug_type'] != '1'){
                $html = <<<html
                <!-- 评价-->
                <section data-act="comment" class="product-comment tab-content flex-content" vm-html="comment.comments">
                    <script type="text/html">
                    <% if(comment.comments && comment.comments.length){ %>
                        <ul class="comment-list">
                            <% comment.comments.forEach(function(item) { %>
                                <li class="comment-item">
                                    <p class="user-name clear">
                                        <span class="pull-left user-photo" style="background-image: url(<%= item.headimgurl %>)"></span>
                                        <span class="pull-left"><%= item.nickname %></span>
                                        <span class="pull-right star star-<%= item.star %>"></span>
                                    </p>
                                    <article class="text"><%= item.contain %></article>
                                    <!--<p class="product-param">颜色:棕色 光度：100</p>-->
                                    <% if(item.imageList && item.imageList.length){ %>
                                        <ul class="pic-list clear">
                                            <% var img_arr = '["' + item.imageList.map(function(item) { return item.comment_image }).join('","') + '"]'; %>
                                            <% item.imageList.forEach(function(img, i) { %>
                                                <li class="pull-left" vm-on-click="comment.view_comment_img(<%= img_arr %>, <%= i %>)" style="background-image: url(<%= img.comment_image %>)"></li>
                                            <% }); %>
                                        </ul>
                                    <% } %>
                                    <% if(item.message_reply){ %>
                                    <article class="reply"><%= item.message_reply %></article>
                                    <% } %>
                                </li>
                            <% }); %>
                        </ul>
                    <% } else { %>
                        <p class="empty">暂时还没有评价哦～</p>
                    <% } %>
                    </script>
                </section>
html;

            } else {

                $html = <<<html
                <!-- 资讯-->
                <section class="product-qa tab-content flex-content" vm-html="qa_list">
                    <script type="text/html">
                        <% if(qa_list && qa_list.length){ %>
                        <ul class="qa-list">
                            <% qa_list.forEach(function(item) { %>
                            <li class="qa-item">
                                <article class="question">Q:<%= item.title %></article>
                                <article class="answer">A:<%= item.post_content %></article>
                            </li>
                            <% }) %>
                        </ul>
                       <% } else { %>
                            <p class="empty">暂时还没有相关资讯哦～</p>
                        <% } %>
                    </script>
                </section>
html;

            }

            echo $html;

            ?>
        </div>

        <!--加入购物车按钮-->
        <div class="button-wrap row" vm-html="info">
            <script type="text/html">
                <% if(info){

                var btn_text = '加入购物车', disable_class = '', is_show_button = info && info.display_add_cart == 1;

                if(info.product_type != 0){
                    btn_text = '赠品';
                    disable_class = 'disabled';
                } else if(info.promotion && info.promotion.discountInfo.goods_status == 0){
                    if(info.drug_type == 1){
                        btn_text = '提交需求';
                    } else {
                        btn_text = '加入购物车';
                    }
                } else if(info.promotion && info.promotion.discountInfo.goods_status == 1){
                    btn_text = '已下架';
                    disable_class = 'disabled';
                } else if(info.promotion && info.promotion.discountInfo.goods_status == 2){
                    btn_text = '暂时缺货';
                    disable_class = 'disabled';
                } else if(info.promotion && info.promotion.discountInfo.goods_status == 3){
                    btn_text = '已售罄';
                    disable_class = 'disabled';
                }

                collect.is_collect = info.isCollect;

                var is_buy_now = info.is_show_buy_now == 1 && info.drug_type != 1 && !disable_class;

                %>

                <% if(info.drug_type != 1){ %>
                    <div class="col-2 btn-client" data-act="ntkf" data-param="itemid=<%= info.id %>&itemparam=4">
                        <a href="javascript:;">
                            <i class="icon-client"></i>
                            <span>客服</span>
                        </a>
                    </div>
                <% } %>
                <div class="col-2 btn-collect" vm-on-click="collect.add_collect()">
                    <a href="javascript:;" vm-attr-class="collect.is_collect?'active':''">
                        <i class="icon-collect"></i>
                        <span vm-html="collect.is_collect?'已收藏':'收藏'">收藏</span>
                    </a>
                </div>
                <div class="col-2 btn-car">
                    <a href="/shopping-car.html" vm-html="cart_num">
                        <%== '<' + 'script type="text/html"' + '>' %>
                            <i class="icon-car"></i>
                            <span>购物车</span>
                            <%== '<'+'% if(cart_num && cart_num-0 > 0){ %'+'>' %>
                            <svg width="50" height="50" viewBox="0 0 50 50" preserveAspectRatio="xMidYMid">
                                <circle r="25" cx="25" cy="24"></circle>
                                <text x="25" y="25" dy="0.3em" text-anchor="middle" font-size="30px"><%== '<'+'%= cart_num>99?"99+":cart_num %'+'>' %></text>
                            </svg>
                            <%== '<'+'% } %'+'>' %>
                        <%== '<' + '/script' + '>' %>
                    </a>
                </div>
                <% if(info.drug_type == 1){ %>
                    <% if(is_show_button){ %>
                        <div class="col-4 btn-shopping <%= disable_class %>" <% if(!disable_class){ %>vm-on-click="add_to_cart()" <% } %>>
                            <a href="javascript:;"><%= btn_text %></a>
                        </div>
                        <div class="col-4 btn-consult" vm-on-click="toggle_reception(1)">
                            <a href="javascript:;">咨询药师</a>
                        </div>
                    <% } else { %>
                        <div class="col-8 btn-consult" vm-on-click="toggle_reception(1)">
                            <a href="javascript:;">咨询药师</a>
                        </div>
                    <% } %>
                <% } else { %>
                    <div class="col-<%= is_buy_now ? 3 : 6 %> btn-shopping <%= disable_class %>" <% if(!disable_class){ %>vm-on-click="add_to_cart()" <% } %>>
                        <a href="javascript:;"><%= btn_text %></a>
                    </div>
                    <% if(is_buy_now) { %>
                        <div class="col-3 btn-buy-now" vm-on-click="add_to_cart(1)">
                            <a href="javascript:;">立即购买</a>
                        </div>
                    <% } %>
                <% } %>
                <% } %>
            </script>
        </div>

    </div>

    <!--套餐列表页-->
    <div class="wrap box" page-router="?package">
        <header  class="top-header">
            <h1 class="title">套餐优惠</h1>
            <a href="javascript:history.back();" class="btn-back"><i class="icon icon-arrow"></i></a>
           <!--头部右边按钮 导航菜单 -->
           {{require('template/topnav.html', {'page':''})}}
        </header>
        <div class="flex">
            <!--内容区 滚动区-->
            <div class="flex-content">
                <ul class="product-package-list" vm-html="info">
                    <script type="text/html">
                        <% if(info && info.promotion && info.promotion.good_set && info.promotion.good_set.list && info.promotion.good_set.list.length){ %>
                        <% info.promotion.good_set.list.forEach(function(group, i) { %>
                        <% if(group && group.sku_info && group.sku_info.length){ %>
                        <li>
                            <div class="package-list-title">
                                <span class="red-icon"></span>
                                <span class="title">优惠套餐<%= i + 1 %></span>
                                <span class="desc"><%= group.group_name %></span>
                            </div>

                            <!--药师点评-->
                            <% if(group.group_introduction){ %>
                            <div class="row package-evaluate">
                                <div class="col-3">药师点评：</div>
                                <div class="col-9"><%= group.group_introduction %></div>
                            </div>
                            <% } %>

                            <!--商品列表信息-->
                            <div class="product-package-div clear">
                                <% group.sku_info.forEach(function(product) {
                                   var class_name = '';
                                   if(product.on_shelf==0){
                                       class_name = 'invalid';                            // 下架
                                   } else if(product.is_stockout==1){
                                       class_name = 'sold-out';                           // 售罄
                                   }
                                %>
                                <a href="/product/<%= product.goods_id %>.html"  class="package-list-item clear <%= class_name %>">
                                    <div class="package-product-img <%= class_name %>" style="background-image: url(<%= product.goods_image || '{{Config.cdn_url}}images/default-img.png' %>)"></div>
                                    <div class="package-product-desc">
                                        <p class="product-name"><%= product.goods_name %></p>
                                        <!--优惠信息图标-->
                                        <% if(/^1|2|3$/.test(product.medicine_type)){ %>
                                        <p class="product-icon clear">
                                            <% if(product.medicine_type == 1){ %>
                                            <i class="icon icon-rx"></i>
                                            <% } %>
                                            <% if(product.medicine_type == 2){ %>
                                            <i class="icon icon-otc1"></i>
                                            <% } %>
                                            <% if(product.medicine_type == 3){ %>
                                            <i class="icon icon-otc2"></i>
                                            <% } %>
                                        </p>
                                        <% } %>
                                        <p class="product-price clear">
                                            <span>&yen;<%= product.favourable_price %></span>
                                            <span>x<%= product.favourable_goods_number %>件</span>
                                        </p>
                                    </div>
                                </a>
                                <% }); %>
                            </div>
                            <div class="package-product-all">
                                <p>
                                    套餐优惠<%= i + 1 %>：<span class="real-price">&yen;<%= group.total_favourable_price %></span>
                                    <span class="old-price">原价：<span class="line-mid">&yen;<%= group.total_original_price %></span></span>
                                </p>
                                <span class="package-discount">立省&yen;<%= (group.total_original_price-group.total_favourable_price).toFixed(2) %></span>
                                <a href="javascript:;" vm-on-click="group_add_to_cart('<%= group.id %>')" class="add-cart-btn" >加入购物车</a>
                            </div>
                        </li>
                        <% } %>
                        <% }); %>
                        <% } else { %>
                        <p>没有查询到相关套餐！</p>
                        <% } %>
                    </script>

                </ul>
            </div>
        </div>

    </div>

    <!--弹窗遮罩-->
    <aside class="hide" vm-attr-class="show_comment_img||show_tax||show_type||show_service||show_coupon||show_promotion||show_reception||show_contact?'dialog':'hide'">

        <!--多品规选择-->
        <div class="hide" vm-attr-class="show_type?'dialog-content type box':'hide'">
                <div class="type-title">
                    <span class="pic" vm-css-background-image="sku_info?'url('+sku_info.small_path+')':''"></span>
                    <p class="price" vm-html="'&yen;'+sku_price">&yen;0.00</p>
                    <p class="selected" vm-html="sku_info">
                        <script type="text/html">
                            <% if(sku_info){ %>
                            已选：<% sku_info.rules.forEach(function(item) { %>
                                    <%= item.value || '' %>
                                <% }); %>
                            <% } %>
                        </script>
                    </p>
                    <i class="icon-close" vm-on-click="toggle_type()">&times;</i>
                </div>
                <div class="type-list flex">
                    <div class="flex-content">
                        <div vm-html="spu.spu_select_option">
                            <script type="text/html">
                                <% if(spu.spu_select_option){ %>
                                    <% for( var name in spu.spu_select_option){ %>
                                        <% if(spu.spu_select_option.hasOwnProperty(name)){ %>
                                        <dl class="type-item clear">
                                            <dt><%= name %></dt>
                                            <% spu.spu_select_option[name].forEach(function(item) { %>
                                                <dd vm-attr-class="(spu.spu_list['<%= item.id %>'].hide?'hide ':'')+(spu.spu_list['<%= item.id %>'].selectable?'':'disabled')">
                                                    <span vm-on-click="spu.set_spu('<%= name %>','<%= item.id %>')" vm-attr-class="'label '+(spu.spu_list['<%= item.id %>'].selected?'active ':'')"><%= item.value %></span>
                                                </dd>
                                            <% }); %>
                                        </dl>
                                        <% } %>
                                    <% } %>
                                <% } %>
                            </script>
                        </div>
                        <div class="product-num clear" vm-html="sku_info">
                            <script type="text/html">
                                <% if(info){ %>
                                    <span class="pull-left">数量<em vm-html="info&&info.promotion&&info.promotion.limitBuy&&info.promotion.limitBuy.copywriter?'('+info.promotion.limitBuy.copywriter+')':''"></em></span>
                                    <p class="pull-right size-box row">
                                        <em vm-attr-class="'col-3 '+(sku_num>1?'':'disabled')" vm-on-click="set_num(-1)">-</em>
                                        <input type="tel" value="1" vm-value="sku_num" vm-on-change="set_num(0)" class="col-6">
                                        <em vm-attr-class="'col-3 '+(sku_num<stock?'':'disabled')" vm-on-click="set_num(1)">+</em>
                                    </p>
                                <% } %>
                            </script>
                        </div>
                    </div>
                </div>
                <div class="type-act row" vm-html="info">
                    <script type="text/html">
                    <%
                    if(sku_info){

                        var btn_text = '加入购物车', disable_class = '', is_show_button = info && info.display_add_cart == 1;

                        if(info.product_type != 0){
                            btn_text = '赠品';
                            disable_class = 'disabled';
                        } else if(info.promotion && info.promotion.discountInfo.goods_status == 0){
                            if(info.drug_type == 1){
                                btn_text = '提交需求';
                            } else {
                                btn_text = '加入购物车';
                            }
                        } else if(sku_info.goods_status == 1){
                            btn_text = '已下架';
                            disable_class = 'disabled';
                        } else if(sku_info.goods_status == 2){
                            btn_text = '暂时缺货';
                            disable_class = 'disabled';
                        } else if(sku_info.goods_status == 3){
                            btn_text = '已售罄';
                            disable_class = 'disabled';
                        }

                        var is_buy_now = info.is_show_buy_now == 1 && info.drug_type != 1 && !disable_class;

                    %>
                        <% if(info.drug_type == 1){ %>
                            <a href="javascript:;" class="col-<%= is_show_button == 1?'6':'12' %> btn-consult"  vm-on-click="toggle_reception(1)">咨询药师</a>
                        <% } %>
                        <% if(is_show_button || info.drug_type != 1){ %>
                            <a href="javascript:;" class="col-<%= info.drug_type == 1 || is_buy_now ?'6':'12' %> btn-shopping <%= disable_class %>" <%if(!disable_class){%>vm-on-click="add_to_cart()"<%}%>><%= btn_text %></a>
                        <% } %>
                        <% if(is_buy_now){ %>
                            <a href="javascript:;" class="col-6 btn-buy-now" vm-on-click="add_to_cart(1)">立即购买</a>
                        <% } %>
                    <% } %>
                    </script>
                </div>
        </div>

        <!--服务弹窗-->
        <div class="hide" vm-attr-class="show_service?'dialog-content service box':'hide'" vm-html="info">
            <script type="text/html">
                <h3 class="title">服务说明<i class="icon-close" vm-on-click="toggle_service()">&times;</i></h3>
                <% if(info && info.serviceInfoList && info.serviceInfoList.length) { %>
                <div class="flex body">
                    <div class="flex-content">
                        <ul>
                            <% info.serviceInfoList.forEach(function(item) { %>
                            <li class="service-item">
                                <i class="icon icon-hook"></i>
                                <p><%= item.tag_name %></p>
                                <article><%= item.describe %></article>
                            </li>
                            <% }); %>
                        </ul>
                    </div>
                </div>
                <% } %>
            </script>
        </div>

        <!--优惠券弹窗-->
        <div class="hide" vm-attr-class="show_coupon?'dialog-content coupon box':'hide'" vm-html="coupon.coupon_list">
            <script type="text/html">
                <% if(coupon.coupon_list && coupon.coupon_list.length){ %>
                <h3 class="title">领取优惠券<i class="icon-close" vm-on-click="toggle_coupon()">&times;</i></h3>
                <div class="flex body">
                    <ul class="flex-content">
                        <% coupon.coupon_list.forEach(function(coupon) {
                            var class_name = '', text = '', can_get = true;
                            if(coupon.coupon_type == 1){
                                class_name = 'cash';       // 现金券
                                text = '元';
                            } else if(coupon.coupon_type == 2) {
                                text = '折';
                                class_name = 'discount';  // 折扣券
                            } else if(coupon.coupon_type == 3) {
                                text = '件';
                                class_name = 'shipping';  // 包邮券
                            }

                            if(coupon.end_provide_time * 1000 < Date.now()){
                                class_name += ' overdue';               // 已过期
                                can_get = false;
                            } else if(coupon.is_over_bring_limit == 1){
                                class_name += ' obtained';              // 已领取
                                can_get = false;
                            } else if(coupon.is_over == 1){
                                class_name += ' devoid';                // 已领完
                                can_get = false;
                            } else if(coupon.start_provide_time * 1000 > Date.now()){
                                class_name += ' to-start';              // 待开始
                            } else {
                                class_name += ' to-get';                // 待领取
                            }

                        %>
                            <li class="coupon-item <%= class_name %>" <% if(can_get){ %>vm-on-click="coupon.get_coupon('<%= coupon.coupon_sn %>')"<% } %>>
                                <p class="value"><%= Number(coupon.coupon_value) || 1 %><em><%= text %></em></p>
                                <p class="name"><%= coupon.coupon_name %></p>
                                <p class="description"><%= coupon.tips %></p>
                                <p class="limited"><%= coupon.expiration_tips %></p>
                            </li>
                        <% }); %>
                    </ul>
                </div>
                <% } %>
            </script>
        </div>

        <!--促销列表弹窗-->
        <div class="hide" vm-attr-class="show_promotion?'dialog-content promotion box':'hide'" vm-html="info">
            <script type="text/html">
                <% if(info && info.promotion){ %>
                <% if(info.promotion && (
                (info.promotion.fullGift&&info.promotion.fullGift.length)||
                (info.promotion.fullOff&&info.promotion.fullOff.length)||
                (info.promotion.fullMinus&&info.promotion.fullMinus.length)||
                (info.promotion.increaseBuy&&info.promotion.increaseBuy.length)||
                (info.promotion.expressFree&&info.promotion.expressFree.length)||
                (info.promotion.limitBuy&&info.promotion.limitBuy.promotion_id>0))) { %>
                <h3 class="title">促销<i class="icon-close" vm-on-click="toggle_promotion()">&times;</i></h3>
                <div class="flex body">
                    <ul class="flex-content">
                        <% info.promotion.fullMinus.forEach(function(item) { %>
                        <li class="promotion-item row">
                            <a href="/shopping-car.html?promotion#id=<%= item.promotion_id %>">
                                <i class="icon-text pull-left">满减</i>
                                <span class="col-8"><%= item.copywriter %></span>
                                <i class="icon-arrow pull-right">&gt;</i>
                            </a>
                        </li>
                        <% }); %>
                        <% info.promotion.fullOff.forEach(function(item) { %>
                        <li class="promotion-item row">
                            <a href="/shopping-car.html?promotion#id=<%= item.promotion_id %>">
                                <i class="icon-text pull-left">满折</i>
                                <span class="col-8"><%= item.copywriter %></span>
                                <i class="icon-arrow pull-right">&gt;</i>
                            </a>
                        </li>
                        <% }); %>
                        <% info.promotion.fullGift.forEach(function(item) { %>
                        <li class="promotion-item row">
                            <a href="/shopping-car.html?promotion#id=<%= item.promotion_id %>">
                                <i class="icon-text pull-left">满赠</i>
                                <span class="col-8"><%= item.copywriter %></span>
                                <i class="icon-arrow pull-right">&gt;</i>
                            </a>
                        </li>
                        <% }); %>
                        <% info.promotion.increaseBuy.forEach(function(item) { %>
                        <li class="promotion-item row">
                            <a href="/shopping-car.html?promotion#id=<%= item.promotion_id %>">
                                <i class="icon-text pull-left">加价购</i>
                                <span class="col-8"><%= item.copywriter %></span>
                                <i class="icon-arrow pull-right">&gt;</i>
                            </a>
                        </li>
                        <% }); %>
                        <% info.promotion.expressFree.forEach(function(item) { %>
                        <li class="promotion-item row">
                            <a href="/shopping-car.html?promotion#id=<%= item.promotion_id %>">
                                <i class="icon-text pull-left">包邮</i>
                                <span class="col-8"><%= item.copywriter %></span>
                                <i class="icon-arrow pull-right">&gt;</i>
                            </a>
                        </li>
                        <% }); %>
                        <% if(info.promotion.limitBuy&&info.promotion.limitBuy.promotion_id>0)  { %>
                        <li class="promotion-item row">
                            <i class="icon-text pull-left">限购</i>
                            <span class="col-8"><%= info.promotion.limitBuy.copywriter %></span>
                        </li>
                        <% } %>
                    </ul>
                </div>
                <% } %>
                <% } %>
            </script>
        </div>

        <!--药师咨询弹窗-->
        <div class="hide" vm-attr-class="show_reception?'dialog-content reception':'hide'" vm-html="info">
            <script type="text/html">
                <% if(info){ %>
                    <div class="popup-callcenter">
                        <div class="popup-callcenter-content">
                            <a class="popup-callcenter-btn onlinecall" data-act="ntkf" data-param="type=2&itemid=<%= info.id %>&itemparam=4"></a>
                            <a class="popup-callcenter-btn callme" href="tel:400-6799-859"></a>
                            <a class="popup-callcenter-btn callyou" vm-on-click="toggle_contact(1)"></a>
                            <a class="popup-callcenter-btn cancel" vm-on-click="toggle_reception()"></a>
                        </div>
                    </div>
                <% } %>
            </script>
        </div>

        <!--请药师联系我-->
        <div class="hide" vm-attr-class="show_contact?'popup popup-contact-me':'hide'">
            <div class="popup-content">
                <div class="popup-title">请药师联系我</div>

                <div class="popup-msg">
                    <input type="text" vm-value="contact_no" placeholder="请输入您的手机号">
                    <div class="input-msg" vm-html="show_contact_msg"></div>
                </div>

                <div class="confirm-btn row">
                    <div class="btn-cancel col-6" vm-on-click="toggle_contact()">取消</div>
                    <div class="btn-confirm col-6" vm-on-click="save_contact()">确定</div>
                </div>
            </div>
        </div>

        <!--评论图片查看-->
        <div class="hide" vm-attr-class="show_comment_img?'dialog-content album':'hide'" vm-html="comment_img" vm-on-click="close_comment_img()">
            <script type="text/html">
                <% if(comment_img && comment_img.length){ %>
                <div class="swipe-wrap" data-act="swipe" data-param="auto=0&index=<%= comment_img_index %>">
                    <ul class="swipe-list clear">
                        <% comment_img.forEach(function(src) { %>
                            <li class="swipe-item pull-left" style="background-image: url(<%= src %>)"></li>
                        <% }); %>
                    </ul>
                </div>
                <% } %>
            </script>
        </div>

        <!--海外购税费-->
        <div class="hide" vm-attr-class="show_tax?'dialog-content tax':'hide'" vm-html="info">
            <script type="text/html">
                <% if(info && info.globalInfo){ %>
                <h3 class="title">税费<i class="icon-close" vm-on-click="toggle_tax()">&times;</i></h3>
                <div class="flex body">
                    <ul class="flex-content">
                        <li class="tax-item"><%= info.globalInfo.taxes %></li>
                        <li class="tax-item"> 据国家政策规定，本商品适用于“跨境综合税”，每件商品税负率为11.9%，税费结算请以提交订单时的应付总额明细为准。 </li>
                    </ul>
                </div>
                <% } %>
            </script>
        </div>

        <i class="layout" vm-on-click="close_popup()"></i>

    </aside>


    <script src="/js/config.js"></script>
    <script>seajs.use('product')</script>
</body>
</html>
