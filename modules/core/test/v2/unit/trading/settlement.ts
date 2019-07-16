import { coroutine as co } from 'bluebird';
import * as should from 'should';
import * as nock from 'nock';

import fixtures from '../../fixtures/trading/settlement';
import { TradeStatus } from '../../../../src/v2/trading/trade';
import { AffirmationStatus } from '../../../../src/v2/trading/affirmation';
import { SettlementStatus } from '../../../../src/v2/trading/settlement';

import { Wallet } from '../../../../src/v2/wallet';
import { Enterprise } from '../../../../src/v2/enterprise';
const TestV2BitGo = require('../../../lib/test_bitgo');
const common = require('../../../../src/common');

describe('Settlements', function() {
  const microservicesUri = 'https://bitgo-microservices.example';
  let bitgo;
  let basecoin;
  let enterprise;
  let tradingAccount;
  let bgUrl;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'mock', microservicesUri });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ofc');
    basecoin.keychains();

    enterprise = new Enterprise(bitgo, basecoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });

    const walletData = {
      id: '5cf940969449412d00f53b4c55fc2139',
      coin: 'tofc',
      enterprise: enterprise,
      keys: [
        'keyid'
      ]
    };

    const wallet = new Wallet(bitgo, basecoin, walletData);
    tradingAccount = wallet.toTradingAccount();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  }));

  it('should list all settlements', co(function *() {
    const scope = nock(microservicesUri)
      .get(`/api/trade/v1/enterprise/${enterprise.id}/settlements`)
      .reply(200, fixtures.listSettlements);

    const settlements = yield enterprise.settlements().list();
    should.exist(settlements);
    settlements.should.have.length(1);

    const settlement = settlements[0];
    settlement.requesterAccountId.should.eql(tradingAccount.id);
    settlement.affirmations.should.have.length(2);
    // the first affirmation should be for this trading acct
    settlement.affirmations[0].partyAccountId.should.eql(tradingAccount.id);
    // the second should not
    settlement.affirmations[1].partyAccountId.should.not.eql(tradingAccount.id);
    settlement.trades.should.have.length(1);

    scope.isDone().should.be.true();
  }));

  it('should get a single settlement', co(function *() {
    const scope = nock(microservicesUri)
      .get(`/api/trade/v1/enterprise/${enterprise.id}/settlements/${fixtures.singleSettlementId}`)
      .reply(200, fixtures.getSingleSettlement);

    const settlement = yield enterprise.settlements().get({ id: fixtures.singleSettlementId });

    should.exist(settlement);
    settlement.requesterAccountId.should.eql(tradingAccount.id);

    // one affirmation should be for this account, one should be for the counterparty
    settlement.affirmations.should.have.length(2);
    settlement.affirmations.filter(affirmation => affirmation.partyAccountId === tradingAccount.id).should.have.length(1);
    settlement.affirmations.filter(affirmation => affirmation.partyAccountId !== tradingAccount.id).should.have.length(1);

    settlement.trades.should.have.length(1);

    scope.isDone().should.be.true();
  }));

  it('should create a new settlement', co(function *() {
    const msScope = nock(microservicesUri)
      .post('/api/trade/v1/payload', fixtures.createSettlementPayloadRequest)
      .reply(200, fixtures.createSettlementPayloadResponse)
      .post('/api/trade/v1/settlement', fixtures.createSettlementRequest)
      .reply(200, fixtures.createSettlementResponse);

    const xprv = 'xprv9s21ZrQH143K2MUz7uPUBVzdmvJQE6fPEQCkR3mypPbZgijPqfmGH7pjijdjeJx3oCoxPWVbjC4VYHzgN6wqEfYnnbNjK7jm2CkrvWrvkbR';
    const xpub = 'xpub661MyMwAqRbcEqZTDvvUYdwNKx8tdZPEbd8MDSBbNj8YZX4YPD5Wpv9Da2YzLC8ZNRhundXP7mVhhu9WdJChzZJFGLQD7tyY1KGfmjuBvcX';
    const platformScope = nock(bgUrl)
      .get('/api/v2/ofc/key/keyid')
      .reply(200, {
        pub: xpub,
        encryptedPrv: bitgo.encrypt({ input: xprv, password: TestV2BitGo.OFC_TEST_PASSWORD })
      });

    const payload = yield tradingAccount.buildPayload({
      currency: 'ofctusd',
      amount: '555',
      otherParties: [{ accountId: '5cf940a49449412d00f53b8f7392f7c0', amount: '500', currency: 'ofctbtc' }]
    });

    const signature = yield tradingAccount.signPayload({ payload, walletPassphrase: TestV2BitGo.OFC_TEST_PASSWORD });

    const settlement = yield enterprise.settlements().create({
      requesterAccountId: tradingAccount.id,
      payload: payload,
      signature: signature,
      trades: [{
        baseAccountId: '5cf940a49449412d00f53b8f7392f7c0',
        quoteAccountId: '5cf940969449412d00f53b4c55fc2139',
        status: TradeStatus.EXECUTED,
        timestamp: new Date('2019-06-06T16:36:20.810Z'),
        baseAmount: '500',
        baseCurrency: 'ofctbtc',
        quoteAmount: '555',
        quoteCurrency: 'ofctusd',
        costBasis: '12345',
        costBasisCurrency: 'USD',
        externalId: 'a4o3ah601etw676okvkvsmizciorxc8v'
      }]
    });

    should.exist(settlement);
    settlement.should.have.property('id');
    settlement.should.have.property('status');
    settlement.status.should.eql(SettlementStatus.PENDING);
    settlement.should.have.property('requesterAccountId');
    settlement.requesterAccountId.should.eql(tradingAccount.id);

    // one affirmation should be for this account, one should be for the counterparty
    // furthermore, the one for this account should already be affirmed
    settlement.should.have.property('affirmations');
    settlement.affirmations.should.have.length(2);
    settlement.affirmations.filter(affirmation => affirmation.partyAccountId === tradingAccount.id && affirmation.status === AffirmationStatus.AFFIRMED).should.have.length(1);
    settlement.affirmations.filter(affirmation => affirmation.partyAccountId !== tradingAccount.id).should.have.length(1);

    msScope.isDone().should.be.true();
    platformScope.isDone().should.be.true();
  }));
});
