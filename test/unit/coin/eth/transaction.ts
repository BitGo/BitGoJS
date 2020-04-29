import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/eth/transaction';
import { KeyPair } from '../../../../src/coin/eth';

const TXDATA = {
  nonce: 1,
  to: '0xBa8eA9C3729686d7DB120efCfC81cD020C8DC1CB',
  value: 125,
  chainId: 31,
  gasLimit: 12000,
  gasPrice: 10,
  data: '0x1',
};
const TEST_KEYPAIR = new KeyPair({ prv: 'E9574834182AAC2AD777D2851762E5D5D7BEAC1F36E09D12B3944A627BE1D360' });
const ENCODED_TRANSACTION =
  '0xf84b010a822ee080800162a03e02aa98cc658c89ce3f33b88cf70ac0f6294d89d9224483c9cd98a26853c932a02d29a3a6c42167d3ee92dc9dd490baada4074add90b10e8b390a13ac0f4e2ac5';

describe('ETH Transaction', function() {
  describe('should throw empty transaction', function() {
    const tx = new Transaction(coins.get('eth'));
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should return valid transaction', function() {
    const tx = new Transaction(coins.get('eth'));
    tx.setTransactionData(TXDATA);
    should.equal(tx.toJson(), TXDATA);
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign', function() {
    it('invalid', function() {
      const tx = new Transaction(coins.get('eth'));
      return tx.sign(TEST_KEYPAIR).should.be.rejected();
    });
    it('valid', function() {
      const tx = new Transaction(coins.get('eth'));
      tx.setTransactionData(TXDATA);
      return tx.sign(TEST_KEYPAIR).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      const tx = new Transaction(coins.get('eth'));
      tx.setTransactionData(TXDATA);
      await tx.sign(TEST_KEYPAIR);
      should.equal(tx.toBroadcastFormat(), ENCODED_TRANSACTION);
    });
  });
});
