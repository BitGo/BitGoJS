import { bufferToHex } from 'ethereumjs-util';
import { Eth2 as Eth2AccountLib } from '@bitgo/account-lib';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;

import { TestBitGo } from '../../../lib/test_bitgo';
import * as nock from 'nock';
nock.restore();

describe('ETH2:', function () {
  let bitgo;
  let wallet;

  before(
    co(function* () {
      bitgo = new TestBitGo({ env: 'test' });
      bitgo.initializeTestVars();

      yield bitgo.authenticateTestUser(bitgo.testUserOTP());
      wallet = yield bitgo.coin('teth2').wallets().getWallet({ id: TestBitGo.V2.TEST_ETH2_WALLET_ID });
    })
  );

  describe('Sign message', function () {
    it('should sign and verify a message', async function () {
      const basecoin = bitgo.coin('teth2');
      await bitgo.unlock({ otp: '0000000' });

      const ethKeychains = bitgo.coin('teth2').keychains();
      const keychains = await ethKeychains.getKeysForSigning({ wallet });
      keychains.length.should.equal(3);

      const message = 'hello world';
      const userKeyPrv = bitgo.decrypt({
        input: keychains[0].encryptedPrv,
        password: TestBitGo.V2.TEST_ETH2_WALLET_PASSPHRASE,
      });
      const userSignatureBuffer = await basecoin.signMessage({ prv: userKeyPrv }, message);
      const userSignature = bufferToHex(userSignatureBuffer);

      const backupKeyPrv = bitgo.decrypt({
        input: keychains[1].encryptedPrv,
        password: TestBitGo.V2.TEST_ETH2_WALLET_PASSPHRASE,
      });
      const backupSignatureBuffer = await basecoin.signMessage({ prv: backupKeyPrv }, message);
      const backupSignature = bufferToHex(backupSignatureBuffer);

      const signature = Eth2AccountLib.KeyPair.aggregateSignatures({
        1: BigInt(userSignature),
        2: BigInt(backupSignature),
      });

      keychains[0].commonPub.should.equal(keychains[1].commonPub);
      (
        await Eth2AccountLib.KeyPair.verifySignature(keychains[0].commonPub, Buffer.from(message), signature)
      ).should.be.true();
    });
  });
});
