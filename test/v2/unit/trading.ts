import { coroutine as co } from 'bluebird';
import * as should from 'should';
import * as nock from 'nock';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDNode } from 'bitgo-utxo-lib';

const Wallet = require('../../../src/v2/wallet');
const TestV2BitGo = require('../../lib/test_bitgo');
const common = require('../../../src/common');

describe('V2 Trading', function() {
  const microservicesUri = 'https://bitgo-microservices.example';
  let bitgo;
  let basecoin;
  let wallet;
  let trading;
  let bgUrl;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'mock', microservicesUri });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('ofc');
    basecoin.keychains();

    const walletData = {
      id: 'walletId',
      coin: 'tbtc',
      keys: [
        'keyid'
      ]
    };

    wallet = new Wallet(bitgo, basecoin, walletData);
    trading = wallet.trading();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  }));

  it('should create and sign a trade payload', co(function *() {
    const xprv = 'xprv9s21ZrQH143K2MUz7uPUBVzdmvJQE6fPEQCkR3mypPbZgijPqfmGH7pjijdjeJx3oCoxPWVbjC4VYHzgN6wqEfYnnbNjK7jm2CkrvWrvkbR';
    const xpub = 'xpub661MyMwAqRbcEqZTDvvUYdwNKx8tdZPEbd8MDSBbNj8YZX4YPD5Wpv9Da2YzLC8ZNRhundXP7mVhhu9WdJChzZJFGLQD7tyY1KGfmjuBvcX';

    const msScope = nock(microservicesUri)
    .post('/api/trade/v1/payload')
    .reply(200, {
      payload: JSON.stringify({
        walletId: 'walletId',
        currency: 'tbtc',
        amount: '100000000',
        otherParties: ['test_counter_party_1'],
        nonce: Date.now()
      })
    });
    const platformScope = nock(bgUrl)
    .get('/api/v2/ofc/key/keyid')
    .reply(200, {
      pub: xpub,
      encryptedPrv: bitgo.encrypt({ input: xprv, password: TestV2BitGo.OFC_TEST_PASSWORD })
    });

    const { payload, signature } = yield trading.signTradePayload({
      currency: 'tbtc',
      amount: '100000000',
      otherParties: ['test_counterparty_1'],
      walletPassphrase: TestV2BitGo.OFC_TEST_PASSWORD
    });

    should.exist(payload);
    // The payload should be a valid JSON object
    // NOTE: we shouldn't do any more validation than this, as the schema is subject to change often
    (() => { JSON.parse(payload); }).should.not.throw();

    should.exist(signature);
    // signature should be a hex string
    signature.should.match(/^[0-9a-f]+$/);

    const address = HDNode.fromBase58(xpub).getAddress();

    bitcoinMessage.verify(payload, address, Buffer.from(signature, 'hex')).should.be.True();

    msScope.isDone().should.be.True();
    platformScope.isDone().should.be.True();
  }));
});
