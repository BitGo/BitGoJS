import { Xpr } from '../../src/xpr';
import { Txpr } from '../../src/txpr';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import should from 'should';

describe('Proton (XPR Network) Coin', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Xpr;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('xpr', Xpr.createInstance);
    bitgo.safeRegister('txpr', Txpr.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('xpr') as Xpr;
  });

  it('should instantiate the coin', function () {
    basecoin.should.be.an.instanceof(Xpr);
  });

  it('should return the correct coin name', function () {
    basecoin.getChain().should.equal('xpr');
    basecoin.getFullName().should.equal('Proton (XPR Network)');
    basecoin.getBaseFactor().should.equal(10000);
  });

  it('should return the correct family', function () {
    basecoin.getFamily().should.equal('xpr');
  });

  it('should support TSS', function () {
    basecoin.supportsTss().should.equal(true);
  });

  it('should return ECDSA as MPC algorithm', function () {
    basecoin.getMPCAlgorithm().should.equal('ecdsa');
  });

  it('should allow valueless transfers', function () {
    basecoin.valuelessTransferAllowed().should.equal(true);
  });

  describe('Address validation', function () {
    it('should validate valid addresses', function () {
      basecoin.isValidAddress('testaccount1').should.equal(true);
      basecoin.isValidAddress('user').should.equal(true);
      basecoin.isValidAddress('eosio.token').should.equal(true);
    });

    it('should invalidate invalid addresses', function () {
      basecoin.isValidAddress('UPPERCASE').should.equal(false);
      basecoin.isValidAddress('invalid!@#').should.equal(false);
      basecoin.isValidAddress('').should.equal(false);
    });
  });

  describe('Key generation', function () {
    it('should generate a key pair', function () {
      const keyPair = basecoin.generateKeyPair();
      should.exist(keyPair.pub);
      should.exist(keyPair.prv);
      keyPair.pub!.should.startWith('PUB_K1_');
      keyPair.prv!.should.startWith('PVT_K1_');
    });

    it('should generate a key pair from seed', function () {
      // Use a valid seed (not all zeros, which is invalid for secp256k1)
      const seed = Buffer.from('a'.repeat(64), 'hex');
      const keyPair = basecoin.generateKeyPair(seed);
      should.exist(keyPair.pub);
      should.exist(keyPair.prv);
    });

    it('should generate the same key pair from the same seed', function () {
      // Use a valid seed (not all zeros, which is invalid for secp256k1)
      const seed = Buffer.from('a'.repeat(64), 'hex');
      const keyPair1 = basecoin.generateKeyPair(seed);
      const keyPair2 = basecoin.generateKeyPair(seed);
      keyPair1.pub!.should.equal(keyPair2.pub!);
      keyPair1.prv!.should.equal(keyPair2.prv!);
    });
  });

  describe('Public key validation', function () {
    it('should validate valid public keys', function () {
      const validPubKey = 'PUB_K1_6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5BoDq63';
      basecoin.isValidPub(validPubKey).should.equal(true);
    });

    it('should validate legacy EOS format public keys', function () {
      const legacyPubKey = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
      basecoin.isValidPub(legacyPubKey).should.equal(true);
    });

    it('should invalidate invalid public keys', function () {
      basecoin.isValidPub('invalid').should.equal(false);
      basecoin.isValidPub('').should.equal(false);
    });
  });

  describe('Private key validation', function () {
    it('should validate valid private keys', function () {
      const validPrvKey = 'PVT_K1_2bfGi9rYsXQSXXTvJbDAPhHLQUojjaNLomdm3cEJ1XTzMqUt3V';
      basecoin.isValidPrv(validPrvKey).should.equal(true);
    });

    it('should validate WIF format private keys', function () {
      const wifPrvKey = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
      basecoin.isValidPrv(wifPrvKey).should.equal(true);
    });

    it('should invalidate invalid private keys', function () {
      basecoin.isValidPrv('invalid').should.equal(false);
      basecoin.isValidPrv('').should.equal(false);
    });
  });

  describe('Testnet', function () {
    let testnetBasecoin: Txpr;

    before(function () {
      testnetBasecoin = bitgo.coin('txpr') as Txpr;
    });

    it('should instantiate the testnet coin', function () {
      testnetBasecoin.should.be.an.instanceof(Txpr);
    });

    it('should return the correct testnet coin name', function () {
      testnetBasecoin.getChain().should.equal('txpr');
      testnetBasecoin.getFullName().should.equal('Testnet Proton (XPR Network)');
      testnetBasecoin.getBaseFactor().should.equal(10000);
    });

    it('should support TSS on testnet', function () {
      testnetBasecoin.supportsTss().should.equal(true);
    });
  });
});
