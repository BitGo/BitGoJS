import should from 'should';
import { Near } from '../../../../src';
import * as NearResources from '../../../resources/near';
import { Transaction } from '../../../../src/coin/near';
import { coins } from '@bitgo/statics';

describe('NEAR KeyPair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  const {
    accounts: { account1, account2, account3, account4, default: defaultAccount },
  } = NearResources;

  describe('Keypair creation', () => {
    it('initial state', () => {
      const keyPair = new Near.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 64);
      should.equal(keyPair.getKeys().pub.length, 64);
    });

    it('initialization from private key', () => {
      let keyPair = new Near.KeyPair({ prv: account1.secretKey });
      should.equal(keyPair.getKeys().prv, account1.secretKey);
      should.equal(keyPair.getKeys().pub, account1.publicKey);

      keyPair = new Near.KeyPair({ prv: account2.secretKey });
      should.equal(keyPair.getKeys().prv, account2.secretKey);
      should.equal(keyPair.getKeys().pub, account2.publicKey);

      keyPair = new Near.KeyPair({ prv: account3.secretKey });
      should.equal(keyPair.getAddress(), account3.address);
      should.equal(keyPair.getKeys().pub, account3.publicKey);
    });

    it('initialization from public key', () => {
      let keyPair = new Near.KeyPair({ pub: account1.publicKey });
      should.equal(keyPair.getKeys().pub, account1.publicKey);

      keyPair = new Near.KeyPair({ pub: account4.publicKey });
      should.equal(keyPair.getAddress(), account4.address);
    });
  });

  describe('KeyPair validation', () => {
    it('should fail to create from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      should.throws(() => new Near.KeyPair(seed), 'bad seed size');
    });

    it('should fail to create from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      should.throws(() => new Near.KeyPair(source), 'address seems to be malformed');
    });

    it('should fail to create from an invalid private key', () => {
      const source = {
        prv: '82A34',
      };
      should.throws(() => new Near.KeyPair(source), 'Invalid base32 characters');
    });
  });

  describe('getAddress', () => {
    it('should get an address', () => {
      let keyPair = new Near.KeyPair({ prv: account1.secretKey });
      let address = keyPair.getAddress();
      address.should.equal(account1.address);

      keyPair = new Near.KeyPair({ prv: account2.secretKey });
      address = keyPair.getAddress();
      address.should.equal(account2.address);
    });
  });

  describe('getKeys', () => {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new Near.KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv!.should.equal(defaultAccount.secretKey);
      pub.should.equal(defaultAccount.publicKey);
      const address = keyPair.getAddress();
      address.should.equal(defaultAccount.address);
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new Near.KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });

  describe('verifySignature', () => {
    let tx: Transaction;
    const config = coins.get('tnear');

    beforeEach(() => {
      tx = new Transaction(config);
    });
    it('should verify a tss signed raw tx', () => {
      const rawTx =
        'QAAAAGFmYzNlY2Y2MDkxMGFlYzk0NDNlOWY1ZTYwZTY4NzNiNGE3NDM1MGM1NGJiZDBlODI2ZjczNTc1NDRhNjljMDUAr8Ps9gkQrslEPp9eYOaHO0p0NQxUu9DoJvc1dUSmnAWBYCrPG1AAAEAAAAA0ZmU4MDRmNGZjN2ZiNDgwMzJhY2FjMDg1ZGVhMWU0MzAxMWI4MmUzYjk2MGJiYmM4OWUyYmVhMDRkNzJlMGEwjbfBpwR2OsTjfxa+GgQTNycQYoxRCIVevYaE2xQZhVsBAAAAAwDkC1QCAAAAAAAAAAAAAAAA8yT2sWVrTyzI0u4bbeKh1Kag05M9pjqvRXKIm5XptNnG6kpwhWf9U2kEZO4oV4agXAKJ/P50ForPcI80K+b2CQ==';
      tx.fromRawTransaction(rawTx);
      const payload = tx.signablePayload;
      const signature = Near.Utils.default.base58Decode(tx.signature[0]);
      const pk = new Near.KeyPair({ pub: tx.inputs[0].address });
      const result = pk.verifySignature(payload, signature);
      result.should.be.true();
    });

    it('should verify a singlesig signed raw tx', async () => {
      tx.fromRawTransaction(NearResources.rawTx.transfer.signed);
      const payload = tx.signablePayload;
      const signature = Near.Utils.default.base58Decode(tx.signature[0]);
      const pk = new Near.KeyPair({ pub: tx.inputs[0].address });
      const result = pk.verifySignature(payload, signature);
      console.log(result);
      result.should.be.true();
    });
  });
});
