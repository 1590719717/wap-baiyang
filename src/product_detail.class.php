<?php
/**
 *
 *商品详情页接口
 *@autor  chenheyuan
 *@date   2016-07-25
 *@param array  商品id
 *@return str 商品详情页接口参数
 *Description：产品相关
 */

class pro_Details{ 
	
	function  request_post($url,$params){

	  $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $url);
	  curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
      curl_setopt($ch, CURLOPT_TIMEOUT, 30);
      
      $result = curl_exec($ch);
	  
	  if(curl_errno($ch)){
          return curl_error($ch);
      }
      
      curl_close($ch);
      return $result;

    }
	
	public function log($url){
        $user['account'] = "18565288580" ;
        $user['password'] = "123456789";
        $json =  $this->request_post($url, $user);
        $array =  json_decode($json,true);
        return $array;
    }
}
 //header('Content-type:text/json');
 //$params['product_id'] = 5000004;  //商品id
// $content = new pro_Details();
 //$p= $content->request_post($params);
 //echo $p.'</br>';
 //$a= $content->log('http://58.63.114.90:8003/wap/product/product_detail');
 //print_r($a);
 
 //用法
 //文件放上服务器，POST访问，接收商品ID参数：product_id

?>