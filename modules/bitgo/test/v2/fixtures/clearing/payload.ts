export default {
  validPayloadWithFees: {
    payload: JSON.stringify({
      version: '1.2.0',
      accountId: 'walletId',
      nonceHold: 'bfrE8itPwYZB+ofDhblE6g==',
      nonceSettle: 'EymF2LXnRzn8acbcCFwgUA==',
      amounts: [
        {
          accountId: 'walletId',
          sendCurrency: 'ofctbtc',
          sendSubtotal: '100000000',
          sendAmount: '100500000',
          receiveCurrency: 'ofctusd',
          receiveAmount: '90000',
          fees: [
            {
              feeType: 'SETTLEMENT_FEE',
              feeAmount: '500000',
            },
          ],
        },
        {
          accountId: 'counterparty_account_id',
          sendCurrency: 'ofctusd',
          sendSubtotal: '90000',
          sendAmount: '90000',
          receiveCurrency: 'ofctbtc',
          receiveAmount: '100000000',
        },
      ],
    }),
  },
  invalidPayload: {
    payload: JSON.stringify({
      version: '1.2.0',
      accountId: 'walletId',
      nonceHold: 'bfrE8itPwYZB+ofDhblE6g==',
      nonceSettle: 'EymF2LXnRzn8acbcCFwgUA==',
      amounts: [
        {
          accountId: 'walletId',
          sendCurrency: 'ofctbtc',
          sendSubtotal: '100000010',
          fees: [
            {
              feeType: 'SETTLEMENT_FEE',
              feeAmount: '500000',
            },
          ],
          sendAmount: '100000000',
          receiveCurrency: 'ofctusd',
          receiveAmount: '90000',
        },
        {
          accountId: 'counterparty_account_id',
          sendCurrency: 'ofctusd',
          sendSubtotal: '90000',
          sendAmount: '90000',
          receiveCurrency: 'ofctbtc',
          receiveAmount: '100000000',
        },
      ],
    }),
  },
};
