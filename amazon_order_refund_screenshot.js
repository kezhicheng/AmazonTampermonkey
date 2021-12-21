// ==UserScript==
// @name         amazon退款订单截图
// @namespace    gonglang_amazon
// @version      2021.12.01
// @description  try to take over the world!
// @author       kezhicheng
// @match        https://sellercentral.amazon.com/orders-v3/*
// @match        https://sellercentral.amazon.co.uk/orders-v3/*
// @match        https://sellercentral-japan.amazon.com/orders-v3/*
// @match        https://sellercentral.amazon.ae/orders-v3/*
// @match        https://sellercentral.amazon.com.au/orders-v3/*
// @match        https://sellercentral.amazon.es/orders-v3/*
// @match        https://sellercentral.amazon.co.jp/orders-v3/*
// @match        https://sellercentral.amazon.ca/orders-v3/*
// @match        https://sellercentral.amazon.fr/orders-v3/*
// @match        https://sellercentral.amazon.de/orders-v3/*
// @match        https://sellercentral.amazon.com.br/orders-v3/*
// @match        https://sellercentral.amazon.sg/orders-v3/*
// @match        https://sellercentral-europe.amazon.com/orders-v3/*
// @match        https://sellercentral.amazon.in/orders-v3/*
// @match        https://sellercentral.amazon.it/orders-v3/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @require      http://192.168.1.12/v3real/js/jquery-1.11.3.js
// @require      http://192.168.1.12/v3real/js/html2canvas/html2canvas.js
// @updateURL    http://113.108.97.88:91/v3real/api/amazon_tampermonkey/amazon_order_refund_screenshot.js
// ==/UserScript==

(function() {
    'use strict';
    var $ = $ || window.$;
    //等页面加载完
    setTimeout(function(){
        //添加截图按钮
        let html = "<button style='width: 140px;height: 30px;' class='a-button a-button-search' id='order_screenshot'>退款订单截图</button>";
        let a = $("#myo-search").prepend(html);
        let html1 = "<button style='width: 140px;height: 30px;' class='a-button a-button-search' id='logistics_screenshot'>物流证据截图</button>";
        $("#myo-search").prepend(html1);

        $("#order_screenshot").click(function(){
            get_order("screenshot");
            return false;
        });

        $("#logistics_screenshot").click(function(){
            get_order("logistics_screenshot");
            return false;
        });

    },1500)

    //获取退款订单信息
    function get_order(type){
        var account = sessionStorage.getItem("account");
        if(account == null){
            account = prompt("开始采集数据,请输入账号名称");
            if(account == '' || account == null){
                alert('请输入账号名称');
                return false;
            }else{
                sessionStorage.setItem('account',account);
            }
        }

        //获取站点信息
        var site = $("#partner-switcher").find(".dropdown-button").text().trim();
        if(sessionStorage.getItem("site") == null){
            sessionStorage.setItem("site",site);
        }else{
            if(site != sessionStorage.getItem("site")){
                alert("检测到切换了站点，请重新输入账号");
                sessionStorage.removeItem("site");
                sessionStorage.removeItem("account");
                return false;
            }
        }

        //获取到当前账号的退款订单号
        let url = 'http://113.108.97.88:91/v3real/api/order_refund_screenshot_api.php';
        GM_xmlhttpRequest({
            method: "POST",
            data : 'action=getRefundOrder&platform=4&account='+account+'&type='+type,
            url: url,
            headers:  {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            synchronous: true,
            onload: function(response) {
                //console.log(response);
                if(response.status = 200){
                    var responseText = JSON.parse(response.responseText);
                    //console.log(responseText);
                    if(responseText.isErr == 0){
                        //console.log(responseText.list);
                        var list = responseText.list;
                        if(list.length > 0){
                            for(var i=0;i<list.length;i++){
                                //console.log(list[i]);
                                if(type.indexOf("logistics_screenshot") >= 0){
                                    handle_logistics(list[i]);
                                }else{
                                    handle(list[i]);
                                }
                            }
                        }else{
                            alert('暂无此账号'+account+'的退款订单信息');
                        }
                    }else{
                        //console.log(responseText);
                        return false;
                    }
                }
            }
        });
        alert('采集开始,请等待....');
    }

    //获取退款订单截图
    function handle_logistics(order_info){
        var order = order_info.recordnumber;
        var id = order_info.id;
        var url2 = 'https://'+document.domain+'/gp/orders-v2/refund?orderID='+order;

        var link2 = document.createElement("iframe");
        link2.src = url2;
        link2.id = "screenshot_iframe_two_"+id;
        document.body.appendChild(link2);

        $.wait( function(){
            //获取iframe中加载的document
            var iframes = $('#screenshot_iframe_two_'+id).prop('contentWindow').document;
            $('#screenshot_iframe_two_'+id).contents().find(".dropdown__container").find(".header-row-text").text("承运人送达延误");

            //截图操作
            html2canvas(iframes.querySelector(".a-container")).then(canvas => {
                //document.body.appendChild(canvas);
                var base64Image = canvas.toDataURL('image/png');
                document.body.removeChild(link2);
                $.wait( function(){
                    send_post(id,'',base64Image,order);
                },10);
                //console.log(base64Image);
            });

        },15)
    }

    //获取退款订单号的截图
    function handle(order_info){
        //拼接url地址
        var order = order_info.recordnumber;
        var id = order_info.id;
        var url = 'https://'+document.domain+'/orders-v3/order/'+order;

        //创建iframe，把订单详情的内容展示在iframe中
        var link = document.createElement("iframe");
        link.src = url;
        link.id = "screenshot_iframe_"+id;
        document.body.appendChild(link);

        $.wait( function(){
            //获取iframe中加载的document
            var iframes=$('#screenshot_iframe_'+id).prop('contentWindow').document;

            //截图操作
            html2canvas(iframes.querySelector(".a-container")).then(canvas => {
                //document.body.appendChild(canvas);
                //图片转base64
                var base64Image = canvas.toDataURL('image/png');
                //截图完毕，移除iframe
                document.body.removeChild(link);
                send_post(id,base64Image,'',order);
            });

        },15)
    }

    //发送数据
    function send_post(id,base64Image,base64Image2,order){
        var url = 'http://113.108.97.88:91/v3real/api/order_refund_screenshot_api.php';
        GM_xmlhttpRequest({
            method: "POST",
            data : 'action=updateScreenshot&id='+id+'&screenshot='+encodeURIComponent(base64Image)+'&screenshot2='+encodeURIComponent(base64Image2),
            url: url,
            headers:  {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            synchronous: true,
            onload: function(response) {
                console.log(response);
                var responseText = JSON.parse(response.responseText);
                if(response.status = 200){
                    if(responseText.isErr == 101){
                        alert(responseText.context);
                        console.log(responseText.context);
                    }
                    if(responseText.isErr == 0){
                        console.log(order+'  采集成功');
                        alert(order+'  采集成功');
                    }
                }else{
                    console.log(responseText);
                }
            }
        });
    }

    //等待时间函数
    $.wait = function( callback, seconds){
        return window.setTimeout( callback, seconds * 1000 );
    }
    // Your code here...
})();