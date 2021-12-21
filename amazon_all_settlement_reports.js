// ==UserScript==
// @name         亚马逊结算报表
// @namespace    gonglang_amazon
// @version      2021.12.21
// @description  try to take over the world!
// @description  演示账号lesnna1002@outlook.com-us
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
// @match        https://sellercentral.amazon.com/payments/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @require      http://code.jquery.com/jquery-1.11.0.min.js
// @updateURL    http://113.108.97.88:91/v3real/api/amazon_tampermonkey/amazon_all_settlement_reports.js
// ==/UserScript==

(function() {
    'use strict';
    var $ = $ || window.$;
    setTimeout(function(){
        let html = "<kat-button class='form-search-button' id='amazon_settlements_collection' label='v3结算报表采集' variant='primary'  size='base'></kat-button>";
        $(".form-search-button").after(html);
        $("#amazon_settlements_collection").click(function(){
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
            DataCollection(account);
        });
    },1500);

    //匹配标签获取想要的内容
    function DataCollection(account){
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
        //获取下载结算文件id
        var data_arr = [];
        var down_ids=new Array()
        $("#financialEventGroupList").find("tbody").find("tr").each(function(){
            var is_download = $(this).find("td:last").children().children().prop("className");
            if(is_download == "report-download"){ //如果是下载状态才采集
                var td_date = $(this).find("td.joyride-dashboard-link").find('.group-timerange');
                var infoDate = td_date[0].innerText;
                console.log(infoDate);
                var report_download_class = $(this).find("td.joyride-reports").find('.report-download kat-dropdown-button');
                report_download_class.each(function(){
                    let temp_child_nodes =$(this)[0].shadowRoot.childNodes;
                    //console.log(temp_child_nodes);return;
                    temp_child_nodes.forEach((elem, index) => {
                        elem.childNodes.forEach((elem1, index1) => {
                            if(elem1.className=='button' && elem1.tagName=='BUTTON'){
                                //console.log(elem1)
                                if(elem1.dataset.action){
                                    var reports_id = elem1.dataset.action;
                                    var url_download ='https://sellercentral.amazon.com/payments/reports/download?_encoding=UTF8&contentType=text%2Fcsv';
                                    url_download = url_download + '&fileName='+infoDate+'.csv&referenceId='+reports_id;
                                    var file_name = infoDate;
                                    //down_ids.push({'id':elem1.dataset.action,'innerText':elem1.innerText,'time':'1111233'})
                                    GM_xmlhttpRequest({
                                        method: "GET",
                                        url: url_download,
                                        synchronous: true,
                                        onload: function(response) {
                                            //console.log(response);
                                            if(response.status = 200){
                                                var data = '';
                                                data += 'action=create';
                                                data += '&account='+account;
                                                data += '&infoDate='+infoDate;
                                                data += '&file_name='+file_name;
                                                var csv = response.responseText;
                                                var json_scv =encodeURIComponent(csv);
                                                data += '&dataJson='+json_scv;
                                                console.log(csv);
                                                amazon_all_settlement_reports_add(data);
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    });
                })
            }
        });
    }

    function amazon_all_settlement_reports_add(data){
        GM_xmlhttpRequest({
            method: "POST",
            data : data,
            url: "http://113.108.97.88:91/v3real/api/amazon_funds_details_collection.php",
            // url: "http://192.168.4.40/api/amazon_new_monthly_details_api.php",
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
                        alert(responseText.context);
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