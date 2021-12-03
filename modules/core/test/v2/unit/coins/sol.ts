import { Sol, Tsol } from '../../../../src/v2/coins/';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as should from 'should';
import * as resources from '@bitgo/account-lib/test/resources/sol/sol';

describe('SOL:', function () {
  let bitgo;
  let basecoin;
  let keyPair;
  const badAddresses = resources.addresses.invalidAddresses;
  const goodAddresses = resources.addresses.validAddresses;
  
  const keypair = {
    pub: resources.accountWithSeed.publicKey,
    prv: resources.accountWithSeed.privateKey.base58,
  };

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol');
    keyPair = basecoin.generateKeyPair(resources.accountWithSeed.seed);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tsol');
    localBasecoin.should.be.an.instanceof(Tsol);

    localBasecoin = bitgo.coin('sol');
    localBasecoin.should.be.an.instanceof(Sol);
  });

  it('should retun the right info', function() {
    basecoin.getChain().should.equal('tsol');
    basecoin.getFamily().should.equal('sol');
    basecoin.getFullName().should.equal('Testnet Sol');
    basecoin.getBaseFactor().should.equal(1000000000);
  });

  it('should verify transactions', async function () {
    should.throws(() => basecoin.verifyTransaction('placeholder'), 'verifyTransaction method not implemented');
  });

  it('should verify valid address', (function () {
    const params = { address: goodAddresses[0] };
    basecoin.verifyAddress(params).should.equal(true);
  }));

  it('should check invalid address', (function () {
    badAddresses.map(addr => { basecoin.isValidAddress(addr).should.equal(false); });
  }));

  it('should check valid pub keys', (function () {
    keyPair.should.have.property('pub');
    basecoin.isValidPub(keyPair.pub).should.equal(true);
  }));

  it('should check an invalid pub keys', (function () {
    const badPubKey = keyPair.pub.slice(0, keyPair.pub.length - 1) + '-';
    basecoin.isValidPub(badPubKey).should.equal(false);
  }));

  it('should check valid prv keys', (function () {
    keyPair.should.have.property('prv');
    basecoin.isValidPrv(keyPair.prv).should.equal(true);
  }));

  it('should check an invalid prv keys', (function () {
    const badPrvKey = keyPair.prv ? keyPair.prv.slice(0, keyPair.prv.length - 1) + '-' : undefined;
    basecoin.isValidPrv(badPrvKey).should.equal(false);
  }));

  describe('Parse Transactions:', () => {
    it('should parse a transfer transaction', async function () {
      await should.throws(() => basecoin.parseTransaction('placeholder'), 'parseTransaction method not implemented');
    });
  });

  describe('Explain Transactions:', () => {
    it('should explain a transfer transaction', async function () {
      await should.throws(() => basecoin.explainTransaction('placeholder'), 'explainTransaction method not implemented');
    });

    it('should explain an unsigned transaction', async function () {
      await should.throws(() => basecoin.explainTransaction('placeholder'), 'explainTransaction method not implemented');
    });
  });

  describe('Keypair:', () => {
    it('should generate a keypair from random seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder'), 'generateKeyPair method not implemented');
    });

    it('should generate a keypair from a seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder'), 'generateKeyPair method not implemented');
    });
  });

  describe('Sign transaction:', () => {
    it('should sign transaction', async function () {
      const signed = await basecoin.signTransaction({
        txPrebuild: {
          txBase64: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.privateKey.base58,
      });
      signed.txBase64.should.equal(resources.RAW_TX_SIGNED);
    });

    it('should throw invalid transaction when sign with public key', async function () {
      await basecoin.signTransaction({
        txPrebuild: {
          txBase64: resources.RAW_TX_UNSIGNED,
          keys: [resources.accountWithSeed.publicKey.toString()],
        },
        prv: resources.accountWithSeed.publicKey,
      }).should.be.rejectedWith('Invalid private key');
    });
  });

  describe('Sign message', () => {
    it('should sign message', async function () {
      const signed = await basecoin.signMessage(
        keypair,
        'signed message',
      );
      signed.toString('base64').should.equal('s+7d/8aW/twfM/0wLSKOGxd9+LhDIiz/g0FfJ39ylJhQIkjK0RYPm/Y+gdeJ5DIy6K6h6gCXXESDomlv12DBBQ==');
    });
    it('shouldnt sign message when message is undefined', async function () {
      await basecoin.signMessage(
        keypair,
      ).should.be.rejectedWith('The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined');
    });
  });

});
