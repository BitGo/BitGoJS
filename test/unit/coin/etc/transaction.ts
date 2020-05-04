import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/etc/transaction';
import { KeyPair } from '../../../../src/coin/etc';

const TXDATA = {
  nonce: 1,
  data: '0x111111111111111111111111',
  gasLimit: 12000,
  gasPrice: 10,
  chainId: 44786,
};
const TEST_KEYPAIR = new KeyPair({ prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C' });
const ENCODED_TRANSACTION =
  '0xf858010a822ee080808c11111111111111111111111181a1a009c5dbd33801c8ae0f44429a02fc77ed2232ac1d9db88fe11aeb83659aa2c933a0069ee40c549c37b4f745a2f6c10b3d394dbb6e2d9821ac4fcc3e2782c6712ef5';

describe('Etc Transaction', function() {
  describe('should throw empty transaction', function() {
    const tx = new Transaction(coins.get('etc'));
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should return valid transaction', function() {
    const tx = new Transaction(coins.get('etc'));
    tx.setTransactionData(TXDATA);
    should.equal(tx.toJson(), TXDATA);
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign', function() {
    it('invalid', function() {
      const tx = new Transaction(coins.get('etc'));
      return tx.sign(TEST_KEYPAIR).should.be.rejected();
    });
    it('valid', function() {
      const tx = new Transaction(coins.get('etc'));
      tx.setTransactionData(TXDATA);
      return tx.sign(TEST_KEYPAIR).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      const tx = new Transaction(coins.get('etc'));
      tx.setTransactionData(TXDATA);
      await tx.sign(TEST_KEYPAIR);
      should.equal(tx.toBroadcastFormat(), ENCODED_TRANSACTION);
    });
  });
});
