import assert from 'assert';
import { coins } from '@bitgo/statics';
import { Transaction } from '../../src/lib/transaction';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';
import { DEFAULT_FEE } from '../../src/lib/constants';
import { ADDRESSES, UTXOS } from '../fixtures/kaspa.fixtures';

const coinConfig = coins.get('kaspa');

describe('Kaspa TransactionBuilder', function () {
  let builder: TransactionBuilder;

  beforeEach(function () {
    builder = new TransactionBuilder(coinConfig);
  });

  describe('sender', function () {
    it('should set the sender address and return this (fluent)', function () {
      const result = builder.sender(ADDRESSES.sender);
      assert.equal(result, builder);
    });

    it('should throw on invalid sender address', function () {
      assert.throws(() => {
        builder.sender(ADDRESSES.invalid);
      }, /Invalid Kaspa address/);
    });
  });

  describe('to', function () {
    it('should add an output and return this (fluent)', function () {
      const result = builder.to(ADDRESSES.recipient, '1000');
      assert.equal(result, builder);
    });

    it('should throw on invalid recipient address', function () {
      assert.throws(() => {
        builder.to('notanaddress', '1000');
      }, /Invalid Kaspa/);
    });
  });

  describe('fee', function () {
    it('should set the fee and return this', function () {
      const result = builder.fee('5000');
      assert.equal(result, builder);
    });

    it('should default to DEFAULT_FEE', async function () {
      builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000');
      const tx = (await builder.build()) as Transaction;
      assert.equal(tx.txData.fee, DEFAULT_FEE);
    });
  });

  describe('addInput', function () {
    it('should add a UTXO input and return this', function () {
      const result = builder.addInput(UTXOS.simple);
      assert.equal(result, builder);
    });

    it('should throw when transactionId is missing', function () {
      assert.throws(() => {
        builder.addInput({ ...UTXOS.simple, transactionId: '' });
      }, /Invalid UTXO/);
    });

    it('should throw when transactionIndex is undefined', function () {
      assert.throws(() => {
        builder.addInput({ ...UTXOS.simple, transactionIndex: undefined as unknown as number });
      }, /Invalid UTXO/);
    });
  });

  describe('addInputs', function () {
    it('should add multiple inputs', function () {
      builder.addInputs([UTXOS.simple, UTXOS.second]);
    });
  });

  describe('validateTransaction', function () {
    it('should throw when no inputs are set', function () {
      builder.to(ADDRESSES.recipient, '1000');
      assert.throws(() => {
        builder.validateTransaction();
      }, /At least one UTXO input/);
    });

    it('should throw when no outputs are set', function () {
      builder.addInput(UTXOS.simple);
      assert.throws(() => {
        builder.validateTransaction();
      }, /At least one output/);
    });

    it('should not throw with valid inputs and outputs', function () {
      builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000');
      assert.doesNotThrow(() => {
        builder.validateTransaction();
      });
    });
  });

  describe('validateAddress', function () {
    it('should not throw for a valid address', function () {
      assert.doesNotThrow(() => {
        builder.validateAddress({ address: ADDRESSES.valid });
      });
    });

    it('should throw for an invalid address', function () {
      assert.throws(() => {
        builder.validateAddress({ address: 'invalid' });
      }, /Invalid Kaspa address/);
    });
  });

  describe('validateRawTransaction', function () {
    it('should not throw for valid hex', async function () {
      builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000');
      const tx = (await builder.build()) as Transaction;
      const hex = tx.toHex();
      assert.doesNotThrow(() => {
        builder.validateRawTransaction(hex);
      });
    });

    it('should throw for invalid hex', function () {
      assert.throws(() => {
        builder.validateRawTransaction('notvalidhex!!');
      }, /Invalid raw Kaspa/);
    });
  });

  describe('validateValue', function () {
    it('should not throw for non-negative value', function () {
      const BigNumber = require('bignumber.js').default ?? require('bignumber.js');
      assert.doesNotThrow(() => {
        builder.validateValue(new BigNumber(0));
      });
      assert.doesNotThrow(() => {
        builder.validateValue(new BigNumber(1000000));
      });
    });

    it('should throw for negative value', function () {
      const BigNumber = require('bignumber.js').default ?? require('bignumber.js');
      assert.throws(() => {
        builder.validateValue(new BigNumber(-1));
      }, /negative/);
    });
  });

  describe('build', function () {
    it('should build a valid transaction from inputs + outputs', async function () {
      builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');
      const tx = (await builder.build()) as Transaction;

      assert.ok(tx instanceof Transaction);
      assert.equal(tx.txData.version, 0);
      assert.equal(tx.txData.inputs.length, 1);
      assert.equal(tx.txData.outputs.length, 1);
      assert.equal(tx.txData.outputs[0].amount, '99998000');
      assert.equal(tx.txData.fee, '2000');
    });

    it('should build a multi-input transaction', async function () {
      builder.addInputs([UTXOS.simple, UTXOS.second]).to(ADDRESSES.recipient, '299998000').fee('2000');
      const tx = (await builder.build()) as Transaction;

      assert.equal(tx.txData.inputs.length, 2);
      assert.equal(tx.txData.outputs.length, 1);
    });

    it('should include all standard fields', async function () {
      builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000');
      const tx = (await builder.build()) as Transaction;

      assert.equal(tx.txData.version, 0);
      assert.equal(tx.txData.lockTime, '0');
      assert.equal(tx.txData.subnetworkId, '0000000000000000000000000000000000000000');
    });
  });

  describe('from (rebuild from hex)', function () {
    it('should reconstruct a builder from a serialized transaction', async function () {
      builder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');
      const tx = (await builder.build()) as Transaction;
      const hex = tx.toHex();

      const newBuilder = new TransactionBuilder(coinConfig);
      newBuilder.from(hex);
      const rebuilt = (await newBuilder.build()) as Transaction;

      assert.deepEqual(rebuilt.toJson(), tx.toJson());
    });
  });
});

describe('Kaspa TransactionBuilderFactory', function () {
  let factory: TransactionBuilderFactory;

  beforeEach(function () {
    factory = new TransactionBuilderFactory(coinConfig);
  });

  describe('getBuilder', function () {
    it('should return a new TransactionBuilder', function () {
      const builder = factory.getBuilder();
      assert.ok(builder instanceof TransactionBuilder);
    });
  });

  describe('from', function () {
    it('should reconstruct a builder from a serialized transaction hex', async function () {
      const originalBuilder = factory.getBuilder();
      originalBuilder.addInput(UTXOS.simple).to(ADDRESSES.recipient, '99998000').fee('2000');
      const tx = (await originalBuilder.build()) as Transaction;
      const hex = tx.toHex();

      const rebuiltBuilder = factory.from(hex);
      const rebuiltTx = (await rebuiltBuilder.build()) as Transaction;

      assert.deepEqual(rebuiltTx.toJson(), tx.toJson());
    });
  });
});
