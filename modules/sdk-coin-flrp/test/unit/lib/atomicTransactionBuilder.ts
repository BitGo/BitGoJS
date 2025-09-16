import { coins } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { Credential, Signature } from '@flarenetwork/flarejs';
import { AtomicTransactionBuilder } from '../../../src/lib/atomicTransactionBuilder';

// Concrete implementation for testing
class TestAtomicTransactionBuilder extends AtomicTransactionBuilder {
  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  // Expose protected method for testing
  public testCreateFlareCredential(credentialId: number, signatures: string[]): Credential {
    return this.createFlareCredential(credentialId, signatures);
  }

  // Expose protected method for testing
  public testValidateCredentials(credentials: Credential[]): void {
    return this.validateCredentials(credentials);
  }

  // Expose protected method for testing
  public testCreateInputOutput(total: bigint) {
    return this.createInputOutput(total);
  }
}

describe('AtomicTransactionBuilder', function () {
  let builder: TestAtomicTransactionBuilder;
  const coinConfig = coins.get('flrp');

  beforeEach(function () {
    builder = new TestAtomicTransactionBuilder(coinConfig);
  });

  describe('constructor', function () {
    it('should create instance with proper coin config', function () {
      assert.ok(builder instanceof AtomicTransactionBuilder);
      assert.strictEqual(builder['_coinConfig'], coinConfig);
    });

    it('should initialize transaction state properly', function () {
      const transaction = builder['transaction'];
      assert.strictEqual(typeof transaction._network, 'object');
      assert.strictEqual(transaction._networkID, 0);
      assert.ok(Array.isArray(transaction._fromAddresses));
      assert.strictEqual(transaction._fromAddresses.length, 0);
      assert.ok(Array.isArray(transaction._to));
      assert.strictEqual(transaction._to.length, 0);
      assert.strictEqual(transaction._locktime, 0n);
      assert.strictEqual(transaction._threshold, 1);
      assert.strictEqual(transaction._fee.fee, '0');
      assert.strictEqual(transaction.hasCredentials, false);
    });
  });

  describe('validateAmount', function () {
    it('should accept positive amounts', function () {
      assert.doesNotThrow(() => builder.validateAmount(1n));
      assert.doesNotThrow(() => builder.validateAmount(100n));
      assert.doesNotThrow(() => builder.validateAmount(BigInt('1000000000000000000')));
    });

    it('should reject zero amount', function () {
      assert.throws(() => builder.validateAmount(0n), BuildTransactionError, 'Amount must be positive');
    });

    it('should reject negative amounts', function () {
      assert.throws(() => builder.validateAmount(-1n), BuildTransactionError, 'Amount must be positive');
      assert.throws(() => builder.validateAmount(-100n), BuildTransactionError, 'Amount must be positive');
    });
  });

  describe('createFlareCredential', function () {
    const validHexSignature = '3045022100' + '0'.repeat(56) + '02200' + '1'.repeat(55);

    it('should create credential with valid signatures', function () {
      const signatures = [validHexSignature, ''];
      const credential = builder.testCreateFlareCredential(0, signatures);

      assert.ok(credential instanceof Credential);
      const sigArray = credential.getSignatures();
      assert.strictEqual(sigArray.length, 2);
    });

    it('should handle empty signatures as placeholders', function () {
      const signatures = ['', ''];
      const credential = builder.testCreateFlareCredential(0, signatures);

      assert.ok(credential instanceof Credential);
      const sigArray = credential.getSignatures();
      assert.strictEqual(sigArray.length, 2);
    });

    it('should handle hex signatures with 0x prefix', function () {
      const signatures = [`0x${validHexSignature}`];
      const credential = builder.testCreateFlareCredential(0, signatures);

      assert.ok(credential instanceof Credential);
      const sigArray = credential.getSignatures();
      assert.strictEqual(sigArray.length, 1);
    });

    it('should throw error for non-array signatures', function () {
      assert.throws(
        () => builder.testCreateFlareCredential(0, 'invalid' as unknown as string[]),
        BuildTransactionError,
        'Signatures must be an array'
      );
    });

    it('should throw error for empty signatures array', function () {
      assert.throws(
        () => builder.testCreateFlareCredential(0, []),
        BuildTransactionError,
        'Signatures array cannot be empty'
      );
    });

    it('should throw error for invalid hex characters', function () {
      const invalidSig = '304502210xyz'; // Contains invalid hex chars
      assert.throws(
        () => builder.testCreateFlareCredential(0, [invalidSig]),
        BuildTransactionError,
        'Invalid hex signature at index 0: contains non-hex characters'
      );
    });

    it('should throw error for signatures that are too long', function () {
      const longSig = 'a'.repeat(200); // 100 bytes, longer than 65
      assert.throws(() => builder.testCreateFlareCredential(0, [longSig]), BuildTransactionError);
    });

    it('should handle signatures shorter than 65 bytes', function () {
      const shortSig = 'abcd1234'; // 4 bytes
      const credential = builder.testCreateFlareCredential(0, [shortSig]);

      assert.ok(credential instanceof Credential);
    });
  });

  describe('validateCredentials', function () {
    it('should accept valid credentials array', function () {
      const credential = new Credential([new Signature(new Uint8Array(65))]);
      assert.doesNotThrow(() => builder.testValidateCredentials([credential]));
    });

    it('should accept empty credentials array', function () {
      assert.doesNotThrow(() => builder.testValidateCredentials([]));
    });

    it('should throw error for non-array input', function () {
      assert.throws(
        () => builder.testValidateCredentials('invalid' as unknown as Credential[]),
        BuildTransactionError,
        'Credentials must be an array'
      );
    });

    it('should throw error for invalid credential objects', function () {
      const invalidCredentials = [{ fake: 'credential' }] as unknown as Credential[];
      assert.throws(
        () => builder.testValidateCredentials(invalidCredentials),
        BuildTransactionError,
        'Invalid credential at index 0'
      );
    });

    it('should throw error for mixed valid/invalid credentials', function () {
      const validCredential = new Credential([new Signature(new Uint8Array(65))]);
      const invalidCredential = { fake: 'credential' };
      const credentials = [validCredential, invalidCredential] as unknown as Credential[];

      assert.throws(
        () => builder.testValidateCredentials(credentials),
        BuildTransactionError,
        'Invalid credential at index 1'
      );
    });
  });

  describe('createInputOutput', function () {
    const sampleUtxos = [
      {
        outputID: 7,
        amount: '1000000',
        txid: '1234567890abcdef1234567890abcdef12345678',
        outputidx: '0',
        threshold: 2,
        addresses: ['P-test1234567890abcdef', 'P-test567890abcdef1234'],
      },
      {
        outputID: 7,
        amount: '500000',
        txid: 'abcdef1234567890abcdef1234567890abcdef12',
        outputidx: '1',
        threshold: 2,
        addresses: ['P-test1234567890abcdef', 'P-test567890abcdef1234'],
      },
    ];

    it('should return empty structure when no UTXOs set', function () {
      assert.throws(() => builder.testCreateInputOutput(100n), /UTXOs are required for creating inputs and outputs/);
    });

    it('should process UTXOs and return structured output', function () {
      // Set UTXOs first
      builder.utxos(sampleUtxos);

      const result = builder.testCreateInputOutput(100000n);

      assert.ok('inputs' in result);
      assert.ok('outputs' in result);
      assert.ok('credentials' in result);

      assert.ok(Array.isArray(result.inputs));
      assert.ok(Array.isArray(result.outputs));
      assert.ok(Array.isArray(result.credentials));
      assert.strictEqual(result.credentials.length, 1); // Should create credential for first UTXO
    });

    it('should handle insufficient funds', function () {
      builder.utxos(sampleUtxos);

      // Request more than available (total available is 1,500,000)
      assert.throws(() => builder.testCreateInputOutput(2000000n), /Insufficient funds: need 2000000, have 1500000/);
    });

    it('should use multiple UTXOs when needed', function () {
      builder.utxos(sampleUtxos);

      // Request amount that requires both UTXOs
      const result = builder.testCreateInputOutput(1200000n);

      assert.strictEqual(result.credentials.length, 2); // Should use both UTXOs
    });
  });

  describe('initBuilder', function () {
    it('should return this for fluent API', function () {
      const result = builder.initBuilder({});
      assert.strictEqual(result, builder);
    });

    it('should handle different transaction objects', function () {
      const tx1 = { id: '123' };
      const tx2 = { data: 'test' };

      assert.strictEqual(builder.initBuilder(tx1), builder);
      assert.strictEqual(builder.initBuilder(tx2), builder);
    });
  });
});
