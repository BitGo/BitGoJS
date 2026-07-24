import { decode } from '@substrate/txwrapper-polkadot';
import { coins } from '@bitgo/statics';
import should from 'should';
import {
  TransactionBuilderFactory,
  V8BatchStakingBuilder,
  V8BondExtraBuilder,
  V8UnbondBuilder,
  V8BatchUnstakingBuilder,
  V8WithdrawUnbondedBuilder,
  V8NominateBuilder,
  SingletonRegistry,
  Interface,
} from '../../../src/lib';
import { BatchArgs, NominateArgs, V8BondArgs } from '../../../src/lib/iface';
import utils from '../../../src/lib/utils';
import { testnetV8Material, mainnetV8Material } from '../../../src/resources';
import { stakingTxV8 } from '../../resources';
import { buildTestConfig, buildMainnetConfig } from './base';

describe('V8BatchStakingBuilder', function () {
  const factory = new TransactionBuilderFactory(coins.get('tpolyx'));

  const { stash, validator, bondAmount, referenceBlock, nonce, firstValid } = stakingTxV8.sandbox;

  const buildSandboxBatch = () =>
    new V8BatchStakingBuilder(buildTestConfig())
      .amount(bondAmount)
      .payee('Staked')
      .validators([validator])
      .sender({ address: stash })
      .validity({ firstValid, maxDuration: 64 })
      .referenceBlock(referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: nonce });

  describe('v8 material', () => {
    it('testnet builder uses v8 specVersion and txVersion', () => {
      const builder = new V8BatchStakingBuilder(buildTestConfig());
      const material = (builder as any)._material;
      should.equal(material.specVersion, testnetV8Material.specVersion);
      should.equal(material.txVersion, testnetV8Material.txVersion);
      should.equal(material.specVersion, 8000000);
    });

    it('mainnet builder uses v8 specVersion and txVersion', () => {
      const builder = new V8BatchStakingBuilder(buildMainnetConfig());
      const material = (builder as any)._material;
      should.equal(material.specVersion, mainnetV8Material.specVersion);
      should.equal(material.txVersion, mainnetV8Material.txVersion);
    });
  });

  describe('factory method', () => {
    it('getV8BatchStakingBuilder returns a V8BatchStakingBuilder carrying v8 material', () => {
      const builder = factory.getV8BatchStakingBuilder();
      should.ok(builder instanceof V8BatchStakingBuilder);
      should.equal((builder as any)._material.specVersion, testnetV8Material.specVersion);
    });
  });

  describe('setter validation', () => {
    it('should not expose a controller setter', () => {
      const builder = factory.getV8BatchStakingBuilder();
      should.equal(typeof (builder as any).controller, 'undefined');
      should.equal(typeof (builder as any).getController, 'undefined');
    });

    it('should require both bond and nominate operations', () => {
      let builder = factory.getV8BatchStakingBuilder();
      builder.amount(bondAmount).payee('Staked');
      should.throws(() => builder.testValidateFields(), /must include both bond and nominate operations/);

      builder = factory.getV8BatchStakingBuilder();
      builder.validators([validator]);
      should.throws(() => builder.testValidateFields(), /must include both bond and nominate operations/);

      builder = factory.getV8BatchStakingBuilder();
      builder.amount(bondAmount).payee('Staked').validators([validator]);
      should.doesNotThrow(() => builder.testValidateFields());
    });
  });

  describe('build transaction', () => {
    it('builds batchAll([bond, nominate]) with v8 specVersion and no controller', async () => {
      const tx = await buildSandboxBatch().build();
      const txJson = tx.toJson();
      should.equal(txJson.specVersion, 8000000);
      should.equal(txJson.specVersion, testnetV8Material.specVersion);
      should.equal(txJson.transactionVersion, testnetV8Material.txVersion);
    });

    it('inner bond leg + full batch method hex matches the testnet sandbox', async () => {
      const tx = await buildSandboxBatch().build();
      const methodHex = (tx as any)._substrateTransaction.method as string;
      // Full utility.batchAll method hex is byte-for-byte identical to the on-chain sandbox tx.
      should.equal(methodHex, stakingTxV8.batch.bondAndNominate.callHex);
    });

    it('decodes with v8 material to bond({ value, payee }) — no controller — and nominate', async () => {
      const tx = await buildSandboxBatch().build();
      const material = utils.getV8Material(coins.get('tpolyx').network.type);
      const registry = SingletonRegistry.getInstance(material);
      const decodedTx = decode(tx.toBroadcastFormat(), {
        metadataRpc: material.metadata,
        registry,
      });

      should.equal(decodedTx.method.name, 'batchAll');
      should.equal(decodedTx.method.pallet, 'utility');

      const batchArgs = decodedTx.method.args as unknown as BatchArgs;
      should.equal(batchArgs.calls.length, 2);

      const firstCall = batchArgs.calls[0];
      should.equal(utils.decodeMethodName(firstCall, registry), 'bond');
      const bondArgs = firstCall.args as unknown as V8BondArgs & { controller?: unknown };
      const bondValue = typeof bondArgs.value === 'string' ? bondArgs.value : (bondArgs.value as number).toString();
      should.equal(bondValue, bondAmount);
      should.equal(bondArgs.controller, undefined);

      const secondCall = batchArgs.calls[1];
      should.equal(utils.decodeMethodName(secondCall, registry), 'nominate');
      const nominateArgs = secondCall.args as unknown as NominateArgs;
      const targets = nominateArgs.targets.map((t) => (typeof t === 'string' ? t : (t as { id: string }).id));
      should.deepEqual(targets, [validator]);
    });
  });

  describe('validateDecodedTransaction', () => {
    it('accepts a decoded v8 batch bond+nominate transaction', async () => {
      const builder = buildSandboxBatch();
      const tx = await builder.build();
      const material = utils.getV8Material(coins.get('tpolyx').network.type);
      const registry = SingletonRegistry.getInstance(material);
      const decodedTx = decode(tx.toBroadcastFormat(), { metadataRpc: material.metadata, registry });
      should.doesNotThrow(() => builder.validateDecodedTransaction(decodedTx));
    });

    it('validates v8 bond args without a controller field', () => {
      const builder = factory.getV8BatchStakingBuilder();
      should.doesNotThrow(() => builder.testValidateBondArgs({ value: bondAmount, payee: 'Staked' } as V8BondArgs));
    });
  });

  describe('from raw transaction', () => {
    it('round-trips a v8 batch transaction through the builder', async () => {
      const rawTxHex = (await buildSandboxBatch().build()).toBroadcastFormat();

      const newBuilder = factory.getV8BatchStakingBuilder();
      newBuilder.from(rawTxHex);

      should.equal(newBuilder.getAmount(), bondAmount);
      should.equal(newBuilder.getPayee(), 'Staked');
      should.deepEqual(newBuilder.getValidators(), [validator]);
    });

    it('factory.from routes a v8 batch bond+nominate transaction to V8BatchStakingBuilder', async () => {
      const rawTxHex = (await buildSandboxBatch().build()).toBroadcastFormat();
      const builder = factory.from(rawTxHex);
      should.ok(builder instanceof V8BatchStakingBuilder);
    });

    it('factory.from routes to V8BatchStakingBuilder on the v8 decode-success path (SI-981)', async () => {
      // Reproduces the staging incident: when the factory carries v8 material, `decode()` succeeds
      // and yields a bond call with no `controller`. Routing must detect the missing controller and
      // return the v8 builder rather than the v7 BatchStakingBuilder, which crashes reading
      // `args.controller.id`.
      const rawTxHex = (await buildSandboxBatch().build()).toBroadcastFormat();
      const v8Material = utils.getV8Material(coins.get('tpolyx').network.type);
      const v8Factory = new TransactionBuilderFactory(coins.get('tpolyx')).material(v8Material);
      const builder = v8Factory.from(rawTxHex);
      should.ok(builder instanceof V8BatchStakingBuilder);
    });

    it('factory.material(liveMaterial).from(...) forwards the live material into the rebuilt v8 batch staking builder (SI-1034)', async () => {
      // Reproduces the custodial staking incident: the HSM signs against LIVE chain material
      // (e.g. a specVersion bump after a runtime upgrade), but wallet-platform's getSignedTx
      // re-verifies by calling `factory.material(liveMaterial).from(serializedTxHex)`. On the
      // decode-success path, `getBuilder()` used to return `getV8BatchStakingBuilder()` without
      // forwarding `this._material`, so the rebuild silently fell back to the builder's static
      // `getV8Material()` (stale specVersion) instead of the caller's live material. Because
      // specVersion is embedded in the raw ExtrinsicPayload bytes that are actually signed, the
      // rebuilt signable payload would then diverge from the one the HSM signed, producing
      // `InvalidSignature: invalid key signature` at Trust approval.
      //
      // Simulate a "live" chain that has moved past the pinned static testnet v8 material by
      // bumping specVersion on a copy of it.
      const liveMaterial = {
        ...testnetV8Material,
        specVersion: testnetV8Material.specVersion + 10,
      } as unknown as Interface.Material;

      const originalTx = await new V8BatchStakingBuilder(buildTestConfig())
        .material(liveMaterial)
        .amount(bondAmount)
        .payee('Staked')
        .validators([validator])
        .sender({ address: stash })
        .validity({ firstValid, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: nonce })
        .build();
      const rawTxHex = originalTx.toBroadcastFormat();
      const originalSignablePayload = originalTx.signablePayload.toString('hex');

      const rebuiltBuilder = new TransactionBuilderFactory(coins.get('tpolyx')).material(liveMaterial).from(rawTxHex);
      // The raw signing payload does not carry the sender address or the raw `firstValid` block
      // number (only the encoded era), so — like any real caller re-verifying a decoded
      // transaction — they must be supplied again before build() can run.
      (rebuiltBuilder as V8BatchStakingBuilder).sender({ address: stash }).validity({ firstValid, maxDuration: 64 });
      const rebuiltTx = await rebuiltBuilder.build();
      const rebuiltSignablePayload = rebuiltTx.signablePayload.toString('hex');

      // Without the SI-1034 fix, this fails: the rebuild uses the static material (specVersion
      // 8000000) instead of liveMaterial (specVersion 8000010), so the payloads differ.
      should.equal(rebuiltSignablePayload, originalSignablePayload);
    });
  });
});

