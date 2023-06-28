import * as should from 'should';
import * as nock from 'nock';

import fixtures from '../../fixtures/trading/settlement';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import {
  AffirmationStatus,
  common,
  Enterprise,
  Settlement,
  SettlementStatus,
  SettlementType,
  TradeStatus,
  Wallet,
} from '@bitgo/sdk-core';

describe('Settlements', function () {
  const microservicesUri = common.Environments['mock'].uri;
  let bitgo;
  let basecoin;
  let enterprise;
  let tradingAccount;
  let bgUrl;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri } as any);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ofc');
    basecoin.keychains();

    enterprise = new Enterprise(bitgo, basecoin, { id: '5cf940949449412d00f53b3d92dbcaa3', name: 'Test Enterprise' });

    const walletData = {
      id: '5cf940969449412d00f53b4c55fc2139',
      coin: 'tofc',
      enterprise: enterprise.id,
      keys: ['keyid'],
    };

    const wallet = new Wallet(bitgo, basecoin, walletData);
    tradingAccount = wallet.toTradingAccount();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  it('should list all settlements', async function () {
    const scope = nock(microservicesUri)
      .get(`/api/trade/v1/enterprise/${enterprise.id}/settlements`)
      .reply(200, fixtures.listSettlements);

    const settlements = await enterprise.settlements().list();
    should.exist(settlements);
    settlements.should.have.length(2);

    for (const settlement of settlements) {
      settlement.should.have.property('type');
      if (settlement.type === SettlementType.DIRECT) {
        validateDirectSettlement(settlement);
      } else {
        validateAgencySettlement(settlement);
      }
    }

    scope.isDone().should.be.true();
  });

  it('should get a single settlement', async function () {
    const scope = nock(microservicesUri)
      .get(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/settlements/${fixtures.singleSettlementId}`
      )
      .reply(200, fixtures.getSingleSettlement);

    const settlement = await tradingAccount.settlements().get({ id: fixtures.singleSettlementId });

    should.exist(settlement);
    validateDirectSettlement(settlement);
    scope.isDone().should.be.true();
  });

  it('should create a new direct settlement', async function () {
    const msScope = nock(microservicesUri)
      .post(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/payload`,
        fixtures.createDirectSettlementPayloadRequest
      )
      .reply(200, fixtures.createDirectSettlementPayloadResponse)
      .post(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/settlements`,
        fixtures.createDirectSettlementRequest
      )
      .reply(200, fixtures.createDirectSettlementResponse);

    const xprv =
      'xprv9s21ZrQH143K2MUz7uPUBVzdmvJQE6fPEQCkR3mypPbZgijPqfmGH7pjijdjeJx3oCoxPWVbjC4VYHzgN6wqEfYnnbNjK7jm2CkrvWrvkbR';
    const xpub =
      'xpub661MyMwAqRbcEqZTDvvUYdwNKx8tdZPEbd8MDSBbNj8YZX4YPD5Wpv9Da2YzLC8ZNRhundXP7mVhhu9WdJChzZJFGLQD7tyY1KGfmjuBvcX';
    const platformScope = nock(bgUrl)
      .get('/api/v2/ofc/key/keyid')
      .reply(200, {
        pub: xpub,
        encryptedPrv: bitgo.encrypt({ input: xprv, password: TestBitGo.OFC_TEST_PASSWORD }),
      });

    const payload = await tradingAccount.buildPayload(fixtures.createDirectSettlementPayloadRequest);

    const signature = await tradingAccount.signPayload({ payload, walletPassphrase: TestBitGo.OFC_TEST_PASSWORD });

    const settlement = await tradingAccount.settlements().create({
      requesterAccountId: tradingAccount.id,
      payload: payload,
      signature: signature,
      trades: [
        {
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
          externalId: 'a4o3ah601etw676okvkvsmizciorxc8v',
        },
      ],
    });

    should.exist(settlement);
    validateDirectSettlement(settlement);

    msScope.isDone().should.be.true();
    platformScope.isDone().should.be.true();
  });

  it('should create a new agency settlement', async function () {
    const msScope = nock(microservicesUri)
      .post(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/payload`,
        fixtures.createAgencySettlementPayloadRequest
      )
      .reply(200, fixtures.createAgencySettlementPayloadResponse)
      .post(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/settlements`,
        fixtures.createAgencySettlementRequest
      )
      .reply(200, fixtures.createAgencySettlementResponse);

    const xprv =
      'xprv9s21ZrQH143K2MUz7uPUBVzdmvJQE6fPEQCkR3mypPbZgijPqfmGH7pjijdjeJx3oCoxPWVbjC4VYHzgN6wqEfYnnbNjK7jm2CkrvWrvkbR';
    const xpub =
      'xpub661MyMwAqRbcEqZTDvvUYdwNKx8tdZPEbd8MDSBbNj8YZX4YPD5Wpv9Da2YzLC8ZNRhundXP7mVhhu9WdJChzZJFGLQD7tyY1KGfmjuBvcX';
    const platformScope = nock(bgUrl)
      .get('/api/v2/ofc/key/keyid')
      .reply(200, {
        pub: xpub,
        encryptedPrv: bitgo.encrypt({ input: xprv, password: TestBitGo.OFC_TEST_PASSWORD }),
      });

    const payload = await tradingAccount.buildPayload(fixtures.createAgencySettlementPayloadRequest);

    const signature = await tradingAccount.signPayload({ payload, walletPassphrase: TestBitGo.OFC_TEST_PASSWORD });

    const settlement = await tradingAccount.settlements().create({
      requesterAccountId: tradingAccount.id,
      payload: payload,
      signature: signature,
      trades: [
        {
          id: 'a37c5c9a-efc0-4b2c-89e0-39538de86b29',
          baseAccountId: '5df03e088b4eb3470019a88734b69f7a',
          quoteAccountId: '5df03e088b4eb3470019a89e37864bed',
          status: TradeStatus.EXECUTED,
          timestamp: new Date('2019-12-11T00:53:52.814Z'),
          baseAmount: '115087',
          quoteAmount: '942777',
          baseCurrency: 'ofctbtc',
          quoteCurrency: 'ofctusd',
          baseReceiveAmount: '941966',
          quoteReceiveAmount: '115087',
          baseReceiveCurrency: 'ofctusd',
          quoteReceiveCurrency: 'ofctbtc',
          costBasis: '',
          costBasisCurrency: '',
          externalId: 'xff7vln0eh9hh3rp0derlbunlo1sw6k6',
        },
      ],
    });

    should.exist(settlement);
    validateAgencySettlement(settlement);

    msScope.isDone().should.be.true();
    platformScope.isDone().should.be.true();
  });

  function validateDirectSettlement(settlement: Settlement): void {
    settlement.should.have.property('id');
    settlement.should.have.property('requesterAccountId');
    settlement.should.have.property('status');
    settlement.should.have.property('type');

    settlement.requesterAccountId.should.eql(tradingAccount.id);
    settlement.status.should.eql(SettlementStatus.PENDING);
    settlement.type.should.eql(SettlementType.DIRECT);

    // one affirmation should be for this account, one should be for the counterparty
    // furthermore, the one for this account should already be affirmed
    settlement.should.have.property('affirmations');
    settlement.affirmations.should.have.length(2);
    settlement.affirmations
      .filter(
        (affirmation) =>
          affirmation.partyAccountId === tradingAccount.id && affirmation.status === AffirmationStatus.AFFIRMED
      )
      .should.have.length(1);
    settlement.affirmations
      .filter((affirmation) => affirmation.partyAccountId !== tradingAccount.id)
      .should.have.length(1);
  }

  function validateAgencySettlement(settlement: Settlement): void {
    settlement.should.have.property('id');
    settlement.should.have.property('requesterAccountId');
    settlement.should.have.property('status');
    settlement.should.have.property('type');

    settlement.requesterAccountId.should.eql(tradingAccount.id);
    settlement.status.should.eql(SettlementStatus.PENDING);
    settlement.type.should.eql(SettlementType.AGENCY);

    // one affirmation should be for this account, one should be for the counterparty
    // furthermore, the one for this account should already be affirmed
    settlement.should.have.property('affirmations');
    settlement.affirmations.should.have.length(3);
    settlement.affirmations
      .filter(
        (affirmation) =>
          affirmation.partyAccountId === tradingAccount.id && affirmation.status === AffirmationStatus.AFFIRMED
      )
      .should.have.length(1);
    settlement.affirmations
      .filter((affirmation) => affirmation.partyAccountId !== tradingAccount.id)
      .should.have.length(2);
  }
});
