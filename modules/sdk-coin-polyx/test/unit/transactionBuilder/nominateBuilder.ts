import { decode } from '@substrate/txwrapper-polkadot';
import { coins } from '@bitgo/statics';
import should from 'should';
import { TransactionBuilderFactory, NominateBuilder, BatchBuilder, PolyxTransaction } from '../../../src/lib';
import { TransactionType } from '@bitgo/sdk-core';
import utils from '../../../src/lib/utils';
import { accounts, nominateTx, nominateValidators, stakingTx } from '../../resources';

describe('Polyx Nominate Builder', function () {
  let builder: NominateBuilder;
  const factory = new TransactionBuilderFactory(coins.get('tpolyx'));

  const senderAddress = accounts.account1.address;
  const validatorAddress = nominateValidators[0];
  const validatorAddress2 = nominateValidators[1];

  beforeEach(() => {
    builder = factory.getNominateBuilder();
  });

  describe('transaction type', () => {
    it('should return StakingVote transaction type', () => {
      should.equal(builder['transactionType'], TransactionType.StakingVote);
    });
  });

  describe('validators setter validation', () => {
    it('should reject empty validators array', () => {
      should.throws(() => builder.validators([]), /at least 1/);
    });

    it('should reject more than 16 validators', () => {
      const tooMany = Array(17).fill(validatorAddress);
      should.throws(() => builder.validators(tooMany), /at most 16/);
    });

    it('should reject malformed validator addresses', () => {
      should.throws(() => builder.validators(['not-a-valid-address']), /is not a well-formed/);
    });

    it('should accept valid single validator', () => {
      should.doesNotThrow(() => builder.validators([validatorAddress]));
      should.deepEqual(builder.getValidators(), [validatorAddress]);
    });

    it('should accept multiple valid validators', () => {
      should.doesNotThrow(() => builder.validators([validatorAddress, validatorAddress2]));
      should.deepEqual(builder.getValidators(), [validatorAddress, validatorAddress2]);
    });

    it('should accept exactly 16 validators', () => {
      const exactly16 = Array(16).fill(validatorAddress);
      should.doesNotThrow(() => builder.validators(exactly16));
    });
  });

  describe('build unsigned nominate transaction', () => {
    it('should build an unsigned nominate transaction', async () => {
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      builder
        .validators([validatorAddress, validatorAddress2])
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 15 })
        .fee({ amount: 0, type: 'tip' })
        .material(material);

      const tx = await builder.build();
      should.exist(tx);
      should.equal(tx.type, TransactionType.StakingVote);
    });
  });

  describe('build signed nominate transaction', () => {
    it('should parse a signed nominate transaction from hex', () => {
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      const signedBuilder = factory.getNominateBuilder();
      signedBuilder.material(material);
      signedBuilder.from(nominateTx.signed);

      const validators = signedBuilder.getValidators();
      should.exist(validators);
      validators.length.should.be.greaterThan(0);
    });
  });

  describe('validateDecodedTransaction', () => {
    it('should reject non-nominate method name', () => {
      const mockDecoded = {
        method: { name: 'bond', pallet: 'staking', args: {} },
      };
      should.throws(() => builder.validateDecodedTransaction(mockDecoded as never), /Invalid transaction type/);
    });

    it('should validate a real built nominate transaction', () => {
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      builder
        .validators([validatorAddress, validatorAddress2])
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 15 })
        .fee({ amount: 0, type: 'tip' })
        .material(material);

      const unsignedTx = builder['buildTransaction']();
      const decodedTx = decode(unsignedTx, {
        metadataRpc: material.metadata,
        registry: builder['_registry'],
      });

      should.equal(decodedTx.method.name, 'nominate');
      should.doesNotThrow(() => builder.validateDecodedTransaction(decodedTx));
    });
  });

  describe('parse from raw signed transaction', () => {
    it('should parse signed nominate tx and recover validators', () => {
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      const newBuilder = factory.getNominateBuilder();
      newBuilder.material(material);
      newBuilder.from(nominateTx.signed);

      const validators = newBuilder.getValidators();
      should.exist(validators);
      validators.length.should.be.greaterThan(0);
    });
  });

  describe('parse from raw unsigned transaction', () => {
    it('should parse unsigned nominate tx and recover validators', async () => {
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      // Build a real unsigned tx first, then parse it back
      const originalBuilder = factory.getNominateBuilder();
      originalBuilder
        .validators([validatorAddress, validatorAddress2])
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 15 })
        .fee({ amount: 0, type: 'tip' })
        .material(material);

      const tx = await originalBuilder.build();
      const rawHex = tx.toBroadcastFormat();

      const newBuilder = factory.getNominateBuilder();
      newBuilder.material(material);
      newBuilder.from(rawHex);

      const validators = newBuilder.getValidators();
      should.exist(validators);
      should.deepEqual(validators, [validatorAddress, validatorAddress2]);
    });
  });

  describe('round-trip', () => {
    it('should rebuild from serialized unsigned transaction and preserve validators', async () => {
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      const originalBuilder = factory.getNominateBuilder();
      originalBuilder
        .validators([validatorAddress, validatorAddress2])
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 15 })
        .fee({ amount: 0, type: 'tip' })
        .material(material);

      const tx = await originalBuilder.build();
      const rawHex = tx.toBroadcastFormat();

      const rebuiltBuilder = factory.getNominateBuilder();
      rebuiltBuilder.material(material);
      rebuiltBuilder.from(rawHex);

      should.deepEqual(rebuiltBuilder.getValidators(), [validatorAddress, validatorAddress2]);
    });
  });

  describe('signablePayload (Substrate 256-byte blake2 rule)', () => {
    const buildNominateTx = async (validators: string[]) => {
      const material = utils.getMaterial(coins.get('tpolyx').network.type);
      const nominateBuilder = factory.getNominateBuilder();
      nominateBuilder
        .validators(validators)
        .sender({ address: senderAddress })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 15 })
        .fee({ amount: 0, type: 'tip' })
        .material(material);
      return (await nominateBuilder.build()) as PolyxTransaction;
    };

    it('should return raw payload bytes when the extrinsic is at most 256 bytes', async () => {
      const tx = await buildNominateTx([validatorAddress, validatorAddress2]);
      const signablePayload = tx.signablePayload;
      // small nominate extrinsic stays under the 256-byte threshold, so it is signed as-is
      signablePayload.length.should.be.belowOrEqual(256);
      signablePayload.length.should.not.equal(32);
      // for a sub-256-byte payload, signablePayload is exactly the raw extrinsic payload
      const rawExtrinsicPayload = Buffer.from(tx.rawExtrinsicPayload);
      rawExtrinsicPayload.should.deepEqual(signablePayload);
      // toJson surfaces the full raw payload as rawSignableHex even when it equals signablePayload
      should.equal(tx.toJson().rawSignableHex, rawExtrinsicPayload.toString('hex'));
    });

    it('should return the 32-byte blake2_256 hash when the extrinsic exceeds 256 bytes', async () => {
      // Each nominate target adds a 33-byte MultiAddress (1-byte variant + 32-byte account id) on
      // top of 79 bytes of fixed signing-payload overhead (call index, era, nonce, tip,
      // spec/transaction versions, genesis + block hash). So 5 targets stay raw at 244 bytes and
      // 6 already cross to 277 bytes (hashed). 8 would also exceed the threshold; this uses 9 to
      // mirror the multi-nomination scenario from SI-926 with margin (376 bytes).
      const manyValidators = Array(9).fill(validatorAddress);
      const tx = await buildNominateTx(manyValidators);
      const signablePayload = tx.signablePayload;
      should.equal(signablePayload.length, 32);
      // the raw extrinsic payload stays full-length and diverges from the hashed signablePayload
      const rawExtrinsicPayload = Buffer.from(tx.rawExtrinsicPayload);
      rawExtrinsicPayload.length.should.be.greaterThan(256);
      rawExtrinsicPayload.should.not.deepEqual(signablePayload);
      // signablePayload is the blake2_256 hash of the raw extrinsic payload
      utils.getSubstrateSigningBytes(tx.rawExtrinsicPayload).should.deepEqual(signablePayload);
      // toJson surfaces the full raw payload as rawSignableHex for the HSM signing path
      should.equal(tx.toJson().rawSignableHex, rawExtrinsicPayload.toString('hex'));
    });

    // The 256-byte boundary is impractical to hit with a real extrinsic, so exercise the
    // raw-vs-hash decision directly through the shared Substrate signing-bytes helper.
    it('should keep payloads of exactly 256 bytes raw and only hash strictly larger ones', () => {
      const at = utils.getSubstrateSigningBytes(new Uint8Array(256).fill(7));
      should.equal(at.length, 256);
      at.should.deepEqual(Buffer.alloc(256, 7));

      const below = utils.getSubstrateSigningBytes(new Uint8Array(255).fill(7));
      should.equal(below.length, 255);

      const above = utils.getSubstrateSigningBytes(new Uint8Array(257).fill(7));
      should.equal(above.length, 32);
    });
  });

  describe('factory routing', () => {
    it('should route raw nominate extrinsic to NominateBuilder', () => {
      const resolvedBuilder = factory.from(nominateTx.signed);
      should.ok(resolvedBuilder instanceof NominateBuilder, 'expected NominateBuilder');
    });

    it('should route batchAll bond+nominate to BatchBuilder', () => {
      const resolvedBuilder = factory.from(stakingTx.batch.bondAndNominate.signed);
      should.ok(resolvedBuilder instanceof BatchBuilder, 'expected BatchBuilder');
    });
  });
});
