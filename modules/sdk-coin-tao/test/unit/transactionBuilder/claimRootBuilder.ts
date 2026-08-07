import assert from 'assert';
import should from 'should';
import { spy, assert as SinonAssert } from 'sinon';
import { ClaimRootBuilder } from '../../../src/lib/claimRootBuilder';
import { accounts, mockTssSignature } from '../../resources';
import { buildTestConfig } from './base';
import { testnetMaterialV2 } from '../../../src/resources';
import { InvalidTransactionError } from '@bitgo/sdk-core';

const genesisHash = testnetMaterialV2.genesisHash;
const chainName = testnetMaterialV2.chainName.toLowerCase();

describe('Tao ClaimRoot Builder', function () {
  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  let builder: ClaimRootBuilder;
  const sender = accounts.account1;
  const hotkey = '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT';

  beforeEach(function () {
    const config = buildTestConfig();
    builder = new ClaimRootBuilder(config).material(testnetMaterialV2 as any);
  });

  describe('setter validation', function () {
    it('should validate hotkey address', function () {
      const spyValidateAddress = spy(builder, 'validateAddress');
      assert.throws(
        () => builder.hotkey({ address: 'abc' }),
        (e: Error) => e.message === `The address 'abc' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.hotkey({ address: hotkey }));
      SinonAssert.calledTwice(spyValidateAddress);
    });

    it('should reject empty hotkey address', function () {
      assert.throws(
        () => builder.hotkey({ address: '' }),
        (e: Error) => e.message !== undefined
      );
    });
  });

  describe('build claimRootWithHotkey transaction', function () {
    it('should build an unsigned claimRootWithHotkey transaction', async function () {
      builder
        .hotkey({ address: hotkey })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.should.have.properties([
        'id',
        'sender',
        'referenceBlock',
        'blockNumber',
        'genesisHash',
        'nonce',
        'specVersion',
        'transactionVersion',
        'eraPeriod',
        'chainName',
        'tip',
        'hotkey',
      ]);

      txJson.hotkey.should.equal(hotkey);
      txJson.sender.should.equal(sender.address);
      txJson.blockNumber.should.equal(3933);
      txJson.nonce.should.equal(200);
      txJson.tip.should.equal(0);
      txJson.genesisHash.should.equal(genesisHash);
      txJson.specVersion.should.equal(Number(testnetMaterialV2.specVersion));
      txJson.transactionVersion.should.equal(Number(testnetMaterialV2.txVersion));
      txJson.chainName.toLowerCase().should.equal(chainName);
      txJson.eraPeriod.should.equal(64);
    });

    it('should build a signed claimRootWithHotkey transaction', async function () {
      builder
        .hotkey({ address: hotkey })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.hotkey.should.equal(hotkey);
      txJson.sender.should.equal(sender.address);
      txJson.blockNumber.should.equal(3933);
      txJson.referenceBlock.should.equal(referenceBlock);
      txJson.genesisHash.should.equal(genesisHash);
      txJson.specVersion.should.equal(Number(testnetMaterialV2.specVersion));
      txJson.nonce.should.equal(200);
      txJson.tip.should.equal(0);
      txJson.transactionVersion.should.equal(Number(testnetMaterialV2.txVersion));
      txJson.chainName.toLowerCase().should.equal(chainName);
      txJson.eraPeriod.should.equal(64);
    });

    it('should round-trip: build then parse from raw hex', async function () {
      builder
        .hotkey({ address: hotkey })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const rawHex = tx.toBroadcastFormat();

      const config = buildTestConfig();
      const parsedBuilder = new ClaimRootBuilder(config).material(testnetMaterialV2 as any);
      parsedBuilder.from(rawHex);
      parsedBuilder
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock);

      const parsedTx = await parsedBuilder.build();
      const parsedJson = parsedTx.toJson();

      parsedJson.hotkey.should.equal(hotkey);
      parsedJson.sender.should.equal(sender.address);
    });
  });

  describe('transaction explanation', function () {
    it('should provide correct explanation', async function () {
      builder
        .hotkey({ address: hotkey })
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const explanation = tx.explainTransaction();

      explanation.should.have.properties(['outputAmount', 'changeAmount', 'fee', 'type']);
      explanation.outputAmount.should.equal('0');
      explanation.changeAmount.should.equal('0');
      explanation.fee.type.should.equal('tip');
    });
  });

  describe('validation', function () {
    it('should throw when hotkey is missing', function () {
      // Set sender so base validation passes and hotkey validation is hit
      builder
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      assert.throws(
        () => builder.validateTransaction({} as any),
        (e: Error) => e.message.includes('ClaimRoot Transaction validation failed')
      );
    });

    it('should throw for invalid hotkey in fromImplementation', function () {
      const config = buildTestConfig();
      const testBuilder = new ClaimRootBuilder(config).material(testnetMaterialV2 as any);

      // Simulate a wrong method being set
      (testBuilder as any)._method = {
        name: 'addStake',
        args: {},
        pallet: 'subtensorModule',
      };

      assert.throws(
        () => (testBuilder as any).fromImplementation('0x'),
        (e: Error) => e.message.includes('Expected claimRootWithHotkey')
      );
    });

    it('should not throw when building with valid hotkey', function () {
      should.doesNotThrow(() => {
        builder
          .hotkey({ address: hotkey })
          .sender({ address: sender.address })
          .validity({ firstValid: 3933, maxDuration: 64 })
          .referenceBlock(referenceBlock)
          .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
          .fee({ amount: 0, type: 'tip' });
      });
    });
  });

  describe('invalid transaction type rejection', function () {
    it('should reject a moveStake raw transaction', function () {
      // Build a moveStake tx from another builder to get a valid hex
      const { MoveStakeBuilder } = require('../../../src/lib/moveStakeBuilder');
      const config = buildTestConfig();
      const moveBuilder = new MoveStakeBuilder(config).material(testnetMaterialV2 as any);

      moveBuilder
        .amount('1000000000000')
        .originHotkey({ address: hotkey })
        .destinationHotkey({ address: accounts.account2.address })
        .originNetuid('1')
        .destinationNetuid('2')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      return moveBuilder.build().then((moveTx: any) => {
        const rawHex = moveTx.toBroadcastFormat();
        const claimBuilder = new ClaimRootBuilder(config).material(testnetMaterialV2 as any);
        assert.throws(
          () => claimBuilder.from(rawHex),
          (e: InvalidTransactionError) => e.message.includes('Expected claimRootWithHotkey')
        );
      });
    });
  });
});
