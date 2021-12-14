import should from 'should';
import utils from '../../../../src/coin/dot/utils';
import { accounts, blockHash } from '../../../resources/dot';

describe('utils', () => {
  it('should validate addresses correctly', () => {
    should.equal(utils.isValidAddress(accounts.account1.address), true);
    should.equal(utils.isValidAddress(accounts.account2.address), true);
    should.equal(utils.isValidAddress(accounts.account3.address), true);
    should.equal(utils.isValidAddress(accounts.account4.address), true);
  });

  it('should validate block hash correctly', () => {
    should.equal(utils.isValidBlockId(blockHash.block.hash), true);
  });

  it('should validate public key correctly', () => {
    should.equal(utils.isValidPublicKey(accounts.account1.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account2.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account3.publicKey), true);
    should.equal(utils.isValidPublicKey(accounts.account4.publicKey), true);
  });

  it('should validate private key correctly', () => {
    should.equal(utils.isValidPrivateKey(accounts.account1.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account2.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account3.secretKey), true);
    should.equal(utils.isValidPrivateKey(accounts.account4.secretKey), true);
  });

  it('should capitalize first letter correctly', () => {
    should.equal(utils.capitalizeFirstLetter('polkadot'), 'Polkadot');
  });

  it('should decode DOT address correctly', () => {
    should.equal(utils.decodeDotAddress(accounts.account1.address), '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr');
  });

  it('should encode DOT address correctly', () => {
    should.equal(utils.encodeDotAddress(accounts.account1.address), '5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr');
  });
});
