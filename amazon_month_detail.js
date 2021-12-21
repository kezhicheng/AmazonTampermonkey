// ==UserScript==
// @name         亚马逊月度明细
// @namespace    gonglang_amazon
// @version      2021.12.21
// @description  try to take over the world!
// @author       kezhicheng
// @match        https://sellercentral.amazon.com/payments/reports/custom/*
// @match        https://sellercentral.amazon.co.uk/payments/reports/custom/*
// @match        https://sellercentral-japan.amazon.com/payments/reports/custom/*
// @match        https://sellercentral.amazon.ae/payments/reports/custom/*
// @match        https://sellercentral.amazon.com.au/payments/reports/custom/*
// @match        https://sellercentral.amazon.es/payments/reports/custom/*
// @match        https://sellercentral.amazon.co.jp/payments/reports/custom/*
// @match        https://sellercentral.amazon.ca/payments/reports/custom/*
// @match        https://sellercentral.amazon.fr/payments/reports/custom/*
// @match        https://sellercentral.amazon.de/payments/reports/custom/*
// @match        https://sellercentral.amazon.com.br/payments/reports/custom/*
// @match        https://sellercentral.amazon.sg/payments/reports/custom/*
// @match        https://sellercentral-europe.amazon.com/payments/reports/custom/*
// @match        https://sellercentral.amazon.in/payments/reports/custom/*
// @match        https://sellercentral.amazon.it/payments/reports/custom/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @require      http://code.jquery.com/jquery-1.11.0.min.js
// @updateURL    http://113.108.97.88:91/v3real/api/amazon_tampermonkey/amazon_month_detail.js
// ==/UserScript==

