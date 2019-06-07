import { coroutine as co } from 'bluebird';
import * as should from 'should';
import * as nock from 'nock';
import * as bitcoinMessage from 'bitcoinjs-message';
import { HDNode } from 'bitgo-utxo-lib';

const Wallet = require('../../../../src/v2/wallet');
const TestV2BitGo = require('../../../lib/test_bitgo');
const common = require('../../../../src/common');

describe('Trade Payloads', function() {
  let bitgo;
  let basecoin;
  let tradingAccount;
  let bgUrl;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'mock' });
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

    const { payload, signature } = yield tradingAccount.buildAndSignPayload({
      currency: 'ofctbtc',
      amount: '100000000',
      otherParties: ['test_counterparty_1'],
      walletPassphrase: TestV2BitGo.OFC_TEST_PASSWORD
    });

    should.exist(payload);
    payload.should.have.property('walletId', 'walletId');
    payload.should.have.property('currency', 'ofctbtc');
    payload.should.have.property('amount', '100000000');
    payload.should.have.property('nonceHold');
    payload.should.have.property('nonceSettle');
    payload.should.have.property('otherParties').with.length(1);
    payload.otherParties[0].should.eql('test_counterparty_1');

    should.exist(signature);
    // signature should be a hex string
    signature.should.match(/^[0-9a-f]+$/);

    const address = HDNode.fromBase58(xpub).getAddress();

    bitcoinMessage.verify(JSON.stringify(payload), address, Buffer.from(signature, 'hex')).should.be.True();

    platformScope.isDone().should.be.True();
  }));
});
