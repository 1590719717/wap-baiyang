<!DOCTYPE html>
<html lang="zh-cmn-Hans">
<head>
    {{require('template/head.html')}}

    <?php
    //error_reporting(0);
    if (isset($_GET['id'])) {

        require_once 'config.php';
        require_once 'product_detail.class.php';

        $params = array();
        $params['brandId'] = $_GET['id'];  // 品牌id
        $params['pageStart'] = 1;  // 分页
        $params['type'] = 'all';  // 排序
        $params['typeStatus'] = 0 ;  // 排序类型
        $params['pageSize'] = 10;  // 每页商品数量

        $detailParam = array();
        $detailParam['brand_id'] = $_GET['id'];  // 品牌id

        $list_url = $config['brand_list'];
        $detail_url = $config['brand_detail'];

        $content = new pro_Details();
        $p = $content->request_post($list_url, $params);

        $detail_content = new pro_Details();
        $detail_result = $detail_content->request_post($detail_url, $detailParam);

        //28为CURL请求失败
        if ($p != 28) {

            $data = json_decode($p, true);

            //如果code参数不是200 反回空
            if ($data['code'] != 200) {
                echo '<script type="text/javascript">alert("'.$data['message'].'");window.location = "/index.html"</script>';
                die;
            }

        } else {
            echo '<script type="text/javascript">alert("请求失败！");window.location = "/index.html"</script>';
        }

        if($detail_result != 28){

            $detail = json_decode($detail_result, true);

        }
    } else {
        echo '<script type="text/javascript">alert("品牌ID错误！");window.location = "/index.html"</script>';
    }
    ?>
    <meta name="Keywords" content="<?php echo $data['data']['brand']['brand_name'].'，'.$data['data']['brand']['brand_name'].'产品'; ?>"/>
    <meta name="description" content="<?php echo $data['data']['brand']['brand_name']; ?>产品在线购买，百洋网上药店提供，安全正品，官方授权，网上买<?php echo $data['data']['brand']['brand_name']; ?>产品就上百洋商城"/>
    <meta name="applicable-device" content="mobile">
    <meta http-equiv="Cache-Control" content="no-transform" />
    <meta http-equiv="Cache-Control" content="no-siteapp">
    <link rel="canonical" href="https://www.baiyangwang.com/brand/<?php echo $params['brandId'] ?>.html">
    <title><?php echo $data['data']['brand']['brand_name']; ?>_在线购买<?php echo $data['data']['brand']['brand_name']; ?>产品-百洋网上药店官网</title>
    <link rel="stylesheet" href="/css/page.css"/>
    <script type="text/javascript">
        // 品牌id
        var brandId = <?php echo '"' . $params['brandId'] . '";'; ?>;
    </script>
