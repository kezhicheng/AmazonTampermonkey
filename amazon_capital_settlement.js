// ==UserScript==
// @name         亚马逊资金统计
// @namespace    gonglang_amazon
// @version      2021.12.21
// @description  try to take over the world!
// @author       kezhicheng
// @match        https://sellercentral.amazon.com/payments/dashboard/*
// @match        https://sellercentral.amazon.co.uk/payments/dashboard/*
// @match        https://sellercentral-japan.amazon.com/payments/dashboard/*
// @match        https://sellercentral.amazon.ae/payments/dashboard/*
// @match        https://sellercentral.amazon.com.au/payments/dashboard/*
// @match        https://sellercentral.amazon.es/payments/dashboard/*
// @match        https://sellercentral.amazon.co.jp/payments/dashboard/*
// @match        https://sellercentral.amazon.ca/payments/dashboard/*
// @match        https://sellercentral.amazon.fr/payments/dashboard/*
// @match        https://sellercentral.amazon.de/payments/dashboard/*
// @match        https://sellercentral.amazon.com.br/payments/dashboard/*
// @match        https://sellercentral.amazon.sg/payments/dashboard/*
// @match        https://sellercentral-europe.amazon.com/payments/dashboard/*
// @match        https://sellercentral.amazon.in/payments/dashboard/*
// @match        https://sellercentral.amazon.it/payments/dashboard/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_getClipboard
// @require      http://192.168.1.12/v3real/js/jquery-1.11.3.js
// @require      http://192.168.1.12/v3real/js/html2canvas/html2canvas.js
// @updateURL    http://113.108.97.88:91/v3real/api/amazon_tampermonkey/amazon_capital_settlement.js
// ==/UserScript==

