var xmlhttp;
var min = 5;
var sec = 59;

var BTC_PRICE_INDEX = 0;
var USD_PRICE_INDEX = 1;
var CURRENCY_UPDATED_TIMESTAMP = 2;
var portfolioCurrencies = {};

function createXMLHttpRequest() {
    xmlhttp = new XMLHttpRequest();
}

function loadPorftolio() {
    min = 4;
    sec = 59;
    createXMLHttpRequest()
    var url = "portfolio.json";
    xmlhttp.onreadystatechange = loadPortfolioResponse;
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Cache-Control","no-cache")
    xmlhttp.send(null)
}

function loadPortfolioResponse() {
    if(xmlhttp != null && xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var portfolioJson = JSON.parse(xmlhttp.responseText);
        displayPortfolio(portfolioJson);
    }
}

function displayPortfolio(portfolio) {
    if(portfolio == null || !portfolio["success"]) {
        return;
    }
    var currencies = []
    var table = "<table border=1>";
    var transactionsTable = "<table border=1>"
    table += "<tr><th>CURRENCY</th><th>BALANCE</th><th>PRICE BTC</th><th>ESTIMATED IN BTC</th><th>PRICE USD</th></th><th>ESTIMATED IN USD</th><th>% 1h</th><th>% 24h</th><th>% 7d</th></tr>"
    transactionsTable += "<tr><th>DATE</th><th>CURRENCY</th><th>BALANCE</th><th>ACQUIRED BTC PRICE</th><th>CURRENT PRICE BTC</th><th>DIFF</th><th>% DIFF</th></tr>"
    var color = "#e6f2ff"
    var changeColor = true;
    for(var i = 0; i < portfolio["result"].length; i++) {
        if(portfolio["result"][i]["Balance"] > 0) {
            currencies.push(portfolio["result"][i])
            if(changeColor) {
                table += "<tr bgcolor='" + color + "'>";
                if(portfolio["result"][i]["Currency"] != "BTC") {
                    transactionsTable += "<tr bgcolor='" + color + "'>";
                }
            }
            else {
                table += "<tr>"
                if(portfolio["result"][i]["Currency"] != "BTC") {
                    transactionsTable += "<tr>";
                }
            }
            changeColor = !changeColor;
            table += "<td>" + portfolio["result"][i]["Currency"] + "</td>";
            table += "<td>" + portfolio["result"][i]["Balance"] + "</td>";
            table += "<td id='"+portfolio["result"][i]["Currency"] +"_PRICE_BTC'></td>";
            table += "<td id='"+portfolio["result"][i]["Currency"] +"_BTC'></td>";
            table += "<td id='"+portfolio["result"][i]["Currency"] +"_PRICE_USD'></td>";
            table += "<td id='"+portfolio["result"][i]["Currency"] +"_USD'></td>";
            table += "<td id='"+portfolio["result"][i]["Currency"] +"_CHANGE_1H'></td>";
            table += "<td id='"+portfolio["result"][i]["Currency"] +"_CHANGE_24H'></td>";
            table += "<td id='"+portfolio["result"][i]["Currency"] +"_CHANGE_7D'></td>";
            table += "</tr>"

            if(portfolio["result"][i]["Currency"] != "BTC") {
                transactionsTable += "<td id='" + portfolio["result"][i]["Currency"] + "_DATE'></td>";
                transactionsTable += "<td>" + portfolio["result"][i]["Currency"] + "</td>";
                transactionsTable += "<td>" + portfolio["result"][i]["Balance"] + "</td>";
                transactionsTable += "<td id='" + portfolio["result"][i]["Currency"] + "_ACQUIRED_PRICE_BTC'></td>";
                transactionsTable += "<td id='" + portfolio["result"][i]["Currency"] + "_CURRENT_PRICE_BTC'></td>";
                transactionsTable += "<td id='" + portfolio["result"][i]["Currency"] + "_PRICE_DIFF_BTC'></td>";
                transactionsTable += "<td id='" + portfolio["result"][i]["Currency"] + "_PRICE_PTC_DIFF_BTC'></td>";
                transactionsTable += "</tr>";
            }
        }
    }
    document.getElementById("container").innerHTML = table;
    document.getElementById("transactions").innerHTML = transactionsTable;
    updateBTCAndUSDEstimates(currencies);
}

function updateBTCAndUSDEstimates(currencies) {
    createXMLHttpRequest()
    var url = "market_status.json";
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var ticker = JSON.parse(this.responseText)
            updateCurrenciesEstimates(currencies, ticker);
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Cache-Control","no-cache")
    xmlhttp.send(null);
}

