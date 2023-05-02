import { bufferToHex } from 'ethereumjs-util';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Eth2, KeyPair, Teth2 } from '../../src';

describe('Ethereum 2.0', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('eth2', Eth2.createInstance);
    bitgo.safeRegister('teth2', Teth2.createInstance);
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
    const params = { enterprise: TestBitGo.TEST_ENTERPRISE };
    localBasecoin.preCreateBitGo(params);
  });

  it('should generate keypair from prv', function () {
    const prv = Buffer.from('4fd90ae1b8f724a4902615c09145ae134617c325b98c6970dcf62ab9cc5e12f3', 'hex');
    const localBaseCoin = bitgo.coin('teth2');
    const keyPair = localBaseCoin.generateKeyPair(prv);
    keyPair.prv.should.equal('4fd90ae1b8f724a4902615c09145ae134617c325b98c6970dcf62ab9cc5e12f3');
  });

  it('should generate keypair without seed', function () {
    const localBaseCoin = bitgo.coin('teth2') as Teth2;
    const keyPair = localBaseCoin.generateKeyPair();
    keyPair.pub?.length.should.equal(96);
    localBaseCoin.isValidPub(keyPair.pub as string).should.be.true();
    keyPair.secretShares?.every((secretShare) => secretShare.length.should.equal(64));
    keyPair.seed?.length.should.equal(64);
    keyPair.chaincode.length.should.equal(64);
  });

  it('should reject keypair generation from an invalid prv', function () {
    const prv = Buffer.from('', 'hex');
    const localBaseCoin = bitgo.coin('teth2');
    (function () {
      localBaseCoin.generateKeyPair(prv);
    }).should.throw();
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
        chaincodes: [userKeyPair.chaincode, backupKeyPair.chaincode, walletKeyPair.chaincode],
      });
      const userSignatureBuffer = await basecoin.signMessage({ prv: userKey.prv }, message);
      const userSignature = bufferToHex(userSignatureBuffer);
      const walletKey = basecoin.aggregateShares({
        pubShares: [userKeyPair.pub, backupKeyPair.pub, walletKeyPair.pub],
        prvShares: [userKeyPair.secretShares[2], backupKeyPair.secretShares[2], walletKeyPair.secretShares[2]],
        chaincodes: [userKeyPair.chaincode, backupKeyPair.chaincode, walletKeyPair.chaincode],
      });
      const walletSignatureBuffer = await basecoin.signMessage({ prv: walletKey.prv }, message);
      const walletSignature = bufferToHex(walletSignatureBuffer);
      const signature = KeyPair.aggregateSignatures({
        1: BigInt(userSignature),
        3: BigInt(walletSignature),
      });

      userKey.pub.should.equal(walletKey.pub);
      (await KeyPair.verifySignature(userKey.pub, Buffer.from(message), signature)).should.be.true();
    });

    it('should sign with child key and validate a string message', async function () {
      const userKeyPair = basecoin.generateKeyPair();
      const backupKeyPair = basecoin.generateKeyPair();
      const walletKeyPair = basecoin.generateKeyPair();

      const message = 'hello world';
      const userKey = basecoin.aggregateShares({
        pubShares: [userKeyPair.pub, backupKeyPair.pub, walletKeyPair.pub],
        prvShares: [userKeyPair.secretShares[0], backupKeyPair.secretShares[0], walletKeyPair.secretShares[0]],
        chaincodes: [userKeyPair.chaincode, backupKeyPair.chaincode, walletKeyPair.chaincode],
      });
      const childUserKeypair = KeyPair.keyDerive(
        userKeyPair.seed,
        userKey.pub,
        userKey.chaincode,
        'm/12381/3600/0/0/0'
      );
      const childUserKey = basecoin.aggregateShares({
        pubShares: [childUserKeypair.publicShare, backupKeyPair.pub, walletKeyPair.pub],
        prvShares: [childUserKeypair.secretShares[0], backupKeyPair.secretShares[0], walletKeyPair.secretShares[0]],
        chaincodes: [childUserKeypair.chaincode, backupKeyPair.chaincode, walletKeyPair.chaincode],
      });
      const userSignatureBuffer = await basecoin.signMessage({ prv: childUserKey.prv }, message);
      const userSignature = bufferToHex(userSignatureBuffer);
      const walletKey = basecoin.aggregateShares({
        pubShares: [childUserKeypair.publicShare, backupKeyPair.pub, walletKeyPair.pub],
        prvShares: [childUserKeypair.secretShares[2], backupKeyPair.secretShares[2], walletKeyPair.secretShares[2]],
        chaincodes: [childUserKeypair.chaincode, backupKeyPair.chaincode, walletKeyPair.chaincode],
      });
      const walletSignatureBuffer = await basecoin.signMessage({ prv: walletKey.prv }, message);
      const walletSignature = bufferToHex(walletSignatureBuffer);
      const signature = KeyPair.aggregateSignatures({ 1: BigInt(userSignature), 3: BigInt(walletSignature) });

      childUserKey.pub.should.equal(walletKey.pub);
      (await KeyPair.verifySignature(childUserKey.pub, Buffer.from(message), signature)).should.be.true();
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
        chaincodes: [userKeyPair.chaincode, backupKeyPair.chaincode, walletKeyPair.chaincode],
      });
      const userSignatureBuffer = await basecoin.signMessage({ prv: userKey.prv }, message);
      const userSignature = bufferToHex(userSignatureBuffer);
      const walletKey = basecoin.aggregateShares({
        pubShares: [userKeyPair.pub, backupKeyPair.pub, otherKeyPair.pub],
        prvShares: [userKeyPair.secretShares[2], backupKeyPair.secretShares[2], walletKeyPair.secretShares[2]],
        chaincodes: [userKeyPair.chaincode, backupKeyPair.chaincode, walletKeyPair.chaincode],
      });
      const walletSignatureBuffer = await basecoin.signMessage({ prv: walletKey.prv }, message);
      const walletSignature = bufferToHex(walletSignatureBuffer);
      const signature = KeyPair.aggregateSignatures({
        1: BigInt(userSignature),
        3: BigInt(walletSignature),
      });

      userKey.pub.should.equal(walletKey.pub);
      (await KeyPair.verifySignature(userKey.pub, Buffer.from(message), signature)).should.be.false();
    });
  });
});