(function() {
    'use strict';
    var $ = $ || window.$;
    setTimeout(function(){
        var html = "<button id='amazon_fund_screenshot' style='background-color: antiquewhite;'>资金截图数据采集</button>";
        html=html+ "<button id='reset_account' style='background-color: antiquewhite;'>重置账号</button>";
        $(".order-search-box").append(html);
        //获取截图与页面数据 发送到V3
        $("#amazon_fund_screenshot").click(function(){
            //判断账号信息
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
            //获取截图与页面数据
            get_screenshots(account);
        });
        //重置账号
        $("#reset_account").click(function(){
            sessionStorage.setItem("account",null);
            var account = prompt("请输入账号名称");
            if(account == '' || account == null){
                alert('请输入账号名称');
                return false;
            }else{
                sessionStorage.setItem('account',account);
                alert('账号重置成功');
            }
        });
    },3000);

    //发送数据到新系统
    function send_data(account,base_img){
        var data = '';
        data += 'action=add';
        data += '&accountName='+account;

        var time = $(".sc-kEjbxe").find(".kat-select-container").find(".header-row-text").text().trim();

        data += '&infoDate='+time;

        var account_type = $(".account-type-selection").find(".kat-select-container").find(".header-row-text").text().trim();
        data += '&account_type='+account_type;

        var Transfer_amount_initiated = $(".proceeds-summary").find(".header").find(".multi-line-child-content").eq(2).text();
        data += '&transfer_amount_initiated='+Transfer_amount_initiated;

        //获取换算后的转账金额
        var describe = removeHTMLTag($(".group-messages").eq(0).html());
        data += '&describe='+encodeURIComponent(describe);

        var Beginning_balance = $(".proceeds-summary").find(".prelude-breakdowns").find(".breakdown-amount").text();
        data += '&beginning_balance='+Beginning_balance;

        var Sales,refunds,Expenses;
        if($(".proceeds-summary").find(".emphasized-breakdowns").find(".top-level-breakdown").length > 2){
            Sales = $(".proceeds-summary").find(".emphasized-breakdowns").find(".top-level-breakdown").eq(0).find(".underline-link").text();
            refunds = $(".proceeds-summary").find(".emphasized-breakdowns").find(".top-level-breakdown").eq(1).find(".underline-link").text();
            Expenses = $(".proceeds-summary").find(".emphasized-breakdowns").find(".top-level-breakdown").eq(2).find(".breakdown-amount").text();
        }else{
            Sales = $(".proceeds-summary").find(".emphasized-breakdowns").find(".top-level-breakdown").eq(0).find(".underline-link").text();
            Expenses = $(".proceeds-summary").find(".emphasized-breakdowns").find(".top-level-breakdown").eq(1).find(".breakdown-amount").text();
        }

        var base64Image=encodeURIComponent(base_img);
        console.log(base64Image);

        data += '&screenshot='+base64Image;
        data += '&sales='+Sales;
        data += '&refunds='+refunds;
        data += '&expenses='+Expenses;

        var Account_level_reserve = $(".proceeds-summary").find(".postlude-breakdowns").find(".breakdown-amount").text();
        data += '&account_level_reserve='+Account_level_reserve;

        //获取站点信息
        var site = $("#partner-switcher").find(".partner-dropdown-button").text().trim();
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
        console.log(data)
        GM_xmlhttpRequest({
            method: "POST",
            data : data,
            url: "http://113.108.97.88:91/v3real/api/amazon_capital_settlement_api.php",
            headers:  {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(response) {
                //这里写处理函数
                //console.log(response);
                if(response.status = 200){
                    var responseText = JSON.parse(response.responseText);
                    console.log(JSON.parse(response.responseText));
                    if(responseText.isErr == 101){
                        var context = responseText.context;
                        alert(context);
                        //alert(account+" 此前账号在 "+time+" 此时间段 "+site+" 此站点的数据已采集");
                    }
                    if(responseText.isErr == 0){
                        alert("数据采集成功");
                    }
                }else{
                    alert("发送数据失败，请联系技术处理！");
                }
            }
        });

    }
    //获取系统剪贴板内容(暂时不用)
    function send_python(account){
        var myDate = new Date(); //实例一个时间对象；
        var year= myDate.getFullYear(); //获取系统的年；
        var month=myDate.getMonth()+1; //获取系统月份，由于月份是从0开始计算，所以要加1
        var day=myDate.getDate(); // 获取系统日，
        var img_name=account+year+month+day;
        var json_data = '{"task_type":"screenshot","task_id":"'+img_name+'","post_url":""}';
        GM_setClipboard(json_data);
    }

    //采用websoket与python监听脚本进行交互
    //截图2021.11.4（使用中）
    function get_screenshots(account){
        var myDate = new Date(); //实例一个时间对象；
        var year= myDate.getFullYear(); //获取系统的年；
        var month=myDate.getMonth()+1; //获取系统月份，由于月份是从0开始计算，所以要加1
        var day=myDate.getDate(); // 获取系统日，
        var hour = myDate.getHours();
        var minute = myDate.getMinutes();
        var second = myDate.getSeconds();
        var img_name=account+year+month+day+hour+minute+second;
        var send_datas = '{"task_type":"screenshot","task_id":"'+img_name+'","post_url":""}';
        var onopen_flag=false;
        var ws = new WebSocket("ws://127.0.0.1:56789");
        //连接成功
        ws.onopen = function(evt){
            console.log('连接截图服务成功!')
            ws.send(send_datas)
            onopen_flag=true;
        };
        //接收数据
        ws.onmessage = function(evt) {
            console.log( "Received Message: " + evt.data);
            let json_data = $.parseJSON(evt.data)
            if(json_data.status=='200'){
                //传递图片参数
                console.log('截图成功,请耐心等待数据回传v3...')
                send_data(account,json_data.data.image)
            }else{
                console.log(json_data.data)
                alert(json_data.msg)
                send_data(account,'')//如果Python服务器脚本异常，直接采集数据（不包含截图）
            }
        };
        //关闭连接
        ws.onclose = function(evt) {
            if(onopen_flag==false){ //如果Python服务器脚本异常，直接采集数据（不包含截图）
                send_data(account,'')
            }
            console.log("断开连接!");
        };
    }
    //截图2021.8.5（作废）
    function get_screenshot(account){
        $.wait( function(){
            //截图操作
            // 要截取为图片的 dom 节点
            const dom = $("#root");
            const containerDom = $("#screenshot_iframe");
            html2canvas(document.querySelector("#root"),{
                width:window.screen.availWidth,
                height:window.screen.availHeight,
                windowWidth:document.body.scrollWidth,
                windowHeight:document.body.scrollHeight,
                x: dom.offset().left,
                y: dom.offset().top,
                scale: 2,
                dpi: 300,
                removeContainer:true
            }).then(canvas => {
                document.body.appendChild(canvas);
                //图片转base64
                var base64Image = canvas.toDataURL('image/png');
                console.log(base64Image)
                send_data(account,base64Image)

            });

        },15)
    }
    //等待时间函数
    $.wait = function( callback, seconds){
        return window.setTimeout( callback, seconds * 1000 );
    }

    function removeHTMLTag(str) {
        str = str.replace(/<\/?[^>]*>/g, ''); //去除HTML tag
        str = str.replace(/[ | ]*\n/g, '\n'); //去除行尾空白
        //str = str.replace(/\n[\s| | ]*\r/g,'\n'); //去除多余空行
        str = str.replace(/ /ig, ''); //去掉
        return str;
    }

})();