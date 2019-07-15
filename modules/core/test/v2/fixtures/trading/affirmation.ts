import { AffirmationStatus } from '../../../../src/v2/trading/affirmation';

export default {
  listAffirmations: {
    affirmations: [
      {
        id: '8c25d5e9-ec3e-41d4-9c5e-b517f9e6c2a9',
        partyAccountId: '5cf997706280263a00fe912d66361bb9',
        status: 'affirmed',
        settlement: 'e19f3371-46dd-4e0a-9817-253060c1f610',
        lock: {
          id: '07eb3e5c-453f-4d4b-bff0-7defb1a7fa25',
          accountId: '5cf997706280263a00fe912d66361bb9',
          status: 'settled',
          amount: '43144',
          currency: 'ofctbtc',
          createdAt: '2019-06-06T22:45:09.988Z'
        },
        payload: '{"walletId":"5cf997706280263a00fe912d66361bb9","currency":"ofctbtc","amount":"43144","nonceHold":"AVGynQTfZb8V4WlK7RRqaQ==","nonceSettle":"QlOA+ob2U5JFsV27pNVYDg==","otherParties":["5cf9976f6280263a00fe911648fc2d6d"]}',
        signature: '203075f08e6295853cf2c40974f0d813b19abd1eff65a4c77950dea50f2dbaf5904baacd1e97b42f4f4d4621cc1034198a34ee903e4e00c6ae5899a51f3a1f7a33',
        createdAt: '2019-06-06T22:45:10.114Z',
        expireAt: '2019-06-07T22:45:10.105Z'
      },
      {
        id: 'c22bfbed-9a16-4319-b26c-f15caaf80cc2',
        partyAccountId: '5cf997706280263a00fe912d66361bb9',
        status: 'rejected',
        settlement: '6804c586-d65a-40b9-a2b3-66352ec4b964',
        lock: {
          id: '68c1d408-87cf-4c30-91cb-a9271c9526d7',
          accountId: '5cf997706280263a00fe912d66361bb9',
          status: 'released',
          amount: '62369',
          currency: 'ofctbtc',
          createdAt: '2019-06-06T22:45:20.352Z'
        },
        payload: '{"walletId":"5cf997706280263a00fe912d66361bb9","currency":"ofctbtc","amount":"62369","nonceHold":"7D5LPdn2/dW6hVXCtQKjiw==","nonceSettle":"DZX72/xWxjloNmGjies4tw==","otherParties":["5cf9976f6280263a00fe911648fc2d6d"]}',
        createdAt: '2019-06-06T22:45:20.433Z',
        expireAt: '2019-06-07T22:45:20.426Z'
      },
      {
        id: 'a89bb2f8-a927-4fea-aa1c-cf2846765bec',
        partyAccountId: '5cf9976f6280263a00fe911648fc2d6d',
        status: 'canceled',
        settlement: 'abc84f76-4b6e-4a1b-9867-e213de2c2b45',
        lock: {
          id: '0e1f2742-e446-4572-ac7d-8b0a3b16169b',
          accountId: '5cf9976f6280263a00fe911648fc2d6d',
          status: 'released',
          amount: '94386',
          currency: 'ofctusd',
          createdAt: '2019-06-06T22:45:28.794Z'
        },
        payload: '{"walletId":"5cf9976f6280263a00fe911648fc2d6d","currency":"ofctusd","amount":"94386","nonceHold":"Y/MzgFBTR5jw3qIKj9kpHw==","nonceSettle":"L6U3HmJQhvdHeyheramwiw==","otherParties":["5cf997706280263a00fe912d66361bb9"]}',
        signature: '1f6489c0443bf28094b960f20ab44cfcd8b30df3211c9b958cd0a6c9ddd9eb2e9d7b32d3c12f13a9ea51f277db9f9fd5d719fd219e09c5de34fc4d5de098948ae9',
        createdAt: '2019-06-06T22:45:28.864Z',
        expireAt: '2019-06-07T22:45:28.860Z'
      }
    ]
  },
  listOverdueAffirmations: {
    affirmations: [
      {
        id: 'c22bfbed-9a16-4319-b26c-f15caaf80cc2',
        partyAccountId: '5cf997706280263a00fe912d66361bb9',
        status: 'overdue',
        settlement: '6804c586-d65a-40b9-a2b3-66352ec4b964',
        lock: {
          id: '68c1d408-87cf-4c30-91cb-a9271c9526d7',
          accountId: '5cf997706280263a00fe912d66361bb9',
          status: 'released',
          amount: '62369',
          currency: 'ofctbtc',
          createdAt: '2019-06-06T22:45:20.352Z'
        },
        payload: '{"walletId":"5cf997706280263a00fe912d66361bb9","currency":"ofctbtc","amount":"62369","nonceHold":"7D5LPdn2/dW6hVXCtQKjiw==","nonceSettle":"DZX72/xWxjloNmGjies4tw==","otherParties":["5cf9976f6280263a00fe911648fc2d6d"]}',
        createdAt: '2019-06-06T22:45:20.433Z',
        expireAt: '2019-06-07T22:45:20.426Z'
      }
    ]
  },
  singleAffirmation: {
    id: '8c25d5e9-ec3e-41d4-9c5e-b517f9e6c2a9',
    partyAccountId: '5cf997706280263a00fe912d66361bb9',
    status: 'affirmed',
    settlement: 'e19f3371-46dd-4e0a-9817-253060c1f610',
    lock: {
      id: '07eb3e5c-453f-4d4b-bff0-7defb1a7fa25',
      accountId: '5cf997706280263a00fe912d66361bb9',
      status: 'settled',
      amount: '43144',
      currency: 'ofctbtc',
      createdAt: '2019-06-06T22:45:09.988Z'
    },
    payload: '{"walletId":"5cf997706280263a00fe912d66361bb9","currency":"ofctbtc","amount":"43144","nonceHold":"AVGynQTfZb8V4WlK7RRqaQ==","nonceSettle":"QlOA+ob2U5JFsV27pNVYDg==","otherParties":["5cf9976f6280263a00fe911648fc2d6d"]}',
    signature: '203075f08e6295853cf2c40974f0d813b19abd1eff65a4c77950dea50f2dbaf5904baacd1e97b42f4f4d4621cc1034198a34ee903e4e00c6ae5899a51f3a1f7a33',
    createdAt: '2019-06-06T22:45:10.114Z',
    expireAt: '2019-06-07T22:45:10.105Z'
  },
  affirmAffirmationPayloadRequest: {
    version: '1.1.1',
    accountId: '5cf940969449412d00f53b4c55fc2139',
    currency: 'ofctusd',
    amount: '555',
    otherParties: [
      {
        accountId: '5cf940a49449412d00f53b8f7392f7c0',
        amount: '500',
        currency: 'ofctbtc'
      }
    ]
  },
  affirmAffirmationPayloadResponse: {
    payload: '{"version":"1.1.1","accountId":"5cf940969449412d00f53b4c55fc2139","currency":"ofctusd","subtotal":"555","amount":"555","nonceHold":"djTPc0eRtQixTviodw1iJQ==","nonceSettle":"Wemw9X+iFcwsRFV3nJebxA==","otherParties":[{"accountId":"5cf940a49449412d00f53b8f7392f7c0","currency":"ofctbtc","amount":"500"}]}'
  },
  updateAffirmation: function(status) {
    const affirmation = { status, ...this.singleAffirmation };
    if (status !== AffirmationStatus.AFFIRMED) {
      delete affirmation.payload;
      delete affirmation.signature;
    }
    return affirmation;
  }
};

