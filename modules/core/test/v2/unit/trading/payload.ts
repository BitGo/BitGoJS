import { coroutine as co } from 'bluebird';
import * as should from 'should';
import * as nock from 'nock';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDNode } from 'bitgo-utxo-lib';

import fixtures from '../../fixtures/trading/payload';

import { Wallet } from '../../../../src/v2/wallet';
const TestV2BitGo = require('../../../lib/test_bitgo');
const common = require('../../../../src/common');

describe('Trade Payloads', function() {
  const microservicesUri = 'https://bitgo-microservices.example';
  let bitgo;
  let basecoin;
  let tradingAccount;
  let bgUrl;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'mock', microservicesUri });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ofc');
    basecoin.keychains();

    const walletData = {
      id: 'walletId',
      coin: 'tofc',
      keys: [
        'keyid'
      ]
    };

    const wallet = new Wallet(bitgo, basecoin, walletData);
    tradingAccount = wallet.toTradingAccount();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  }));

  it('should create and sign a trade payload', co(function *() {
    const xprv = 'xprv9s21ZrQH143K2MUz7uPUBVzdmvJQE6fPEQCkR3mypPbZgijPqfmGH7pjijdjeJx3oCoxPWVbjC4VYHzgN6wqEfYnnbNjK7jm2CkrvWrvkbR';
    const xpub = 'xpub661MyMwAqRbcEqZTDvvUYdwNKx8tdZPEbd8MDSBbNj8YZX4YPD5Wpv9Da2YzLC8ZNRhundXP7mVhhu9WdJChzZJFGLQD7tyY1KGfmjuBvcX';

    const platformScope = nock(bgUrl)
    .get('/api/v2/ofc/key/keyid')
    .reply(200, {
      pub: xpub,
      encryptedPrv: bitgo.encrypt({ input: xprv, password: TestV2BitGo.OFC_TEST_PASSWORD })
    });

    const msScope = nock(microservicesUri)
      .post('/api/trade/v1/payload')
      .reply(200, fixtures.validPayload);

    const payload = yield tradingAccount.buildPayload({
      currency: 'ofctbtc',
      amount: '100000000',
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
      ],
    });

    should.exist(payload);
    payload.should.have.property('version', '1.1.1');
    payload.should.have.property('accountId', 'walletId');
    payload.should.have.property('currency', 'ofctbtc');
    payload.should.have.property('subtotal', '100000000');
    payload.should.have.property('nonceHold');
    payload.should.have.property('nonceSettle');
    payload.should.have.property('otherParties').with.length(2);
    for (const party of payload.otherParties) {
      party.should.have.property('accountId');
      party.should.have.property('currency');
      party.should.have.property('amount');
    }

    const signature = yield tradingAccount.signPayload({ payload, walletPassphrase: TestV2BitGo.OFC_TEST_PASSWORD });

    // signature should be a hex string
    signature.should.match(/^[0-9a-f]+$/);

    const address = HDNode.fromBase58(xpub).getAddress();

    bitcoinMessage.verify(JSON.stringify(payload), address, Buffer.from(signature, 'hex')).should.be.True();

    platformScope.isDone().should.be.True();
    msScope.isDone().should.be.True();
  }));

  it('should throw if the payload does not match the build parameters', co(function *() {
    const msScope = nock(microservicesUri)
      .post('/api/trade/v1/payload')
      .reply(200, fixtures.invalidPayload);

    yield tradingAccount.buildPayload({
      currency: 'ofctbtc',
      amount: '100000000',
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
      ],
    }).should.be.rejected();

    msScope.isDone().should.be.True();
  }));
});
