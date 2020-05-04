import should from 'should';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../../../src/coin/cgld/transaction';
import { KeyPair } from '../../../../src/coin/cgld';

const TXDATA = {
  nonce: 1,
  data: '0x111111111111111111111111',
  gasLimit: 12000,
  gasPrice: 10,
  chainId: 44786,
};
const TEST_KEYPAIR = new KeyPair({ prv: '8CAA00AE63638B0542A304823D66D96FF317A576F692663DB2F85E60FAB2590C' });
const ENCODED_TRANSACTION =
  '0xf85d010a822ee080808080808c11111111111111111111111183015e07a0cfdddecd7bd8aba329b6ad47deaeb0384815540a7c5f45a52bc159eef71f4389a00b195d91de4e57e14c91482e4b6655ada71e188997a3f149460d0b5d252fb300';

describe('Celo Transaction', function() {
  describe('should throw empty transaction', function() {
    const tx = new Transaction(coins.get('cgld'));
    should.throws(() => {
      tx.toJson();
    });
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should return valid transaction', function() {
    const tx = new Transaction(coins.get('cgld'));
    tx.setTransactionData(TXDATA);
    should.equal(tx.toJson(), TXDATA);
    should.throws(() => {
      tx.toBroadcastFormat();
    });
  });

  describe('should sign', function() {
    it('invalid', function() {
      const tx = new Transaction(coins.get('cgld'));
      return tx.sign(TEST_KEYPAIR).should.be.rejected();
    });
    it('valid', function() {
      const tx = new Transaction(coins.get('cgld'));
      tx.setTransactionData(TXDATA);
      return tx.sign(TEST_KEYPAIR).should.be.fulfilled();
    });
  });

  describe('should return encoded tx', function() {
    it('valid sign', async function() {
      const tx = new Transaction(coins.get('cgld'));
      tx.setTransactionData(TXDATA);
      await tx.sign(TEST_KEYPAIR);
      should.equal(tx.toBroadcastFormat(), ENCODED_TRANSACTION);
    });
  });
});