</head>
<body class="brand">
    <header  class="top-header">
        <h1 class="title"><?php echo $data['data']['brand']['brand_name']; ?></h1>
        <a href="javascript:history.back();" class="btn-back"><i class="icon icon-arrow"></i></a>
        <!--头部右边按钮 导航菜单 -->
        {{require('template/topnav.html', {'page':''})}}

    </header>

    <!--品牌商品列表-->
    <div page-router="" class="goods-list" vm-controller="brand-list">
        <div class="brand-banner">
            <a href="?detail"><img src="<?php echo $data['data']['brand']['list_image']; ?>" alt=""/></a>
        </div>

        <div>
            <?php
            if (count($data['data']['listData']) > 0) {
                echo '<nav class="sort-nav row" id="sort-nav">'.
                        '<a href="javascript:;" vm-on-click="filter(\'all\')" class="col-3"'.
                        'vm-attr-class="sort==\'all\'?\'col-3 active \'+sort_type:\'col-3\'">综合</a>'.
                        '<a href="javascript:;" vm-on-click="filter(\'sales\')" class="col-3"'.
                        'vm-attr-class="sort==\'sales\'?\'col-3 active \'+sort_type:\'col-3\'">销量</a>'.
                        '<a href="javascript:;" vm-on-click="filter(\'price\')" class="col-3"'.
                        'vm-attr-class="sort==\'price\'?\'col-3 active \'+sort_type:\'col-3\'">价格</a>'.
                        '<a href="javascript:;" vm-on-click="filter(\'comment\')" class="col-3"'.
                        'vm-attr-class="sort==\'comment\'?\'col-3 active \'+sort_type:\'col-3\'">评价</a>'.
                    '</nav>';
            }
            ?>
        </div>

        <ul vm-html="data">
            <?php

            if (count($data['data']['listData']) > 0) {
                foreach ($data['data']['listData'] as $item) {
                    echo '<li class="goods-item">' .
                            '<a href="/product/' . $item['goodsId'] . '.html">' .
                            '<span class="goods-pic">';
                    if ($item['goodsImage']) {
                        echo '<em class="pic" data-act="lazy" data-param="style=' . $item['goodsImage'] . '"></em>';
                    }

                    if( $item['isOnSale'] == 0 ){
                        echo '<i class="icon-out-sale"></i>';
                    } else if( $item['stock'] - 0 <= 0 ) {
                        echo '<i class="icon-out-stock"></i>';
                    }

                    echo '</span>' .
                        '<span class="goods-title">' . $item['goodsName'] . '</span>' .
                        '<span class="tag-type">';
                    if( $item['tag_name'] ){
                        echo '<i class="icon-zxj">' . $item['tag_name'] . '</i> ';
                    }
                    if ($item['promotionData']) {
                        if ($item['promotionData']['fullMinus'] == 1) {
                            echo '<i class="icon-mj">满减</i> ';
                        }
                        if ($item['promotionData']['fullDiscount'] == 1) {
                            echo '<i class="icon-mj">满折</i> ';
                        }
                        if ($item['promotionData']['fullGift'] == 1) {
                            echo '<i class="icon-mz">满赠</i> ';
                        }
                        if ($item['promotionData']['farePurchase'] == 1) {
                            echo '<i class="icon-mj">加价购</i> ';
                        }
                        if ($item['promotionData']['expressFree'] == 1) {
                            echo '<i class="icon-by">包邮</i> ';
                        }
                    }
                    echo '</span><span class="goods-price">' .
                        '<em class="now-price">' . $item['price'] . '</em>';
                    if ($item['markPrice'] - 0 > 0) {
                        echo '<em class="old-price">' . $item['markPrice'] . '</em>';
                    }
                    echo '</span>' ;

                    if( $item['drugType'] != 1 ) {
                        echo '<span class="comment">' .
                            '<em class="comment-size">' . $item['commentNumber'] . '条评论</em>' .
                            '<em>好评' . $item['praise'] . '</em>' .
                            '</span>' ;
                    }
                    echo '</a>' .
                         '</li>';

                }
            } else {
                echo '<li class="empty">暂无商品</li>';
            }
            ?>
            <script type="text/html">
                <% if(data && data.length){ %>
                <% data.forEach(function(item) { %>
                <li class="goods-item">
                    <a href="/product/<%= item.goodsId %>.html">
                        <span class="goods-pic">
                            <% if(item.goodsImage){ %>
                                <em class="pic" data-act="lazy"
                                    data-param="style=<%= item.goodsImage %>"></em>
                            <% } %>
                            <!--下架-->
                            <% if(item.isOnSale == 0){ %>
                                <i class="icon-out-sale"></i>
                            <!--售罄-->
                            <% } else if( (item.stock - 0) <= 0 ) {  %>
                                <i class="icon-out-stock"></i>
                            <% } %>
                        </span>
                        <span class="goods-title"><%= item.goodsName %></span>
                        <span class="tag-type">
                            <% if( item.tag_name ){ %>
                                <i class="icon-zxj"><%= item.tag_name %></i>
                            <% } %>
                            <% if(item.promotionData){ %>
                                <% if(item.promotionData.fullMinus == 1){ %>
                                <i class="icon-mj">满减</i>
                                <% } %>
                                <% if(item.promotionData.fullDiscount == 1){ %>
                                <i class="icon-mj">满折</i>
                                <% } %>
                                <% if(item.promotionData.fullGift == 1){ %>
                                <i class="icon-mz">满赠</i>
                                <% } %>
                                <% if(item.promotionData.farePurchase == 1){ %>
                                <i class="icon-mj">加价购</i>
                                <% } %>
                                <% if(item.promotionData.expressFree == 1){ %>
                                <i class="icon-by">包邮</i>
                                <% } %>
                            <% } %>
                        </span>
                        <span class="goods-price">
                            <em class="now-price">&yen;<%= item.price %></em>
                            <% if(item.markPrice - 0 > 0) { %>
                                <em class="old-price">&yen;<%= item.markPrice %></em>
                            <% } %>
                        </span>
                        <% if( item.drugType != 1 ) { %>
                            <span class="comment">
                                <em class="comment-size"><%= item.commentNumber %>条评论</em>
                                <em>好评<%= item.praise %>%</em>
                            </span>
                        <% } %>

                    </a>
                </li>
                <% }); %>
                <% } else if(data && !data.length) { %>
                <li class="empty">暂无商品</li>
                <% } %>
            </script>
        </ul>
    </div>

    <!--品牌介绍-->
    <div page-router="?detail">
        <div class="brand-detail">
            <?php
                if(isset($detail['code']) && $detail['code'] == 200){
                    echo '<img src="'. $detail['data']['body'] .'" alt=""/>';
                }
            ?>
        </div>
    </div>

    <script src="/js/config.js"></script>
    <script>seajs.use('brand')</script>
</body>
</html>