function updateCurrenciesEstimates(currencies, ticker) {
    var totalUSD = 0.0;
    var totalBTC = 0.0;
    for(i = 0; i < currencies.length; i++) {
        for(j = 0; j < ticker.length; j++) {
            if(ticker[j]["symbol"] == currencies[i]["Currency"]) {

                document.getElementById(currencies[i]["Currency"]+"_PRICE_USD").appendChild(document.createTextNode(""+ticker[j]["price_usd"]));
                document.getElementById(currencies[i]["Currency"]+"_CHANGE_1H").appendChild(document.createTextNode(""+ticker[j]["percent_change_1h"]));
                document.getElementById(currencies[i]["Currency"]+"_CHANGE_24H").appendChild(document.createTextNode(""+ticker[j]["percent_change_24h"]));
                document.getElementById(currencies[i]["Currency"]+"_CHANGE_7D").appendChild(document.createTextNode(""+ticker[j]["percent_change_7d"]));

                appendStatusArrow(currencies[i]["Currency"]+"_CHANGE_1H", ticker[j]["percent_change_1h"]);
                appendStatusArrow(currencies[i]["Currency"]+"_CHANGE_24H", ticker[j]["percent_change_24h"]);
                appendStatusArrow(currencies[i]["Currency"]+"_CHANGE_7D", ticker[j]["percent_change_7d"]);

                var usd = document.getElementById(currencies[i]["Currency"]+"_USD");
                var usdValue = ticker[j]["price_usd"] * currencies[i]["Balance"];
                totalUSD += usdValue;
                usd.appendChild(document.createTextNode(""+ usdValue));
                document.getElementById(currencies[i]["Currency"]+"_PRICE_BTC").appendChild(document.createTextNode(""+ticker[j]["price_btc"]));
                if(ticker[j]["symbol"] != "BTC") {
                    document.getElementById(currencies[i]["Currency"]+"_CURRENT_PRICE_BTC").appendChild(document.createTextNode(""+ticker[j]["price_btc"]));
                }
                var btc = document.getElementById(currencies[i]["Currency"]+"_BTC");
                var btcValue = ticker[j]["price_btc"] * currencies[i]["Balance"];
                totalBTC += btcValue;
                btc.appendChild(document.createTextNode(""+ btcValue));
                if (portfolioCurrencies[ticker[j]["symbol"]] == null) {
                    portfolioCurrencies[ticker[j]["symbol"]] = [ticker[j]["price_btc"], ticker[j]["price_usd"], Math.floor(Date.now()/1000)]
                    break;
                }
                portfolioCurrencies[ticker[j]["symbol"]][CURRENCY_UPDATED_TIMESTAMP] = Math.floor(Date.now()/1000)
                break;
            }
        }
    }
    document.getElementById("today").innerHTML = "<p> TODAY: " + new Date().toISOString() + "</p>";
    if(portfolioCurrencies["totals"] == null) {
        portfolioCurrencies["totals"] = [totalBTC, totalUSD, Math.floor(Date.now()/1000)];
        document.getElementById("totals").innerHTML = "<p> BTC: " + totalBTC + " USD: " + totalUSD + "</p>";
        updateTransactions(currencies, ticker)
        return;
    }

    var totalsHtml = "<p> BTC: " + totalBTC;
    totalsHtml += arrowStatusString(totalBTC, portfolioCurrencies["totals"][BTC_PRICE_INDEX]);
    totalsHtml += " USD: " + totalUSD;
    totalsHtml += arrowStatusString(totalUSD, portfolioCurrencies["totals"][USD_PRICE_INDEX]);
    totalsHtml += " </p>";
    document.getElementById("totals").innerHTML = totalsHtml;
    portfolioCurrencies["totals"][BTC_PRICE_INDEX] = totalBTC;
    portfolioCurrencies["totals"][USD_PRICE_INDEX] = totalUSD;
    portfolioCurrencies["totals"][CURRENCY_UPDATED_TIMESTAMP] = Math.floor(Date.now()/1000);
    updateTransactions(currencies, ticker)
}

