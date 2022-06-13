import { Eth2 as Eth2AccountLib } from '@bitgo/account-lib';
import { bufferToHex } from 'ethereumjs-util';

import { decorate, TestableBG } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { Eth2, Teth2 } from '../../../../src/v2/coins';

describe('Ethereum 2.0', function () {
  let bitgo;
  let basecoin;
  let TestBitGoStatics: TestableBG;

  before(async function () {
    bitgo = decorate(BitGo, { env: 'mock' });
    TestBitGoStatics = BitGo as unknown as TestableBG;
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('teth2');
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('teth2');
    localBasecoin.should.be.an.instanceof(Teth2);
    localBasecoin.getChain().should.equal('teth2');
    localBasecoin.getFamily().should.equal('eth2');

    localBasecoin = bitgo.coin('eth2');
    localBasecoin.should.be.an.instanceof(Eth2);
    localBasecoin.getBaseFactor().should.equal('1000000000000000000');
    localBasecoin.getChain().should.equal('eth2');
    localBasecoin.getFamily().should.equal('eth2');
    localBasecoin.getFullName().should.equal('Ethereum 2.0');
  });

  it('validates pre-creation of bitgo key', function () {
    const localBasecoin = bitgo.coin('teth2');
    const params = { enterprise: TestBitGoStatics.TEST_ENTERPRISE };
    localBasecoin.preCreateBitGo(params);
  });

  it('should generate keypair from prv', function () {
    const prv = Uint8Array.from(
      Buffer.from('4fd90ae1b8f724a4902615c09145ae134617c325b98c6970dcf62ab9cc5e12f3', 'hex')
    );
    const localBaseCoin = bitgo.coin('teth2');
    const keyPair = localBaseCoin.generateKeyPair(prv);
    keyPair.prv.should.equal('0x4fd90ae1b8f724a4902615c09145ae134617c325b98c6970dcf62ab9cc5e12f3');
  });

  it('should generate keypair without seed', function () {
    // FIXME(BG-47812): this test is flaky
    // @ts-expect-error - no implicit this
    this.skip();
    const localBaseCoin = bitgo.coin('teth2');
    const keyPair = localBaseCoin.generateKeyPair();
    keyPair.pub.length.should.equal(98);
    keyPair.secretShares.every((secretShare) => secretShare.length.should.equal(66));
    (keyPair.pub.startsWith('0x')).should.be.true();
    keyPair.secretShares.every((secretShare) => (secretShare.startsWith('0x')).should.be.true());
    localBaseCoin.isValidPub(keyPair.pub).should.be.true();
  });

  it('should reject keypair generation from an invalid prv', function () {
    const prv = Uint8Array.from(Buffer.from('', 'hex'));
    const localBaseCoin = bitgo.coin('teth2');
    (function () {localBaseCoin.generateKeyPair(prv);}).should.throw();
  });

  describe('Sign message:', () => {
    it('should sign and validate a string message', async function () {
      const userKeyPair = basecoin.generateKeyPair();
      const backupKeyPair = basecoin.generateKeyPair();
      const walletKeyPair = basecoin.generateKeyPair();

      const message = 'hello world';
      const userKey = basecoin.aggregateShares({
        pubShares: [userKeyPair.pub, backupKeyPair.pub, walletKeyPair.pub],
        prvShares: [userKeyPair.secretShares[0], backupKeyPair.secretShares[0], walletKeyPair.secretShares[0]],
      });
      const userSignatureBuffer = await basecoin.signMessage({ prv: userKey.prv }, message);
      const userSignature = bufferToHex(userSignatureBuffer);
      const walletKey = basecoin.aggregateShares({
        pubShares: [userKeyPair.pub, backupKeyPair.pub, walletKeyPair.pub],
        prvShares: [userKeyPair.secretShares[2], backupKeyPair.secretShares[2], walletKeyPair.secretShares[2]],
      });
      const walletSignatureBuffer = await basecoin.signMessage({ prv: walletKey.prv }, message);
      const walletSignature = bufferToHex(walletSignatureBuffer);
      const signature = Eth2AccountLib.KeyPair.aggregateSignatures({ 1: BigInt(userSignature), 3: BigInt(walletSignature) });

      userKey.pub.should.equal(walletKey.pub);
      (await Eth2AccountLib.KeyPair.verifySignature(userKey.pub, Buffer.from(message), signature)).should.be.true();
    });

    it('should fail to validate a string message with wrong public key', async function () {
      const userKeyPair = basecoin.generateKeyPair();
      const backupKeyPair = basecoin.generateKeyPair();
      const walletKeyPair = basecoin.generateKeyPair();
      const otherKeyPair = basecoin.generateKeyPair();

      const message = 'hello world';
      const userKey = basecoin.aggregateShares({
        pubShares: [userKeyPair.pub, backupKeyPair.pub, otherKeyPair.pub],
        prvShares: [userKeyPair.secretShares[0], backupKeyPair.secretShares[0], walletKeyPair.secretShares[0]],
      });
      const userSignatureBuffer = await basecoin.signMessage({ prv: userKey.prv }, message);
      const userSignature = bufferToHex(userSignatureBuffer);
      const walletKey = basecoin.aggregateShares({
        pubShares: [userKeyPair.pub, backupKeyPair.pub, otherKeyPair.pub],
        prvShares: [userKeyPair.secretShares[2], backupKeyPair.secretShares[2], walletKeyPair.secretShares[2]],
      });
      const walletSignatureBuffer = await basecoin.signMessage({ prv: walletKey.prv }, message);
      const walletSignature = bufferToHex(walletSignatureBuffer);
      const signature = Eth2AccountLib.KeyPair.aggregateSignatures({ 1: BigInt(userSignature), 3: BigInt(walletSignature) });

      userKey.pub.should.equal(walletKey.pub);
      (await Eth2AccountLib.KeyPair.verifySignature(userKey.pub, Buffer.from(message), signature)).should.be.false();
    });
  });
});
