import should = require('should');
import * as accountLib from '@bitgo/account-lib';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as DotResources from '../../fixtures/coins/dot';
import { randomBytes } from 'crypto';

describe('DOT:', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tdot');
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPair = new accountLib.Dot.KeyPair();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      const signature = await basecoin.signMessage(keyPair.getKeys(), messageToSign);
      keyPair.verifySignature(messageToSign, Uint8Array.from(Buffer.from(signature, 'hex'))).should.equals(true);
    });

    it('should fail with missing private key', async () => {
      const keyPair = new accountLib.Dot.KeyPair({ pub: '7788327c695dca4b3e649a0db45bc3e703a2c67428fce360e61800cc4248f4f7' }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      await basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  describe('Sign transaction', () => {
    it('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txHex: DotResources.rawTx.transfer.unsigned,
          key: DotResources.accounts.account1.publicKey,
          addressVersion: 0,
          validity: {
            firstValid: 3933,
          },
          referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
          version: 7,
        },
        prv: DotResources.accounts.account1.secretKey,
      });
      signed.txHex.should.equal(DotResources.rawTx.transfer.signed);
    });

    it('should fail to sign transaction with an invalid key', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: DotResources.rawTx.transfer.unsigned,
            key: DotResources.accounts.account2.publicKey,
            addressVersion: 0,
            validity: {
              firstValid: 3933,
            },
            referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
            version: 7,
          },
          prv: DotResources.accounts.account1.secretKey,
        });
      } catch (e) {
        should.equal(e.message, 'Private key cannot sign the transaction');
      }
    });

    it('should fail to build transaction with missing params', async function () {
      try {
        await basecoin.signTransaction({
          txPrebuild: {
            txHex: DotResources.rawTx.transfer.unsigned,
            key: DotResources.accounts.account1.publicKey,
          },
          prv: DotResources.accounts.account1.secretKey,
        });
      } catch (e) {
        should.notEqual(e, null);
      }
    });

    it('should verify sign params if the key array contains addresses', function () {
      const key = DotResources.accounts.account1.address;
      const verifiedParams = basecoin.verifySignTransactionParams({
        txPrebuild: {
          txHex: DotResources.rawTx.transfer.unsigned,
          key,
          addressVersion: 0,
          validity: {
            firstValid: 3933,
          },
          referenceBlock: '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d',
          version: 7,
        },
        prv: DotResources.accounts.account2.secretKey,
      });
      verifiedParams.should.have.properties(['txHex', 'addressVersion', 'signer', 'prv']);
      const { txHex, signer } = verifiedParams;
      txHex.should.be.equal(DotResources.rawTx.transfer.unsigned);
      signer.should.be.deepEqual(key);
    });
  });

  describe('Generate wallet key pair: ', () => {
    it('should generate key pair', () => {
      const kp = basecoin.generateKeyPair();
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });

    it('should generate key pair from seed', () => {
      const seed = Buffer.from('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60', 'hex');
      const kp = basecoin.generateKeyPair(seed);
      basecoin.isValidPub(kp.pub).should.equal(true);
      basecoin.isValidPrv(kp.prv).should.equal(true);
    });
  });
});
