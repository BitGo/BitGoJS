import should from 'should';
import utils from '../../src/lib/utils';

describe('Proton (XPR Network) Utils', function () {
  describe('Address Validation', function () {
    it('should validate valid account names', function () {
      // Valid EOSIO account names
      utils.isValidAddress('testaccount1').should.be.true();
      utils.isValidAddress('user').should.be.true();
      utils.isValidAddress('a').should.be.true();
      utils.isValidAddress('123451234512').should.be.true();
      utils.isValidAddress('my.account').should.be.true();
      utils.isValidAddress('eosio.token').should.be.true();
    });

    it('should invalidate account names with uppercase', function () {
      utils.isValidAddress('TestAccount').should.be.false();
      utils.isValidAddress('UPPERCASE').should.be.false();
    });

    it('should invalidate account names with invalid characters', function () {
      utils.isValidAddress('invalid!@#$').should.be.false();
      utils.isValidAddress('user_name').should.be.false(); // underscore not allowed
      utils.isValidAddress('user-name').should.be.false(); // hyphen not allowed
      utils.isValidAddress('user name').should.be.false(); // space not allowed
    });

    it('should invalidate account names that are too long', function () {
      utils.isValidAddress('1234512345123').should.be.false(); // 13 chars
    });

    it('should invalidate account names starting or ending with dot', function () {
      utils.isValidAddress('.account').should.be.false();
      utils.isValidAddress('account.').should.be.false();
    });

    it('should invalidate an empty address', function () {
      utils.isValidAddress('').should.be.false();
    });

    it('should invalidate null/undefined addresses', function () {
      utils.isValidAddress(null as any).should.be.false();
      utils.isValidAddress(undefined as any).should.be.false();
    });

    it('should invalidate account names with invalid EOSIO characters (6-9, 0)', function () {
      // EOSIO uses base32 with a-z and 1-5 only
      utils.isValidAddress('account6').should.be.false();
      utils.isValidAddress('account7').should.be.false();
      utils.isValidAddress('account8').should.be.false();
      utils.isValidAddress('account9').should.be.false();
      utils.isValidAddress('account0').should.be.false();
    });
  });

  describe('Public Key Validation', function () {
    it('should validate PUB_K1_ format public keys', function () {
      // Valid PUB_K1_ format (need proper checksum)
      const validPubKey = 'PUB_K1_6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5BoDq63';
      utils.isValidPublicKey(validPubKey).should.be.true();
    });

    it('should validate legacy EOS format public keys', function () {
      const validLegacyPubKey = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
      utils.isValidPublicKey(validLegacyPubKey).should.be.true();
    });

    it('should invalidate an invalid public key', function () {
      utils.isValidPublicKey('notahexstring').should.be.false();
      utils.isValidPublicKey('PUB_K1_invalid').should.be.false();
    });

    it('should invalidate a public key with wrong length', function () {
      utils.isValidPublicKey('PUB_K1_short').should.be.false();
    });

    it('should invalidate empty/null public keys', function () {
      utils.isValidPublicKey('').should.be.false();
      utils.isValidPublicKey(null as any).should.be.false();
      utils.isValidPublicKey(undefined as any).should.be.false();
    });
  });

  describe('Private Key Validation', function () {
    it('should validate PVT_K1_ format private keys', function () {
      const validPrvKey = 'PVT_K1_2bfGi9rYsXQSXXTvJbDAPhHLQUojjaNLomdm3cEJ1XTzMqUt3V';
      utils.isValidPrivateKey(validPrvKey).should.be.true();
    });

    it('should validate WIF format private keys', function () {
      // WIF private keys start with 5H, 5J, or 5K
      const validWifKey = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
      utils.isValidPrivateKey(validWifKey).should.be.true();
    });

    it('should invalidate an invalid private key', function () {
      utils.isValidPrivateKey('notahexstring').should.be.false();
      utils.isValidPrivateKey('PVT_K1_invalid').should.be.false();
    });

    it('should invalidate a private key with wrong length', function () {
      utils.isValidPrivateKey('PVT_K1_short').should.be.false();
    });

    it('should invalidate empty/null private keys', function () {
      utils.isValidPrivateKey('').should.be.false();
      utils.isValidPrivateKey(null as any).should.be.false();
      utils.isValidPrivateKey(undefined as any).should.be.false();
    });
  });

  describe('Raw Private Key Validation', function () {
    it('should validate a valid raw hex private key', function () {
      const validRawKey = 'a'.repeat(64);
      utils.isValidRawPrivateKey(validRawKey).should.be.true();
    });

    it('should invalidate raw key with wrong length', function () {
      utils.isValidRawPrivateKey('a'.repeat(32)).should.be.false();
      utils.isValidRawPrivateKey('a'.repeat(128)).should.be.false();
    });

    it('should invalidate non-hex raw key', function () {
      utils.isValidRawPrivateKey('g'.repeat(64)).should.be.false();
    });

    it('should invalidate empty/null raw keys', function () {
      utils.isValidRawPrivateKey('').should.be.false();
      utils.isValidRawPrivateKey(null as any).should.be.false();
    });
  });

  describe('Amount Formatting', function () {
    it('should format XPR amount from base units', function () {
      utils.formatXprAmount(10000).should.equal('1.0000 XPR');
      utils.formatXprAmount('10000').should.equal('1.0000 XPR');
      utils.formatXprAmount(15000).should.equal('1.5000 XPR');
      utils.formatXprAmount(1).should.equal('0.0001 XPR');
    });

    it('should parse XPR amount to base units', function () {
      utils.parseXprAmount('1.0000 XPR').should.equal('10000');
      utils.parseXprAmount('1.5000 XPR').should.equal('15000');
      utils.parseXprAmount('0.0001 XPR').should.equal('1');
    });

    it('should throw on invalid asset string', function () {
      should.throws(() => {
        utils.parseXprAmount('invalid');
      }, /Invalid asset string/);
    });
  });

  describe('Raw Transaction Validation', function () {
    it('should validate a valid hex transaction', function () {
      const validHex = 'abcdef0123456789';
      utils.isValidRawTransaction(validHex).should.be.true();
    });

    it('should invalidate non-hex transaction', function () {
      utils.isValidRawTransaction('not-hex!').should.be.false();
    });

    it('should invalidate empty transaction', function () {
      utils.isValidRawTransaction('').should.be.false();
      utils.isValidRawTransaction(null as any).should.be.false();
    });
  });
});
