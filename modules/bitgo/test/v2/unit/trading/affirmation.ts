import * as should from 'should';
import * as nock from 'nock';

import fixtures from '../../fixtures/trading/affirmation';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { AffirmationStatus, common, Enterprise, Wallet } from '@bitgo/sdk-core';
import { Environments } from '../../../../src';

describe('Affirmations', function () {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  let basecoin;
  let enterprise;
  let tradingAccount;
  let bgUrl;

  let affirmation;

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

  it('should list all affirmations', async function () {
    const scope = nock(microservicesUri)
      .get(`/api/trade/v1/enterprise/${enterprise.id}/affirmations`)
      .reply(200, fixtures.listAffirmations);

    const affirmations = await enterprise.affirmations().list();

    should.exist(affirmations);
    affirmations.should.have.length(3);

    scope.isDone().should.be.true();
  });

  it('should list all affirmations filtered by status', async function () {
    const scope = nock(microservicesUri)
      .get(`/api/trade/v1/enterprise/${enterprise.id}/affirmations?status=overdue`)
      .reply(200, fixtures.listOverdueAffirmations);

    const affirmations = await enterprise.affirmations().list(AffirmationStatus.OVERDUE);

    should.exist(affirmations);
    affirmations.should.have.length(1);
    affirmations[0].status.should.eql(AffirmationStatus.OVERDUE);

    scope.isDone().should.be.true();
  });

  it('should get a single affirmation', async function () {
    const scope = nock(microservicesUri)
      .get(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/affirmations/8c25d5e9-ec3e-41d4-9c5e-b517f9e6c2a9`
      )
      .reply(200, fixtures.singleAffirmation);

    affirmation = await tradingAccount.affirmations().get({ id: '8c25d5e9-ec3e-41d4-9c5e-b517f9e6c2a9' });
    should.exist(affirmation);

    scope.isDone().should.be.true();
  });

  it('should affirm an affirmation', async function () {
    const scope = nock(microservicesUri)
      .post(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/payload`,
        fixtures.affirmAffirmationPayloadRequest
      )
      .reply(200, fixtures.affirmAffirmationPayloadResponse)
      .put(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/affirmations/${affirmation.id}`,
        (body) => body.status === AffirmationStatus.AFFIRMED
      )
      .reply(200, fixtures.updateAffirmation('affirmed'));

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

    const payload = await tradingAccount.buildPayload(fixtures.affirmAffirmationPayloadRequest);
    const signature = await tradingAccount.signPayload({ payload, walletPassphrase: TestBitGo.OFC_TEST_PASSWORD });

    await affirmation.affirm(payload, signature);

    scope.isDone().should.be.true();
    platformScope.isDone().should.be.true();
  });

  it('should reject an affirmation', async function () {
    const scope = nock(microservicesUri)
      .put(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/affirmations/${affirmation.id}`,
        (body) => body.status === AffirmationStatus.REJECTED
      )
      .reply(200, fixtures.updateAffirmation('rejected'));

    await affirmation.reject();

    scope.isDone().should.be.true();
  });

  it('should cancel an affirmation', async function () {
    const scope = nock(microservicesUri)
      .put(
        `/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/affirmations/${affirmation.id}`,
        (body) => body.status === AffirmationStatus.CANCELED
      )
      .reply(200, fixtures.updateAffirmation('canceled'));

    await affirmation.cancel();

    scope.isDone().should.be.true();
  });
});
