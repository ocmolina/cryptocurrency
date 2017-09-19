import argparse
import hashlib
import hmac
import requests
import time

def main():
    parser = argparse.ArgumentParser(description="download portfolio and state of the market")
    parser.add_argument("--path", type=str, required=True)
    args = parser.parse_args()
    get_portfolio(args.path)
    get_coinmarketcap_stats(args.path)
    get_order_history(args.path)


def bittrex_request(operation):
    nonce = int(time.time())
    api_key = "apiKey"
    secret = "secret"
    url = "https://bittrex.com/api/v1.1/account/{}?apikey={}&nonce={}".format(operation, api_key, nonce)
    sign = hmac.new(secret, url, hashlib.sha512)
    headers = {
        "apisign": sign.hexdigest(),
        "Cache-Control": "no-cache"
    }
    return url, headers

def get_portfolio(path):
    url, headers = bittrex_request("getbalances")
    file_name = "{}/portfolio.json".format(path)
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        save(file_name, response.text)


def get_order_history(path):
    url, headers = bittrex_request("getorderhistory")
    file_name = "{}/orders.json".format(path)
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        save(file_name, response.text)


def get_coinmarketcap_stats(path):
    url = "https://api.coinmarketcap.com/v1/ticker/"
    headers = {
        "Cache-Control": "no-cache"
    }
    response = requests.get(url, headers=headers)
    file_name = "{}/market_status.json".format(path)
    if response.status_code == 200:
        save(file_name, response.text)


def save(file_name, response_text):
    with open(file_name, "w") as output:
        output.write(response_text)
    output.close()


if __name__ == '__main__':
    main()
