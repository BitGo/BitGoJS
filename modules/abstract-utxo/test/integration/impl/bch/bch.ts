import * as should from 'should';
import 'should-http';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import * as nock from 'nock';

import { Tbch } from '../../../../src/impl/bch';

nock.restore();

describe('BCH:', function () {
  let bitgo: TestBitGoAPI;
  let wallet;

  before(async function () {
    this.timeout(10000);
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tbch', Tbch.createInstance);

    await bitgo.authenticateTestUser(bitgo.testUserOTP());
    wallet = await bitgo.coin('tbch').wallets().getWallet({ id: TestBitGo.V2.TEST_BCH_WALLET_ID });
  });

  describe('Send Transaction', function () {
    it('should send fund to cashaddr recipient', async function (this: Mocha.Context) {
      this.timeout(10000);
      await bitgo.unlock({ otp: '0000000' });

      const transaction = await wallet.send({
        address: TestBitGo.V2.TEST_BCH_WALLET_CASH_ADDRESS,
        amount: '5000',
        walletPassphrase: TestBitGo.V2.TEST_BCH_WALLET_PASSPHRASE,
        otp: bitgo.testUserOTP(),
      });

      should.exist(transaction);
      transaction.should.have.property('transfer');
      transaction.should.have.property('txid');
      transaction.should.have.property('tx');
      transaction.status.should.containEql('signed');
      transaction.transfer.type.should.containEql('send');
      transaction.transfer.wallet.should.containEql(wallet._wallet.id);
    });
  });
});