(function() {
    'use strict';
    var $ = $ || window.$;
    setTimeout(function(){
        var html = "<span class='a-button a-button-primary a-declarative'>"+
            "<span class='a-button-inner'><span id='amazon_months_collection' class='a-button-text'>月度明细数据采集</span></span></span>";
         html=html+ "<span class='a-button a-button-primary a-declarative'>"+
             "<span class='a-button-inner'><span id='reset_account' class='a-button-text'>重置账号</button></span></span></span>";
        $("#drrGenerateReportDisplayableContent").append(html);
        //$("#drrGenerateReportButton").click();return;
        $("#amazon_months_collection").click(function(){
            var account = sessionStorage.getItem("account");
            var seller = sessionStorage.getItem("seller");
            console.log(seller);
            if(account == null){
                account = prompt("开始采集数据,请输入账号名称");
                if(account == '' || account == null){
                    alert('请输入账号名称');
                    return false;
                }else{
                    sessionStorage.setItem('account',account);
                }
            }
            if(seller ==null){
                seller =check_seller(account);
                console.log(seller);
                if(seller == '' || seller == null){
                    return false;
                }
            }
            seller = sessionStorage.getItem("seller");
            DataCollection(account,seller);
        });
        //重置账号
        $("#reset_account").click(function(){
             sessionStorage.removeItem("site");
             sessionStorage.removeItem("account");
             sessionStorage.removeItem("seller");
            var account = prompt("请输入账号名称");
            if(account == '' || account == null){
                alert('请输入账号名称');
                return false;
            }else{
                sessionStorage.setItem('account',account);
                alert('账号重置成功');
            }
        });
    },1500);

    //检测归属
    function check_seller(account){
           var check_data = '';
           check_data += 'action=check_owner';
           check_data += '&account='+account;
           //检测一下账号归属
           GM_xmlhttpRequest({
               method: "POST",
               data : check_data,
                url: "http://113.108.97.88:91/v3real/api/amazon_new_monthly_details_api.php",
               // url: "http://192.168.4.40/api/amazon_new_monthly_details_api.php",
               headers:  {
                   "Content-Type": "application/x-www-form-urlencoded;"
               },
               onload: function(response) {
                   if(response.status = 200){
                       var responseText = JSON.parse(response.responseText);
                       console.log(responseText);
                       if(responseText.isErr == 101){
                           var seller = prompt("检测到该账号归属为system,请手动输入归属");
                           //console.log(seller);
                           if(seller == '' || seller == null){
                               alert('请输入账号归属');
                               return null;
                           }
                           sessionStorage.setItem('seller',seller);
                           DataCollection(account,seller);
                       }else{
                           sessionStorage.setItem('seller',responseText.context);
                           DataCollection(account,responseText.context);
                       }
                   }
               }
        });
    }
    //匹配标签获取想要的内容
    function DataCollection(account,seller){
        //定义站点数组
        var site_arr = ["美国", "加拿大", "英国", "德国", "法国", "印度", "日本", "意大利", "墨西哥", "西班牙", "澳大利亚", "阿拉伯联合酋长国","沙特阿拉伯", "新加坡", "巴西", "荷兰", "波兰", "瑞典", "土耳其"];
        //获取站点信息
        //var site = $("#partner-switcher").find(".dropdown-button").text().trim();
        var site = $("#partner-switcher").find(".partner-dropdown-button").text().trim();
        site = site.replace(/\s+/g,"");
        console.log(site,typeof site);
        site=site.split("|");
        site=site[1];
        var site_code='utf-8'; //默认英语国家站点编码
        if(site=='日本'){
           site_code= 'Shift-JIS'; //特殊站点日本编码
        }
        var has = site_arr.indexOf(site); // 是否存在
        if(has<0){
             console.log(has);
             alert("站点字段更新,请销售同事提醒IT升级油猴插件");return;
        }

        if(sessionStorage.getItem("site") == null){
            sessionStorage.setItem("site",site);
        }else{
            if(site != sessionStorage.getItem("site")){
                alert("检测到切换了站点，请重新输入账号再采集");
                sessionStorage.removeItem("site");
                sessionStorage.removeItem("account");
                sessionStorage.removeItem("seller");
                return false;
            }
        }

        var data_arr = [];
        $(".mt-table-container").find("tbody").find("tr").each(function(){
            var tr_class = $(this).prop("className");
            if(tr_class == "mt-head"){
                return true;
            }
            $(this).children("td").each(function(){
                var td_id = $(this).attr("id");
                if(td_id.indexOf("ddrAction") > 0 && $(this).children("span").length > 0){
                    var url_download = $(this).find("a").attr("href");
                    //GM_download(url_download,'sample_image.csv');

                    console.log(url_download);
                    if(url_download == null){
                        return true;
                    }
                    //console.log(url_download);
                    var infoDate = $(this).prev().find(".mt-text-content").text().trim();
                    var request_time = $(this).prev().prev().find(".mt-text-content").text().trim();
                    var file_name = $(this).prev().prev().prev().find(".mt-text-content").text().trim();
                    //console.log(infoDate);
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: url_download,
                        synchronous: true,
                        overrideMimeType:'text/plain;charset='+site_code+';',
                        onload: function(response) {
                            //console.log(response);
                            if(response.status = 200){
                                var data = '';
                                data += 'action=create';
                                data += '&account='+account;
                                data += '&url_download='+url_download;
                                data += '&site_code='+site_code;
                                data += '&infoDate='+infoDate;
                                data += '&seller='+seller;
                                data += '&request_time='+request_time;
                                data += '&file_name='+file_name;
                                var csv = response.responseText;
                                var json_scv =encodeURIComponent(csv);
                                data += '&dataJson='+json_scv;
                                console.log(json_scv);
                                amazon_monthly_details_add(data,site_code);
                            }
                        }
                    });
                }
            });
        });
    }

    function amazon_monthly_details_add(data,site_code){
        GM_xmlhttpRequest({
            method: "POST",
            data : data,
             url: "http://113.108.97.88:91/v3real/api/amazon_new_monthly_details_api.php",
            //url: "http://192.168.4.40/api/amazon_new_monthly_details_api.php",
            headers:  {
                           "Content-Type": "application/x-www-form-urlencoded;charset="+site_code+';'
                        },
            onload: function(response) {
                //这里写处理函数
                //console.log(response);
                if(response.status = 200){
                    var responseText = JSON.parse(response.responseText);
                     console.log(JSON.parse(response.responseText));
                    if(responseText.isErr == 101){
                        alert(responseText.context);
                        sessionStorage.removeItem("site");
                        sessionStorage.removeItem("account");
                        sessionStorage.removeItem("seller");
                        console.log(responseText.context);
                    }
                    if(responseText.isErr == 0){
                        alert("采集成功");
                        console.log('add amazon_monthly success.');
                    }
                }else{
                    console.log("发送数据失败，请联系技术处理！");
                }
            }
        });
    }

})();