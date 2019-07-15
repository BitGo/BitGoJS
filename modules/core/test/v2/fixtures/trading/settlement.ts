export default {
  listSettlements: {
    settlements: [{
      id: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
      requesterAccountId: '5cf940969449412d00f53b4c55fc2139',
      status: 'pending',
      affirmations: [{
        id: 'f8259b32-6407-4c42-a48d-7519e7d1905f',
        partyAccountId: '5cf940969449412d00f53b4c55fc2139',
        status: 'affirmed',
        settlement: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
        lock: {
          id: '82d2c6f7-5e09-4dc6-8847-cf862f519590',
          accountId: '5cf940969449412d00f53b4c55fc2139',
          status: 'active',
          amount: '555',
          currency: 'ofctusd',
          createdAt: '2019-06-06T16:36:21.985Z'
        },
        payload: '{"walletId":"5cf940969449412d00f53b4c55fc2139","currency":"ofctusd","amount":"555","nonceHold":"brJ/Ufv/v4Fg8Emap4vnIA==","nonceSettle":"fMOE8AEEGJVdXZ7143B+qQ==","otherParties":["5cf940a49449412d00f53b8f7392f7c0"]}',
        signature: '2049b6cd2e2693f26415987cb14a9e14be81ddf1e3e370fe19477e7da5237835f9467e5846a4d12a7fd23e860153083938080fe1d8f78f673851e470a9e45f7e3d',
        createdAt: '2019-06-06T16:36:22.062Z',
        expireAt: '2019-06-07T16:36:22.057Z'
      }, {
        id: 'c412e732-c4ea-4ff2-b157-403893cee47b',
        partyAccountId: '5cf940a49449412d00f53b8f7392f7c0',
        status: 'pending',
        settlement: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
        lock: {
          id: 'f95c2d97-3841-4aa7-b80c-1d7b31f5503c',
          accountId: '5cf940a49449412d00f53b8f7392f7c0',
          status: 'active',
          amount: '500',
          currency: 'ofctbtc',
          createdAt: '2019-06-06T16:36:21.980Z'
        },
        payload: '{"walletId":"5cf940a49449412d00f53b8f7392f7c0","currency":"ofctbtc","amount":"500","nonceHold":"p49hiYWcz32epVRvjWOkNw==","nonceSettle":"DKXmnh1fxupuvLc0OU/e4g==","otherParties":["5cf940969449412d00f53b4c55fc2139"]}',
        createdAt: '2019-06-06T16:36:22.066Z',
        expireAt: '2019-06-07T16:36:22.057Z'
      }],
      expireAt: '2019-06-07T16:36:22.057Z',
      createdAt: '2019-06-06T16:36:22.058Z',
      trades: [{
        id: '027f0ff0-4e34-4824-899c-4fd33d46abc4',
        externalId: 'a4o3ah601etw676okvkvsmizciorxc8v',
        baseAccountId: '5cf940a49449412d00f53b8f7392f7c0',
        quoteAccountId: '5cf940969449412d00f53b4c55fc2139',
        timestamp: '2019-06-06T16:36:20.810Z',
        status: 'executed',
        baseAmount: '500',
        quoteAmount: '555',
        baseCurrency: 'ofctbtc',
        quoteCurrency: 'ofctusd',
        costBasis: '12345',
        costBasisCurrency: 'USD'
      }]
    }]
  },
  singleSettlementId: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
  getSingleSettlement: {
    id: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
    requesterAccountId: '5cf940969449412d00f53b4c55fc2139',
    status: 'pending',
    affirmations: [{
      id: 'f8259b32-6407-4c42-a48d-7519e7d1905f',
      partyAccountId: '5cf940969449412d00f53b4c55fc2139',
      status: 'affirmed',
      settlement: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
      lock: {
        id: '82d2c6f7-5e09-4dc6-8847-cf862f519590',
        accountId: '5cf940969449412d00f53b4c55fc2139',
        status: 'active',
        amount: '555',
        currency: 'ofctusd',
        createdAt: '2019-06-06T16:36:21.985Z'
      },
      payload: '{"walletId":"5cf940969449412d00f53b4c55fc2139","currency":"ofctusd","amount":"555","nonceHold":"brJ/Ufv/v4Fg8Emap4vnIA==","nonceSettle":"fMOE8AEEGJVdXZ7143B+qQ==","otherParties":["5cf940a49449412d00f53b8f7392f7c0"]}',
      signature: '2049b6cd2e2693f26415987cb14a9e14be81ddf1e3e370fe19477e7da5237835f9467e5846a4d12a7fd23e860153083938080fe1d8f78f673851e470a9e45f7e3d',
      createdAt: '2019-06-06T16:36:22.062Z',
      expireAt: '2019-06-07T16:36:22.057Z'
    }, {
      id: 'c412e732-c4ea-4ff2-b157-403893cee47b',
      partyAccountId: '5cf940a49449412d00f53b8f7392f7c0',
      status: 'pending',
      settlement: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
      lock: {
        id: 'f95c2d97-3841-4aa7-b80c-1d7b31f5503c',
        accountId: '5cf940a49449412d00f53b8f7392f7c0',
        status: 'active',
        amount: '500',
        currency: 'ofctbtc',
        createdAt: '2019-06-06T16:36:21.980Z'
      },
      payload: '{"walletId":"5cf940a49449412d00f53b8f7392f7c0","currency":"ofctbtc","amount":"500","nonceHold":"p49hiYWcz32epVRvjWOkNw==","nonceSettle":"DKXmnh1fxupuvLc0OU/e4g==","otherParties":["5cf940969449412d00f53b4c55fc2139"]}',
      createdAt: '2019-06-06T16:36:22.066Z',
      expireAt: '2019-06-07T16:36:22.057Z'
    }],
    expireAt: '2019-06-07T16:36:22.057Z',
    createdAt: '2019-06-06T16:36:22.058Z',
    trades: [{
      id: '027f0ff0-4e34-4824-899c-4fd33d46abc4',
      externalId: 'a4o3ah601etw676okvkvsmizciorxc8v',
      baseAccountId: '5cf940a49449412d00f53b8f7392f7c0',
      quoteAccountId: '5cf940969449412d00f53b4c55fc2139',
      timestamp: '2019-06-06T16:36:20.810Z',
      status: 'executed',
      baseAmount: '500',
      quoteAmount: '555',
      baseCurrency: 'ofctbtc',
      quoteCurrency: 'ofctusd',
      costBasis: '12345',
      costBasisCurrency: 'USD'
    }]
  },
  createSettlementPayloadRequest: {
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
  createSettlementPayloadResponse: {
    payload: '{"version":"1.1.1","accountId":"5cf940969449412d00f53b4c55fc2139","currency":"ofctusd","subtotal":"555","amount":"555","nonceHold":"djTPc0eRtQixTviodw1iJQ==","nonceSettle":"Wemw9X+iFcwsRFV3nJebxA==","otherParties":[{"accountId":"5cf940a49449412d00f53b8f7392f7c0","currency":"ofctbtc","amount":"500"}]}'
  },
  createSettlementRequest: {
    requesterAccountId: '5cf940969449412d00f53b4c55fc2139',
    payload: /{.*}/,
    signature: /[0-9a-fA-F]*/,
    trades: [{
      baseAccountId: '5cf940a49449412d00f53b8f7392f7c0',
      quoteAccountId: '5cf940969449412d00f53b4c55fc2139',
      status: 'executed',
      timestamp: '2019-06-06T16:36:20.810Z',
      baseAmount: '500',
      baseCurrency: 'ofctbtc',
      quoteAmount: '555',
      quoteCurrency: 'ofctusd',
      costBasis: '12345',
      costBasisCurrency: 'USD',
      externalId: 'a4o3ah601etw676okvkvsmizciorxc8v'
    }]
  },
  createSettlementResponse: {
    id: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
    requesterAccountId: '5cf940969449412d00f53b4c55fc2139',
    status: 'pending',
    affirmations: [{
      id: 'c412e732-c4ea-4ff2-b157-403893cee47b',
      partyAccountId: '5cf940a49449412d00f53b8f7392f7c0',
      status: 'pending',
      settlement: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
      lock: {
        id: 'f95c2d97-3841-4aa7-b80c-1d7b31f5503c',
        accountId: '5cf940a49449412d00f53b8f7392f7c0',
        status: 'active',
        amount: '500',
        currency: 'ofctbtc',
        createdAt: '2019-06-06T16:36:21.980Z'
      },
      payload: '{"walletId":"5cf940a49449412d00f53b8f7392f7c0","currency":"ofctbtc","amount":"500","nonceHold":"2qhiUpjDClL/+zHmH2mjmQ==","nonceSettle":"TqVH080/QT8zEDNGgAWzcw==","otherParties":["5cf940969449412d00f53b4c55fc2139"]}',
      createdAt: '2019-06-06T16:36:22.066Z',
      expireAt: '2019-06-07T16:36:22.057Z'
    }, {
      id: 'f8259b32-6407-4c42-a48d-7519e7d1905f',
      partyAccountId: '5cf940969449412d00f53b4c55fc2139',
      status: 'affirmed',
      settlement: 'fbbb8da8-e7a3-4d9e-82a3-fc396abf9890',
      lock: {
        id: '82d2c6f7-5e09-4dc6-8847-cf862f519590',
        accountId: '5cf940969449412d00f53b4c55fc2139',
        status: 'active',
        amount: '555',
        currency: 'ofctusd',
        createdAt: '2019-06-06T16:36:21.985Z'
      },
      payload: '{"walletId":"5cf940969449412d00f53b4c55fc2139","currency":"ofctusd","amount":"555","nonceHold":"brJ/Ufv/v4Fg8Emap4vnIA==","nonceSettle":"fMOE8AEEGJVdXZ7143B+qQ==","otherParties":["5cf940a49449412d00f53b8f7392f7c0"]}',
      signature: '2049b6cd2e2693f26415987cb14a9e14be81ddf1e3e370fe19477e7da5237835f9467e5846a4d12a7fd23e860153083938080fe1d8f78f673851e470a9e45f7e3d',
      createdAt: '2019-06-06T16:36:22.062Z',
      expireAt: '2019-06-07T16:36:22.057Z'
    }],
    expireAt: '2019-06-07T16:36:22.057Z',
    createdAt: '2019-06-06T16:36:22.058Z',
    trades: [{
      id: '027f0ff0-4e34-4824-899c-4fd33d46abc4',
      externalId: 'a4o3ah601etw676okvkvsmizciorxc8v',
      baseAccountId: '5cf940a49449412d00f53b8f7392f7c0',
      quoteAccountId: '5cf940969449412d00f53b4c55fc2139',
      timestamp: '2019-06-06T16:36:20.810Z',
      status: 'executed',
      baseAmount: '500',
      quoteAmount: '555',
      baseCurrency: 'ofctbtc',
      quoteCurrency: 'ofctusd',
      costBasis: '12345',
      costBasisCurrency: 'USD'
    }]
  }
};
