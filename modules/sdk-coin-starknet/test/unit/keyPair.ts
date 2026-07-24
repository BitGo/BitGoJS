import should from 'should';
import { KeyPair } from '../../src/lib/keyPair';
import { Accounts } from '../resources/starknet';

describe('Starknet KeyPair', () => {
  describe('Constructor', () => {
    it('should create keypair from public key only', () => {
      const kp = new KeyPair({ pub: Accounts.account1.publicKey });
      const keys = kp.getKeys();
      should.exist(keys.pub);
    });

    it('should create keypair from private key', () => {
      const kp = new KeyPair({ prv: Accounts.account1.secretKey });
      const keys = kp.getKeys();
      should.exist(keys.pub);
      should.exist(keys.prv);
    });

    it('should create random keypair when no source', () => {
      const kp = new KeyPair();
      const keys = kp.getKeys();
      should.exist(keys.pub);
      should.exist(keys.prv);
    });

    it('should throw on invalid public key', () => {
      should.throws(() => new KeyPair({ pub: 'invalid_key_format' }));
    });

    it('should throw on invalid private key', () => {
      should.throws(() => new KeyPair({ prv: 'not_a_valid_key' }));
    });
  });

  describe('Key Generation', () => {
    it('should create unique key pairs each time', () => {
      const kp1 = new KeyPair();
      const kp2 = new KeyPair();
      kp1.getKeys().pub.should.not.equal(kp2.getKeys().pub);
    });
  });

  describe('getAddress', () => {
    it('should return a valid Starknet address from keypair', () => {
      const kp = new KeyPair({ pub: Accounts.account1.publicKey });
      const address = kp.getAddress();
      should.exist(address);
      address.should.startWith('0x');
    });

    it('should return different addresses for different keys', () => {
      const kp1 = new KeyPair({ pub: Accounts.account1.publicKey });
      const kp2 = new KeyPair({ pub: Accounts.account2.publicKey });
      kp1.getAddress().should.not.equal(kp2.getAddress());
    });
  });
});