function updateTransactions(currencies, ticker) {
    createXMLHttpRequest()
    var url = "orders.json";
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var orders = JSON.parse(this.responseText)
            exchanges = exchangesMap(orders["result"])
            for(i = 0; i < currencies.length; i++) {
                for(j=0; j< ticker.length; j++) {
                    if(ticker[j]["symbol"] == currencies[i]["Currency"]) {
                        if(exchanges[ticker[j]["symbol"]] == null) {
                            if(ticker[j]["symbol"] != "BTC") {
                                updateTransactionFromHistoryCSV(ticker[j])
                            }
                            break;
                        }
                        document.getElementById(""+ticker[j]["symbol"]+"_DATE").appendChild(document.createTextNode(""+exchanges[ticker[j]["symbol"]]["TimeStamp"]))
                        document.getElementById(""+ticker[j]["symbol"]+"_ACQUIRED_PRICE_BTC").appendChild(document.createTextNode(""+exchanges[ticker[j]["symbol"]]["PricePerUnit"]))
                        var diff = ticker[j]["price_btc"] - exchanges[ticker[j]["symbol"]]["PricePerUnit"]
                        var ptcDiff = 100*((ticker[j]["price_btc"] - exchanges[ticker[j]["symbol"]]["PricePerUnit"])/exchanges[ticker[j]["symbol"]]["PricePerUnit"])
                        document.getElementById(""+ticker[j]["symbol"]+"_PRICE_DIFF_BTC").appendChild(document.createTextNode(""+diff))
                        document.getElementById(""+ticker[j]["symbol"]+"_PRICE_PTC_DIFF_BTC").appendChild(document.createTextNode(""+ptcDiff.toFixed(2)))
                        appendStatusArrow(""+ticker[j]["symbol"]+"_PRICE_DIFF_BTC", diff)
                        appendStatusArrow(""+ticker[j]["symbol"]+"_PRICE_PTC_DIFF_BTC", ptcDiff)
                        break;
                    }
                }
            }
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Cache-Control","no-cache")
    xmlhttp.send(null);
}

function updateTransactionFromHistoryCSV(tickerItem) {
    var xmlhttpReq = new XMLHttpRequest();
    var url = "http://131.153.38.104:5000/get_last_transaction/BTC-" +tickerItem["symbol"]
    xmlhttpReq.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var order = JSON.parse(this.responseText)
            document.getElementById(""+tickerItem["symbol"]+"_DATE").appendChild(document.createTextNode(""+order["date"]))
            document.getElementById(""+tickerItem["symbol"]+"_ACQUIRED_PRICE_BTC").appendChild(document.createTextNode(""+order["price"]))
            var diff = tickerItem["price_btc"] - order["price"]
            var ptcDiff = 100*((tickerItem["price_btc"] - order["price"])/order["price"])
            document.getElementById(""+tickerItem["symbol"]+"_PRICE_DIFF_BTC").appendChild(document.createTextNode(""+diff))
            document.getElementById(""+tickerItem["symbol"]+"_PRICE_PTC_DIFF_BTC").appendChild(document.createTextNode(""+ptcDiff.toFixed(2)))
            appendStatusArrow(""+tickerItem["symbol"]+"_PRICE_DIFF_BTC", diff)
            appendStatusArrow(""+tickerItem["symbol"]+"_PRICE_PTC_DIFF_BTC", ptcDiff)
        } 
    }
    xmlhttpReq.open("GET", url, true);
    xmlhttpReq.send(null);
}

function exchangesMap(all_orders) {
    var lastExchanges = {}
    for(i = 0; i < all_orders.length; i++) {
        var key = all_orders[i]["Exchange"].split("-")[1]
        if(lastExchanges[key] == null) {
            lastExchanges[key] = all_orders[i];
        }
    }
    return lastExchanges
}

function arrowStatusString(currentTotalsValue, lastTotalsValue) {
    if(lastTotalsValue > currentTotalsValue) {
        return " <img src='img/arrow_up_green.png' width='15' height='15' title='" +calculatePtcChange(currentTotalsValue, lastTotalsValue) + "' /> ";
    }
    else if(lastTotalsValue < currentTotalsValue) {
        return " <img src='img/down.jpg' width='15' height='15' title='" +calculatePtcChange(currentTotalsValue, lastTotalsValue) + "' /> ";
    }
    return "";
}

function appendStatusArrow(domElementId, change_value) {
    if(change_value > 0) {
        img_up = createImgDom("img/arrow_up_green.png");
        document.getElementById(domElementId).appendChild(img_up);
    }
    else if(change_value < 0) {
        img_dwn = createImgDom("img/down.jpg");
        document.getElementById(domElementId).appendChild(img_dwn);
    }
}

function calculatePtcChange(currentVal, lastVal) {
    return Math.abs((lastVal - currentVal)/lastVal)
}
function createImgDom(src) {
    img = document.createElement("img");
    img.src = src;
    img.width = 15;
    img.height = 15;
    return img;
}

function start() {
    loadPorftolio()

    var refreshInterval = 5*60*1000;
    window.setInterval(loadPorftolio, refreshInterval);
    window.setInterval(refreshTime, 1000);
}

function refreshTime() {
    if(sec >= 10) {
        document.getElementById("reload").innerHTML = "<p>Reload - " + min + ":" + sec + " </p>";
    }
    else {
        document.getElementById("reload").innerHTML = "<p>Reload - " + min + ":0" + sec + " </p>";
    }
    sec--;
    if(sec < 0) {
        min--;
        sec = 59;
    }
}
