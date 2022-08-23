/**
 * @prettier
 */

import { bip32 } from '@bitgo/utxo-lib';
import * as should from 'should';
import * as nock from 'nock';
import * as bitcoinMessage from 'bitcoinjs-message';

import fixtures from '../../fixtures/trading/payload';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { common, Enterprise, getAddressP2PKH, Wallet } from '@bitgo/sdk-core';

describe('Trade Payloads', function () {
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
      id: 'walletId',
      coin: 'tofc',
      enterprise: enterprise.id,
      keys: ['keyid'],
    };

    const wallet = new Wallet(bitgo, basecoin, walletData);
    tradingAccount = wallet.toTradingAccount();
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  it('should create and sign a trade payload with fees', async function () {
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

    const msScope = nock(microservicesUri)
      .post(`/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/payload`)
      .reply(200, fixtures.validPayloadWithFees);

    const payload = await tradingAccount.buildPayload({
      amounts: [
        {
          accountId: 'walletId',
          sendCurrency: 'ofctbtc',
          sendAmount: '100000000',
          receiveCurrency: 'ofctusd',
          receiveAmount: '90000',
        },
        {
          accountId: 'counterparty_account_id',
          sendCurrency: 'ofctusd',
          sendAmount: '90000',
          receiveCurrency: 'ofctbtc',
          receiveAmount: '100000000',
        },
      ],
    });

    should.exist(payload);
    payload.should.have.property('version', '1.2.0');
    payload.should.have.property('accountId');
    payload.should.have.property('nonceHold');
    payload.should.have.property('nonceSettle');
    payload.should.have.property('amounts').with.length(2);
    for (const amount of payload.amounts) {
      amount.should.have.property('accountId');
      amount.should.have.property('sendCurrency');
      amount.should.have.property('sendAmount');
      amount.should.have.property('sendSubtotal');
      amount.should.have.property('receiveCurrency');
      amount.should.have.property('receiveAmount');
      if (amount.accountId === payload.accountId) {
        amount.should.have.property('fees').with.length(1);
      }
    }

    const signature = await tradingAccount.signPayload({
      payload,
      walletPassphrase: TestBitGo.OFC_TEST_PASSWORD,
    });

    // signature should be a hex string
    signature.should.match(/^[0-9a-f]+$/);

    const address = getAddressP2PKH(bip32.fromBase58(xpub));

    bitcoinMessage.verify(JSON.stringify(payload), address, Buffer.from(signature, 'hex')).should.be.True();

    platformScope.isDone().should.be.True();
    msScope.isDone().should.be.True();
  });

  it('should throw if the payload does not match the build parameters', async function () {
    const msScope = nock(microservicesUri)
      .post(`/api/trade/v1/enterprise/${enterprise.id}/account/${tradingAccount.id}/payload`)
      .twice()
      .reply(200, fixtures.invalidPayload);

    // no matching amount found between payload and parameters
    await tradingAccount
      .buildPayload({
        amounts: [
          {
            accountId: 'walletId',
            sendCurrency: 'ofctbtc',
            sendAmount: '10000000',
            receiveCurrency: 'ofctusd',
            receiveAmount: '90000',
          },
          {
            accountId: 'counterparty_account_id',
            sendCurrency: 'ofctusd',
            sendAmount: '90000',
            receiveCurrency: 'ofctbtc',
            receiveAmount: '10000000',
          },
        ],
      })
      .should.be.rejected();

    // incorrect calculation of subtotal to amount given a fee
    await tradingAccount
      .buildPayload({
        amounts: [
          {
            accountId: 'walletId',
            sendCurrency: 'ofctbtc',
            sendAmount: '100000000',
            receiveCurrency: 'ofctusd',
            receiveAmount: '90000',
          },
          {
            accountId: 'counterparty_account_id',
            sendCurrency: 'ofctusd',
            sendAmount: '90000',
            receiveCurrency: 'ofctbtc',
            receiveAmount: '100000000',
          },
        ],
      })
      .should.be.rejected();

    msScope.isDone().should.be.True();
  });
});
