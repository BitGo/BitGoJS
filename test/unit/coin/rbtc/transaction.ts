import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/rbtc/transaction';
import { KeyPair } from '../../../../src/coin/rbtc';

const TXDATA = {
  nonce: 1,
  data: '0x111111111111111111111111',
  gasLimit: 12000,
  gasPrice: 10,
  chainId: 44786,
};
const TEST_KEYPAIR = new KeyPair({ prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C' });
const ENCODED_TRANSACTION =
  '0xf857010a822ee080808c11111111111111111111111162a0e26c33177c0a52864036be6716b568e70d03687170c7ee420e982d755f4840c4a06c06a223b281adc139919c56e883b328097d291dca42b2514a91860d6c2ec3a5';

describe('Rbtc Transaction', function() {
  describe('should throw empty transaction', function() {
    const tx = new Transaction(coins.get('rbtc'));
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should return valid transaction', function() {
    const tx = new Transaction(coins.get('rbtc'));
    tx.setTransactionData(TXDATA);
    should.equal(tx.toJson(), TXDATA);
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign', function() {
    it('invalid', function() {
      const tx = new Transaction(coins.get('rbtc'));
      return tx.sign(TEST_KEYPAIR).should.be.rejected();
    });
    it('valid', function() {
      const tx = new Transaction(coins.get('rbtc'));
      tx.setTransactionData(TXDATA);
      return tx.sign(TEST_KEYPAIR).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      const tx = new Transaction(coins.get('rbtc'));
      tx.setTransactionData(TXDATA);
      await tx.sign(TEST_KEYPAIR);
      should.equal(tx.toBroadcastFormat(), ENCODED_TRANSACTION);
    });
  });
});
