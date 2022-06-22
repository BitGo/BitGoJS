import * as AvaxpLib from '../../src/lib';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { AvaxP, TavaxP } from '../../src/';
import { randomBytes } from 'crypto';
import * as should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/statics';
import * as testData from '../resources/avaxp';

describe('Avaxp', function () {
  const coinName = 'avaxp';
  const tcoinName = 't' + coinName;
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister(coinName, AvaxP.createInstance);
    bitgo.safeRegister(tcoinName, TavaxP.createInstance);
    basecoin = bitgo.coin(tcoinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin(tcoinName);
    localBasecoin.should.be.an.instanceof(TavaxP);

    localBasecoin = bitgo.coin(coinName);
    localBasecoin.should.be.an.instanceof(AvaxP);
  });

  it('should return ' + tcoinName, function () {
    basecoin.getChain().should.equal(tcoinName);
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Avalanche P-Chain');
  });

  describe('Keypairs:', () => {
    it('should generate a keypair from random seed', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');
    });

    it('should generate a keypair from a seed', function () {
      const seedText = testData.SEED_ACCOUNT.seed;
      const seed = Buffer.from(seedText, 'hex');
      const keyPair = basecoin.generateKeyPair(seed);

      keyPair.pub.should.equal(testData.SEED_ACCOUNT.publicKeyCb58);
      keyPair.prv.should.equal(testData.SEED_ACCOUNT.privateKeyAvax);
    });

    it('should validate a public key', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPub(keyPair.pub).should.equal(true);
    });

    it('should validate a private key', function () {
      const keyPair = basecoin.generateKeyPair();
      keyPair.should.have.property('pub');
      keyPair.should.have.property('prv');

      basecoin.isValidPrv(keyPair.prv).should.equal(true);
    });
  });

  describe('Sign Transaction', () => {
    const factory = new AvaxpLib.TransactionBuilderFactory(coins.get(tcoinName));

    it('should be performed', async () => {
      const builder = factory.from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);
      const tx = await builder.build();

      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: testData.ADDVALIDATOR_SAMPLES.privKey.prv1,
      };

      let signedTransaction = await basecoin.signTransaction(params);
      signedTransaction.should.have.property('halfSigned');

      signedTransaction.halfSigned.txHex.should.equal(testData.ADDVALIDATOR_SAMPLES.halfsigntxHex);

      params.txPrebuild.txHex = signedTransaction.halfSigned.txHex;
      params.prv = testData.ADDVALIDATOR_SAMPLES.privKey.prv3;
      signedTransaction = await basecoin.signTransaction(params);
      signedTransaction.should.not.have.property('halfSigned');
      signedTransaction.should.have.property('txHex');
      signedTransaction.txHex.should.equal(testData.ADDVALIDATOR_SAMPLES.fullsigntxHex);
    });

    it('should be rejected if invalid key', async () => {
      const invalidPrivateKey = 'AAAAA';
      const builder = factory.from(testData.ADDVALIDATOR_SAMPLES.unsignedTxHex);

      const tx = await builder.build();
      const params = {
        txPrebuild: {
          txHex: tx.toBroadcastFormat(),
        },
        prv: invalidPrivateKey,
      };

      await basecoin.signTransaction(params).should.be.rejected();
    });
  });

  describe('Sign Message', () => {
    it('should be performed', async () => {
      const keyPairToSign = new AvaxpLib.KeyPair();
      const prvKey = keyPairToSign.getPrivateKey();
      const keyPair = keyPairToSign.getKeys();
      const messageToSign = Buffer.from(randomBytes(32));
      const signature = await basecoin.signMessage(keyPair, messageToSign.toString('hex'));

      const verify = AvaxpLib.Utils.verifySignature(basecoin._staticsCoin.network, messageToSign, signature, prvKey!);
      verify.should.be.true();
    });

    it('should fail with missing private key', async () => {
      const keyPair = new AvaxpLib.KeyPair({
        pub: testData.SEED_ACCOUNT.publicKeyCb58,
      }).getKeys();
      const messageToSign = Buffer.from(randomBytes(32)).toString('hex');
      await basecoin.signMessage(keyPair, messageToSign).should.be.rejectedWith('Invalid key pair options');
    });
  });

  // TODO(STLX-16570): explainTransaction
  xdescribe('Explain Transaction', () => {
    it('should explain a half signed AddValidator transaction', () => {
      // TODO(STLX-16570): explainTransaction
    });

    it('should explain a signed AddValidator transaction', () => {
      // TODO(STLX-16570): explainTransaction
    });

    it('should fail when a tx is not passed as parameter', async () => {
      const explainTxParams = {
        fee: {
          gasLimit: '1',
          gasPrice: '11000',
        },
      };
      await basecoin.explainTransaction(explainTxParams).should.be.rejectedWith('missing explain tx parameters');
    });
  });

  // TODO(STLX-16574): verifyTransaction
  xdescribe('Validation', function () {
    it('should fail to validate invalid address', function () {
      const invalidAddresses = [];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => basecoin.isValidAddress(address));
        basecoin.isValidAddress(address).should.be.false();
      }
    });

    it('should validate address', function () {
      const validAddresses = [];

      for (const address of validAddresses) {
        basecoin.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to verify invalid address', function () {
      const invalidAddresses = [];

      for (const address of invalidAddresses) {
        should.throws(() => basecoin.verifyAddress(address));
      }
    });

    it('should verify address', function () {
      const keychains = [
        {
          id: '624f0dcc93cbcc0008d88df2369a565e',
          pub: 'xpub661MyMwAqRbcEeRkBciuaUfF4C1jgBcnj2RXdnt9gokx4CFRBUp4bsbk5hXHC1BrBDZLDNecVsUCMmoLpPhWdPZhPiTsHSoxNoGVW9KtiEQ',
          ethAddress: '0xcfbf38770af3a95da7998537a481434e2cb9b2fa',
          source: 'user',
          type: 'independent',
          encryptedPrv:
            '{"iv":"Z2XySTRNipFZ06/EXynwvA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"KGRPbZ2jt1g=","ct":"szpCbDLFIlRZvCBV60SWBEMYXvny7YlBtu4ffjlctDQGjR4/+vfCkovgGHs+Xvf/eIlUM3Kicubg+Sdp61MImjMT/umZ3IJT1E2I9mM0QDqpzXlohTGnJ4vgfHgCz3QkB4uYm5mqaD4LtRbvZbGhGrc5jzrLzqQ="}',
        },
        {
          id: '624f0dcd93cbcc0008d88e0fc4261a38',
          pub: 'xpub661MyMwAqRbcGeqZVFgQfcD8zLoxaZL7y4cVAjhE8ybMTpvbppP6rc22a69BgcNVo74yL8fWPzNM5vAozBE7chzGYoPDJMyJ39F2HeAsGcn',
          ethAddress: '0xbf37f39208d77e3254b7efbcab1432b9c353e337',
          source: 'backup',
          type: 'independent',
          encryptedPrv:
            '{"iv":"T9gdJnSAEWFsLZ4cg9VA8g==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"FaLlns3mPiI=","ct":"QW5Zq9qJoDxDrK60zTAM6Lg+S4KP9FcEn9AHw5UIyakSBlD0XjVTluZ9PlTABjIlp9cQvMef/SH8Em1d4ash0PACoqBz2IxPwhW9h6uyQBdqk97iPrnM2rOQobsy9p0ILJM10fOgB+EEFYX5yQ5gyfEcK060j/Q="}',
        },
        {
          id: '624f0dce10610a0007fc5282353187ae',
          pub: 'xpub661MyMwAqRbcFVMAYJe51sgXaiFLeUb1v4u3B63CgBNMmMjtWBo32AS3bunsBUZMdi37pzovtEg5mVf6wBKayTYapGQRxymQjcmHaVmSPz8',
          ethAddress: '0x7527720b5638d2f5e2b272b20fc96d2223528d0e',
          source: 'bitgo',
          type: 'independent',
          isBitGo: true,
        },
      ];

      const validAddresses = [
        {
          address: '020250fe213706e46aaa32cb23f0705833c6d3ce7652e8e5a1349dde102aadf014b7',
          keychains,
        },
        {
          address: '020250FE213706E46AAA32CB23F0705833C6D3CE7652E8E5A1349DDE102AADF014B7?transferId=0',
          keychains,
        },
        {
          address: '020250fe213706e46aaa32cb23f0705833c6d3ce7652e8e5a1349dde102aadf014b7?transferId=5555',
          keychains,
        },
      ];

      for (const addressParams of validAddresses) {
        basecoin.verifyAddress(addressParams).should.be.true();
      }
    });
  });
});
