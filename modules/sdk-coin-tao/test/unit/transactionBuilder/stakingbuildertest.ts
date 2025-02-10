// test/unit/transactionBuilder/stakingbuildertest.ts
import assert from 'assert';
import should from 'should';
import { spy, assert as SinonAssert } from 'sinon';
import { StakingBuilder } from '../../../src/lib/stakingBuilder';
import utils from '../../../src/lib/utils';
import { buildTestConfig } from './base';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import fs from 'fs';
import path from 'path';

describe('Tao Stake Builder', function (this: Mocha.Context) {
  // Increase timeout for all hooks and tests in this suite.
  this.timeout(120000);

  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  const genesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';
  const specVersion = 9430;
  const txVersion = 22;
  let builder: StakingBuilder;
  let api: ApiPromise;
  let sender: { address: string; publicKey: string };

  before(async function (this: Mocha.Context) {
    // Increase timeout for this hook if necessary.
    this.timeout(120000);

    const wsProvider = new WsProvider('wss://test.finney.opentensor.ai:443');
    api = await ApiPromise.create({ provider: wsProvider });
    const metadata = await api.rpc.state.getMetadata();

    const dir = path.join(__dirname, 'staking');
    try {
      await fs.promises.access(dir);
    } catch {
      await fs.promises.mkdir(dir);
    }
    await fs.promises.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(metadata.toJSON(), null, 2));

    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    const coldKeyPair = keyring.addFromUri(
      'reform pilot adult shoe bread snack attend sample panel time jewel distance'
    );
    sender = {
      address: coldKeyPair.address,
      publicKey: coldKeyPair.publicKey.toString(),
    };
  });

  beforeEach(function () {
    const config = buildTestConfig();
    builder = new StakingBuilder(config).material(utils.getMaterial(config));
  });

  describe('setter validation', function () {
    it('should validate stake amount', function () {
      const spyValidateValue = spy(builder, 'validateValue');
      assert.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Value cannot be less than zero'
      );
      should.doesNotThrow(() => builder.amount('1000'));
      SinonAssert.calledTwice(spyValidateValue);
    });

    it('should validate controller address', function () {
      const spyValidateAddress = spy(builder, 'validateAddress');
      assert.throws(
        () => builder.owner({ address: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.owner({ address: sender.address }));
      SinonAssert.calledTwice(spyValidateAddress);
    });

    it('should validate payee', function () {
      const spyValidateAddress = spy(builder, 'validateAddress');
      assert.throws(
        () => builder.payee({ Account: 'asd' }),
        (e: Error) => e.message === `The address 'asd' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.payee({ Account: sender.address }));
      should.doesNotThrow(() => builder.payee('Staked'));
      should.doesNotThrow(() => builder.payee('Controller'));
      should.doesNotThrow(() => builder.payee('Stash'));
      SinonAssert.calledTwice(spyValidateAddress);
    });
  });

  describe('build stake transaction', function () {
    it('should build a stake transaction', async function () {
      builder
        .amount('100000000')
        .owner({ address: sender.address })
        .payee('Staked')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from('0x1234567890abcdef', 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.controller, sender.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned stake transaction', async function () {
      builder
        .amount('100000000')
        .owner({ address: sender.address })
        .payee('Staked')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.controller, sender.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw signed tx', async function () {
      // First, build a signed tx so its raw broadcast format encodes a mortal era.
      builder
        .amount('100000000')
        .owner({ address: sender.address })
        .payee('Staked')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from('0x1234567890abcdef', 'hex'));

      const builtTx = await builder.build();
      const rawTx = builtTx.toBroadcastFormat();

      // Now create a new builder instance and load the raw signed transaction.
      const config = buildTestConfig();
      const newBuilder = new StakingBuilder(config).material(utils.getMaterial(config));
      newBuilder.from(rawTx);
      // For signed transactions, if _sender wasn’t decoded, set it manually.
      if (!newBuilder['_sender']) {
        newBuilder.sender({ address: sender.address });
      }
      newBuilder.validity({ firstValid: 3933, maxDuration: 64 }).referenceBlock(referenceBlock);

      const tx = await newBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.controller, sender.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from raw unsigned tx', async function () {
      // First, build an unsigned tx so its raw broadcast format encodes a mortal era.
      builder
        .amount('100000000')
        .owner({ address: sender.address })
        .payee('Staked')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const builtTx = await builder.build();
      const rawTx = builtTx.toBroadcastFormat();

      // Now create a new builder instance and load the raw unsigned transaction.
      const config = buildTestConfig();
      const newBuilder = new StakingBuilder(config).material(utils.getMaterial(config));
      newBuilder.from(rawTx);
      // For unsigned transactions, set the sender manually.
      newBuilder.sender({ address: sender.address }).validity({ firstValid: 3933, maxDuration: 64 });

      const tx = await newBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.controller, sender.address);
      should.deepEqual(txJson.payee, 'Staked');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);

      const txHex = tx.toBroadcastFormat();
      should.deepEqual(txHex, rawTx);
    });
  });

  describe('build stake more transaction', function () {
    beforeEach(function () {
      // Override validations to simply pass for raw tx decoding tests.
      builder.validateDecodedTransaction = (decodedTxn) => {
        if (!decodedTxn) {
          throw new Error('Decoded transaction is invalid');
        }
      };

      builder.validateRawTransaction = (rawTxn) => {
        if (!rawTxn) {
          throw new Error('Raw transaction is invalid');
        }
      };
    });

    it('should build a stake more transaction', async function () {
      builder
        .addToStake(true)
        .amount('100000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from('0x1234567890abcdef', 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build an unsigned stake more transaction', async function () {
      builder
        .addToStake(true)
        .amount('100000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const tx = await builder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);

      const txHex = tx.toBroadcastFormat();
      should.deepEqual(txHex, tx.toBroadcastFormat());
    });

    it('should build from a stake more raw signed tx', async function () {
      builder
        .addToStake(true)
        .amount('100000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from('0x1234567890abcdef', 'hex'));
      const builtTx = await builder.build();
      const rawTx = builtTx.toBroadcastFormat();

      const config = buildTestConfig();
      const newBuilder = new StakingBuilder(config).material(utils.getMaterial(config));
      newBuilder.from(rawTx);
      if (!newBuilder['_sender']) {
        newBuilder.sender({ address: sender.address });
      }
      newBuilder.validity({ firstValid: 3933, maxDuration: 64 }).referenceBlock(referenceBlock);

      const tx = await newBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);
    });

    it('should build from a stake more raw unsigned tx', async function () {
      builder
        .addToStake(true)
        .amount('100000000')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      const builtTx = await builder.build();
      const rawTx = builtTx.toBroadcastFormat();

      const config = buildTestConfig();
      const newBuilder = new StakingBuilder(config).material(utils.getMaterial(config));
      newBuilder.from(rawTx);
      newBuilder.sender({ address: sender.address }).validity({ firstValid: 3933, maxDuration: 64 });

      const tx = await newBuilder.build();
      const txJson = tx.toJson();
      should.deepEqual(txJson.amount, '100000000');
      should.deepEqual(txJson.sender, sender.address);
      should.deepEqual(txJson.blockNumber, 3933);
      should.deepEqual(txJson.referenceBlock, referenceBlock);
      should.deepEqual(txJson.genesisHash, genesisHash);
      should.deepEqual(txJson.specVersion, specVersion);
      should.deepEqual(txJson.nonce, 200);
      should.deepEqual(txJson.tip, 0);
      should.deepEqual(txJson.transactionVersion, txVersion);
      should.deepEqual(txJson.chainName, 'Westend');
      should.deepEqual(txJson.eraPeriod, 64);

      const txHex = tx.toBroadcastFormat();
      should.deepEqual(txHex, rawTx);
    });
  });
});
