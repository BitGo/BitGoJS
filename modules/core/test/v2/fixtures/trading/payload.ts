export default {
  validPayload: {
    payload: JSON.stringify({
      version: '1.1.1',
      accountId: 'walletId',
      currency: 'ofctbtc',
      amount: '100000000',
      nonceHold: 'bfrE8itPwYZB+ofDhblE6g==',
      nonceSettle: 'EymF2LXnRzn8acbcCFwgUA==',
      otherParties: [
        {
          accountId: 'test_counterparty_1',
          currency: 'ofctusd',
          amount: '10000'
        },
        {
          accountId: 'test_counterparty_2',
          currency: 'ofctusd',
          amount: '90000'
        }
      ]
    })
  },
  invalidPayload: {
    payload: JSON.stringify({
      version: '1.1.1',
      accountId: 'walletId',
      currency: 'ofctbtc',
      amount: '10000000000',
      nonceHold: 'bfrE8itPwYZB+ofDhblE6g==',
      nonceSettle: 'EymF2LXnRzn8acbcCFwgUA==',
      otherParties: [
        {
          accountId: 'test_counterparty_1',
          currency: 'ofctusd',
          amount: '0'
        },
        {
          accountId: 'test_counterparty_2',
          currency: 'ofctusd',
          amount: '0'
        }
      ]
    })
  }
};
