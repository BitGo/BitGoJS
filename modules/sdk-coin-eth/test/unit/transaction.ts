import assert from 'assert';
import should from 'should';
import { coins, EthereumNetwork } from '@bitgo/statics';
import { getCommon, Transaction, TxData } from '../../src';
import * as testData from '../resources/eth';
import { test } from 'mocha';

describe('ETH Transaction', () => {
  const coinConfig = coins.get('teth');
  const common = getCommon(coinConfig.network as EthereumNetwork);
  /**
   * @param data
   */
  function getTransaction(data?: TxData) {
    return new Transaction(coinConfig, common, data);
  }

  describe('should throw ', () => {
    it('an empty transaction', () => {
      const tx = getTransaction();
      assert.throws(() => tx.toJson());
      assert.throws(() => tx.toBroadcastFormat());
    });
  });

  const testParams = [
    ['Legacy', testData.LEGACY_TXDATA, testData.UNSIGNED_LEGACY_TX, testData.ENCODED_LEGACY_TRANSACTION],
    ['EIP1559', testData.EIP1559_TXDATA, testData.UNSIGNED_EIP1559_TX, testData.ENCODED_EIP1559_TRANSACTION],
  ] as const;

  describe('should return', () => {
    testParams.map(([txnType, txData, unsignedTx]) => {
      test(`a valid ${txnType} transaction`, () => {
        const tx = getTransaction(txData);
        should.deepEqual(tx.toJson(), txData);
        should.deepEqual(tx.toBroadcastFormat(), unsignedTx);
      });
    });
  });

  describe('should sign', () => {
    it('invalid', () => {
      const tx = getTransaction();
      return tx.sign(testData.KEYPAIR_PRV).should.be.rejected();
    });

    testParams.map(([txnType, txData]) => {
      it(`should create a valid ${txnType} signature`, () => {
        const tx = getTransaction(txData);
        return tx.sign(testData.KEYPAIR_PRV).should.be.fulfilled();
      });
    });
  });

  describe('should return encoded tx', () => {
    testParams.map(([txnType, txData, _, encodedTxData]) => {
      it(`should create a valid ${txnType} encoded transaction`, async () => {
        const tx = getTransaction(txData);
        await tx.sign(testData.KEYPAIR_PRV);
        should.equal(tx.toBroadcastFormat(), encodedTxData);
      });
    });
  });

  describe('signablePayload', () => {
    it('should throw on an empty transaction', () => {
      const tx = getTransaction();
      assert.throws(() => tx.signablePayload);
    });

    testParams.map(([txnType, txData]) => {
      it(`should return the keccak256 signing hash for a ${txnType} transaction`, () => {
        const tx = getTransaction(txData);
        const payload = tx.signablePayload;
        assert.ok(Buffer.isBuffer(payload));
        assert.strictEqual(payload.length, 32);
        // txData.id is set from getMessageToSign() in toJson() — must match the signing payload
        assert.strictEqual('0x' + payload.toString('hex'), txData.id);
      });
    });

    it('should produce distinct payloads for Legacy and EIP1559 transactions', () => {
      const legacy = getTransaction(testData.LEGACY_TXDATA).signablePayload;
      const eip1559 = getTransaction(testData.EIP1559_TXDATA).signablePayload;
      assert.notStrictEqual(legacy.toString('hex'), eip1559.toString('hex'));
    });
  });
});
