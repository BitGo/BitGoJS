import { DotAddressFormat } from '@bitgo/sdk-core';
import should from 'should';
import { KeyPair } from '../../src';
import { accounts } from '../resources';

describe('ACA KeyPair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  const { account1, account2, account3, default: defaultAccount, bs58Account } = accounts;

  describe('Keypair creation', () => {
    it('initial state', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv?.length, 64);
      should.equal(keyPair.getKeys().pub.length, 64);
    });

    it('initialization from private key', () => {
      let keyPair = new KeyPair({ prv: account1.secretKey });
      should.equal(keyPair.getKeys().prv, account1.secretKey);
      should.equal(keyPair.getKeys().pub, account1.publicKey);

      keyPair = new KeyPair({ prv: account2.secretKey });
      should.equal(keyPair.getKeys().prv, account2.secretKey);
      should.equal(keyPair.getKeys().pub, account2.publicKey);
    });

    it('initialization from public key', () => {
      const keyPair = new KeyPair({ pub: account3.publicKey });
      should.equal(keyPair.getKeys().pub, account3.publicKey);
    });
  });

  describe('getAddress', () => {
    it('should get a substrate address', () => {
      const keyPair = new KeyPair(defaultSeed);
      const address = keyPair.getAddress(DotAddressFormat.substrate as number);
      address.should.equal(defaultAccount.address);
    });

    it('should get an acala network address', () => {
      const keyPair = new KeyPair({ pub: bs58Account.publicKey });
      const address = keyPair.getAddress(DotAddressFormat.acala as number);
      address.should.startWith('2', 'Acala mainnet addresses start with 2');
    });
  });
});
