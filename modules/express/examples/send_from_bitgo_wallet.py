#!/usr/bin/env python3

import json
import requests
import time
import pyotp

"""
This script requires BitGo Express to be running
Instructions to install and run BitGo Express: https://developers.bitgo.com/guides/get-started/express/install
Prod-specific instructions: https://developers.bitgo.com/guides/get-started/express/production
"""
# test configuration
env = 'test' # 'test' | 'prod'
BITGO_EXPRESS_URL = 'http://localhost:3080'
BITGO_BASE_URL = 'https://app.bitgo{}.com'.format('-test' if env == 'test' else '')
increment = 1
sleepTimeSec = 3
totalRequests = 1
onlyGetOtp = False
# request info
token = ''
wallet = '' # sender
receiver = ''
walletPassphrase = ''
# if sending on an ofc wallet, ensure the coin name is the ofc coin name
coin = 'ofctbtc'
amountToSend = 1
"""
INSERT URI BELOW IF TESTING IN PROD, else just set to None.
To get the URI:
1. Login to your prod account
2. Settings -> Accounts & Preferences -> Add a 2fa Method -> Time-based One Time Password
3. Convert the displayed QR code to text (there are online converters for this) and input this text as the argument below
4. Run this script with onlyGetOtp set to True and env set to 'prod'
5. Use the printed OTP to confirm the new token in the UI and add the token
"""
totp = pyotp.parse_uri('otpauth://totp/...')

def log_step(step, info):
    print('{}: {}'.format(step.upper(), info))

def get_otp():
    if env == 'prod':
        return str(totp.now())
    else:
        return '000000'

def bearer_token():
    return 'Bearer ' + token

def transfer_from_trading_account():
    global amountToSend
    url = '{}/api/v2/{}/wallet/{}/sendcoins'.format(BITGO_EXPRESS_URL, coin, wallet)
    payload = {
      "address": receiver,
      "amount": str(amountToSend),
      "walletPassphrase": walletPassphrase
    }
    amountToSend += increment
    response = requests.post(url, json=payload, headers=dict(Authorization=bearer_token()))
    log_step('transfering from TA', response.text)

def unlock_token():
    url = 'https://app.bitgo-test.com/api/v2/user/unlock'
    payload = {
        "duration": 3600,
        "otp": get_otp()
    }
    response = requests.post(url, json=payload, headers=dict(Authorization=bearer_token()))
    log_step('unlocking token', response.text)

def run_test(): 
    unlock_token()
    for i in range(totalRequests):
        print('{} {}'.format(env.upper(), i + 1))
        transfer_from_trading_account()
        time.sleep(sleepTimeSec)

def main():
    if onlyGetOtp:
        log_step('getting otp', get_otp())
    else:
        run_test()

if __name__ == "__main__":
    main()