describe('V8 staking wrappers (smoke build)', function () {
  const factory = new TransactionBuilderFactory(coins.get('tpolyx'));
  const validator = stakingTxV8.sandbox.validator;
  const sender = stakingTxV8.sandbox.stash;
  const referenceBlock = stakingTxV8.sandbox.referenceBlock;

  const replay = { firstValid: 24829132, maxDuration: 64 };

  it('V8BondExtraBuilder builds with v8 material', async () => {
    const builder = factory.getV8BondExtraBuilder();
    should.ok(builder instanceof V8BondExtraBuilder);
    const tx = await builder
      .amount('10000000')
      .sender({ address: sender })
      .validity(replay)
      .referenceBlock(referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 189 })
      .build();
    should.equal(tx.toJson().specVersion, testnetV8Material.specVersion);
  });

  it('V8UnbondBuilder builds with v8 material', async () => {
    const builder = factory.getV8UnbondBuilder();
    should.ok(builder instanceof V8UnbondBuilder);
    const tx = await builder
      .amount('10000000')
      .sender({ address: sender })
      .validity(replay)
      .referenceBlock(referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 189 })
      .build();
    should.equal(tx.toJson().specVersion, testnetV8Material.specVersion);
  });

  it('V8BatchUnstakingBuilder builds with v8 material', async () => {
    const builder = factory.getV8BatchUnstakingBuilder();
    should.ok(builder instanceof V8BatchUnstakingBuilder);
    const tx = await builder
      .amount('10000000')
      .sender({ address: sender })
      .validity(replay)
      .referenceBlock(referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 189 })
      .build();
    should.equal(tx.toJson().specVersion, testnetV8Material.specVersion);
  });

  it('V8WithdrawUnbondedBuilder builds with v8 material', async () => {
    const builder = factory.getV8WithdrawUnbondedBuilder();
    should.ok(builder instanceof V8WithdrawUnbondedBuilder);
    const tx = await builder
      .slashingSpans(0)
      .sender({ address: sender })
      .validity(replay)
      .referenceBlock(referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 189 })
      .build();
    should.equal(tx.toJson().specVersion, testnetV8Material.specVersion);
  });

  it('V8NominateBuilder builds with v8 material', async () => {
    const builder = factory.getV8NominateBuilder();
    should.ok(builder instanceof V8NominateBuilder);
    const tx = await builder
      .validators([validator])
      .sender({ address: sender })
      .validity(replay)
      .referenceBlock(referenceBlock)
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 189 })
      .build();
    should.equal(tx.toJson().specVersion, testnetV8Material.specVersion);
  });
});
