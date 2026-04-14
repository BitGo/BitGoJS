import * as should from 'should';
import { Transaction } from '../../src/lib/transaction';
import { KaspaTransactionData } from '../../src/lib/iface';
import { TEST_UTXO } from '../fixtures/kas.fixtures';
import {
  TX_VERSION,
  NATIVE_SUBNETWORK_ID,
  DEFAULT_SEQUENCE,
  DEFAULT_GAS,
  DEFAULT_LOCK_TIME,
} from '../../src/lib/constants';

describe('Kaspa Transaction', () => {
  const buildBasicTxData = (): Partial<KaspaTransactionData> => ({
    version: TX_VERSION,
    inputs: [
      {
        previousOutpoint: {
          transactionId: TEST_UTXO.transactionId,
          index: TEST_UTXO.index,
        },
        signatureScript: '',
        sequence: DEFAULT_SEQUENCE,
        sigOpCount: 1,
      },
    ],
    outputs: [
      {
        value: BigInt('50000000'),
        scriptPublicKey: {
          version: 0,
          script: '20' + 'be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' + 'ac',
        },
      },
    ],
    lockTime: DEFAULT_LOCK_TIME,
    subnetworkId: NATIVE_SUBNETWORK_ID.toString('hex'),
    gas: DEFAULT_GAS,
    payload: '',
  });

  describe('constructor', () => {
    it('should create an empty transaction', () => {
      const tx = new Transaction();
      tx.txData.version.should.equal(TX_VERSION);
      tx.txData.inputs.length.should.equal(0);
      tx.txData.outputs.length.should.equal(0);
    });

    it('should create a transaction from data', () => {
      const data = buildBasicTxData();
      const tx = new Transaction(data);
      tx.txData.inputs.length.should.equal(1);
      tx.txData.outputs.length.should.equal(1);
    });
  });

  describe('serialize / deserialize roundtrip', () => {
    it('should serialize and deserialize correctly', () => {
      const data = buildBasicTxData();
      const tx = new Transaction(data);
      const hex = tx.toBroadcastFormat();

      const tx2 = Transaction.fromHex(hex);
      tx2.txData.version.should.equal(tx.txData.version);
      tx2.txData.inputs.length.should.equal(tx.txData.inputs.length);
      tx2.txData.outputs.length.should.equal(tx.txData.outputs.length);
      tx2.txData.inputs[0].previousOutpoint.transactionId.should.equal(
        tx.txData.inputs[0].previousOutpoint.transactionId
      );
      tx2.txData.outputs[0].value.should.equal(tx.txData.outputs[0].value);
      tx2.txData.subnetworkId.should.equal(tx.txData.subnetworkId);
    });
  });

  describe('transactionId', () => {
    it('should compute a 32-byte (64 hex char) transaction ID', () => {
      const data = buildBasicTxData();
      const tx = new Transaction(data);
      const txId = tx.transactionId();
      txId.length.should.equal(64);
      /^[0-9a-f]{64}$/.test(txId).should.be.true();
    });

    it('should produce deterministic transaction IDs', () => {
      const data = buildBasicTxData();
      const tx1 = new Transaction(data);
      const tx2 = new Transaction(data);
      tx1.transactionId().should.equal(tx2.transactionId());
    });

    it('should produce different IDs for different transactions', () => {
      const data1 = buildBasicTxData();
      const data2 = buildBasicTxData();
      data2.outputs![0].value = BigInt('60000000');
      const tx1 = new Transaction(data1);
      const tx2 = new Transaction(data2);
      tx1.transactionId().should.not.equal(tx2.transactionId());
    });
  });

  describe('computeSighash', () => {
    it('should compute sighash when UTXO entries are provided', () => {
      const data = buildBasicTxData();
      data.utxoEntries = [TEST_UTXO];
      const tx = new Transaction(data);
      const sighash = tx.computeSighash(0);
      sighash.length.should.equal(32);
    });

    it('should throw when UTXO entries are missing', () => {
      const data = buildBasicTxData();
      const tx = new Transaction(data);
      should.throws(() => tx.computeSighash(0), /UTXO entries required/);
    });

    it('should produce different sighashes for different inputs', () => {
      const data = buildBasicTxData();
      // Add second input
      data.inputs!.push({
        previousOutpoint: {
          transactionId: 'ff' + 'aa'.repeat(31),
          index: 1,
        },
        signatureScript: '',
        sequence: DEFAULT_SEQUENCE,
        sigOpCount: 1,
      });
      const utxo2 = { ...TEST_UTXO, index: 1, transactionId: 'ff' + 'aa'.repeat(31) };
      data.utxoEntries = [TEST_UTXO, utxo2];
      const tx = new Transaction(data);
      const sig0 = tx.computeSighash(0);
      const sig1 = tx.computeSighash(1);
      sig0.toString('hex').should.not.equal(sig1.toString('hex'));
    });
  });

  describe('explainTransaction', () => {
    it('should explain a basic transaction', () => {
      const data = buildBasicTxData();
      const tx = new Transaction(data);
      const explained = tx.explainTransaction();
      explained.outputs.length.should.equal(1);
      explained.outputAmount.should.equal('50000000');
    });
  });
});
