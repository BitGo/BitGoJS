import { coroutine as co } from 'bluebird';
import * as should from 'should';
import * as nock from 'nock';

import { Enterprise } from '../../../../src/v2/enterprise';
import { Wallet } from '../../../../src/v2/wallet';
import { TestBitGo } from '../../../lib/test_bitgo';
import { Environments } from '../../../../src/common';

describe('Trading Accounts', function() {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let basecoin;
  let enterprise;
  let tradingAccount;

  before(co(function *() {
    bitgo = new TestBitGo({ env: 'mock', microservicesUri });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ofc');

    enterprise = new Enterprise(bitgo, basecoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });

    const walletData = {
      id: 'walletId',
      coin: 'tofc',
      enterprise: enterprise.id
    };

    const wallet = new Wallet(bitgo, basecoin, walletData);
    tradingAccount = wallet.toTradingAccount();
  }));

  it('should calculate settlement fees', co(function *() {
    const msScope = nock(microservicesUri)
      .post(`/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/calculatefees`, {
        counterpartyAccountId: 'counterpartyId',
        receiveAmount: '100000000',
        receiveCurrency: 'ofctbtc',
        sendAmount: '1000000',
        sendCurrency: 'ofctusd'
      })
      .reply(200, {
        feeRate: '1',
        feeAmount: '100',
        feeCurrency: 'ofctusd'
      });

    const settlementFees = yield tradingAccount.calculateSettlementFees({
      counterpartyAccountId: 'counterpartyId',
      receiveAmount: '100000000',
      receiveCurrency: 'ofctbtc',
      sendAmount: '1000000',
      sendCurrency: 'ofctusd'
    });

    should.exist(settlementFees);
    settlementFees.should.have.property('feeRate', '1');
    settlementFees.should.have.property('feeAmount', '100');
    settlementFees.should.have.property('feeCurrency', 'ofctusd');

    msScope.isDone().should.be.True();
  }));
});
