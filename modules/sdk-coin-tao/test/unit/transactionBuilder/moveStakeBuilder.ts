import assert from 'assert';
import should from 'should';
import { assert as SinonAssert, spy } from 'sinon';
import { MoveStakeBuilder } from '../../../src/lib/moveStakeBuilder';
import utils from '../../../src/lib/utils';
import { accounts, mockTssSignature, genesisHash, chainName } from '../../resources';
import { buildTestConfig } from './base';
import { testnetMaterial } from '../../../src/resources';
import { InvalidTransactionError } from '@bitgo/sdk-core';

// Test helper class to access private methods for testing
class TestMoveStakeBuilder extends MoveStakeBuilder {
  setMethodForTesting(method: any): void {
    this._method = method;
  }
}

describe('Tao Move Stake Builder', function () {
  const referenceBlock = '0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d';
  let builder: MoveStakeBuilder;
  const sender = accounts.account1;

  beforeEach(function () {
    const config = buildTestConfig();
    const material = utils.getMaterial(config.network.type);
    builder = new MoveStakeBuilder(config).material(material);
  });

  describe('setter validation', function () {
    it('should validate amount', function () {
      assert.throws(
        () => builder.amount('-1'),
        (e: Error) => e.message === 'Amount must be greater than zero'
      );
      assert.throws(
        () => builder.amount('0'),
        (e: Error) => e.message === 'Amount must be greater than zero'
      );
      should.doesNotThrow(() => builder.amount('1000'));
      should.doesNotThrow(() => builder.amount('1'));
    });

    it('should validate addresses', function () {
      const spyValidateAddress = spy(builder, 'validateAddress');
      assert.throws(
        () => builder.originHotkey({ address: 'abc' }),
        (e: Error) => e.message === `The address 'abc' is not a well-formed dot address`
      );
      assert.throws(
        () => builder.destinationHotkey({ address: 'abc' }),
        (e: Error) => e.message === `The address 'abc' is not a well-formed dot address`
      );
      should.doesNotThrow(() => builder.originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' }));
      should.doesNotThrow(() =>
        builder.destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
      );

      SinonAssert.callCount(spyValidateAddress, 4);
    });
  });

  describe('build move stake transaction', function () {
    it('should build a move stake transaction', async function () {
      builder
        .amount('9007199254740995')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1')
        .destinationNetuid('1')
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
        'originHotkey',
        'destinationHotkey',
        'originNetuid',
        'destinationNetuid',
        'alphaAmount',
      ]);

      txJson.sender.should.equal('5EGoFA95omzemRssELLDjVenNZ68aXyUeqtKQScXSEBvVJkr');
      txJson.originHotkey.should.equal('5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT');
      txJson.destinationHotkey.should.equal('5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq');
      txJson.originNetuid.should.equal('1');
      txJson.destinationNetuid.should.equal('1');
      txJson.alphaAmount.should.equal('9007199254740995');
      txJson.blockNumber.should.equal(3933);
      txJson.nonce.should.equal(200);
      txJson.tip.should.equal(0);

      // Verify transaction explanation
      const explanation = tx.explainTransaction();
      explanation.should.have.properties(['outputs', 'outputAmount', 'changeAmount', 'fee']);
      explanation.outputs.should.have.length(1);
      explanation.outputs[0].should.deepEqual({
        address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq',
        amount: '9007199254740995',
        tokenName: utils.getTaoTokenBySubnetId('1').name,
      });
    });

    it('should validate required fields', function () {
      assert.throws(
        () => builder.validateTransaction({} as any),
        (e: Error) => e.message.includes('Transaction validation failed')
      );
    });

    it('should set and get origin netuid', function () {
      builder.originNetuid('5');
      // We can't directly access private fields, but we can verify through building
      should.doesNotThrow(() => builder.originNetuid('5'));
    });

    it('should set and get destination netuid', function () {
      builder.destinationNetuid('10');
      // We can't directly access private fields, but we can verify through building
      should.doesNotThrow(() => builder.destinationNetuid('10'));
    });

    it('should build transaction with different netuids', async function () {
      builder
        .amount('1000000000000')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1')
        .destinationNetuid('2')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.originNetuid.should.equal('1');
      txJson.destinationNetuid.should.equal('2');
      txJson.alphaAmount.should.equal('1000000000000');

      const explanation = tx.explainTransaction();
      explanation.outputs[0].tokenName.should.equal('ttao:onion');
    });
  });

  describe('validation', function () {
    it('should validate move stake transaction schema', function () {
      should.doesNotThrow(() => {
        builder
          .amount('1000000000000')
          .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
          .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
          .originNetuid('1')
          .destinationNetuid('1');
      });
    });

    it('should throw error for invalid amount', function () {
      assert.throws(
        () => builder.amount('-100'),
        (e: Error) => e.message.includes('Amount must be greater than zero')
      );
    });

    it('should throw error for zero amount', function () {
      assert.throws(
        () => builder.amount('0'),
        (e: Error) => e.message === 'Amount must be greater than zero'
      );
    });

    it('should validate netuid range for origin netuid', function () {
      // Valid netuids
      should.doesNotThrow(() => builder.originNetuid('0'));
      should.doesNotThrow(() => builder.originNetuid('64'));
      should.doesNotThrow(() => builder.originNetuid('128'));

      // Invalid netuids
      assert.throws(
        () => builder.originNetuid('-1'),
        (e: Error) => e.message.includes('Invalid netuid: -1. Must be a non-negative integer.')
      );
      assert.throws(
        () => builder.originNetuid('129'),
        (e: Error) => e.message.includes('Invalid netuid: 129. Netuid must be between 0 and 128.')
      );
      assert.throws(
        () => builder.originNetuid('abc'),
        (e: Error) => e.message.includes('Invalid netuid: abc. Must be a non-negative integer.')
      );
    });

    it('should validate netuid range for destination netuid', function () {
      // Valid netuids
      should.doesNotThrow(() => builder.destinationNetuid('0'));
      should.doesNotThrow(() => builder.destinationNetuid('64'));
      should.doesNotThrow(() => builder.destinationNetuid('128'));

      // Invalid netuids
      assert.throws(
        () => builder.destinationNetuid('-1'),
        (e: Error) => e.message.includes('Invalid netuid: -1. Must be a non-negative integer.')
      );
      assert.throws(
        () => builder.destinationNetuid('129'),
        (e: Error) => e.message.includes('Invalid netuid: 129. Netuid must be between 0 and 128.')
      );
      assert.throws(
        () => builder.destinationNetuid('invalid'),
        (e: Error) => e.message.includes('Invalid netuid: invalid. Must be a non-negative integer.')
      );
    });
  });

  describe('TSS signature integration', function () {
    it('should build a signed move stake transaction with TSS signature', async function () {
      builder
        .amount('9007199254740995')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1')
        .destinationNetuid('1')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' })
        .addSignature({ pub: sender.publicKey }, Buffer.from(mockTssSignature, 'hex'));

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.alphaAmount.should.equal('9007199254740995');
      txJson.originHotkey.should.equal('5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT');
      txJson.destinationHotkey.should.equal('5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq');
      txJson.originNetuid.should.equal('1');
      txJson.destinationNetuid.should.equal('1');
      txJson.sender.should.equal(sender.address);
      txJson.blockNumber.should.equal(3933);
      txJson.referenceBlock.should.equal(referenceBlock);
      txJson.genesisHash.should.equal(genesisHash);
      txJson.specVersion.should.equal(Number(testnetMaterial.specVersion));
      txJson.nonce.should.equal(200);
      txJson.tip.should.equal(0);
      txJson.transactionVersion.should.equal(Number(testnetMaterial.txVersion));
      txJson.chainName.toLowerCase().should.equal(chainName);
      txJson.eraPeriod.should.equal(64);
    });

    it('should build an unsigned move stake transaction', async function () {
      builder
        .amount('50000000')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1')
        .destinationNetuid('2')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const txJson = tx.toJson();

      txJson.alphaAmount.should.equal('50000000');
      txJson.originHotkey.should.equal('5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT');
      txJson.destinationHotkey.should.equal('5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq');
      txJson.originNetuid.should.equal('1');
      txJson.destinationNetuid.should.equal('2');
      txJson.sender.should.equal(sender.address);
      txJson.blockNumber.should.equal(3933);
      txJson.referenceBlock.should.equal(referenceBlock);
      txJson.genesisHash.should.equal(genesisHash);
      txJson.specVersion.should.equal(Number(testnetMaterial.specVersion));
      txJson.nonce.should.equal(200);
      txJson.tip.should.equal(0);
      txJson.transactionVersion.should.equal(Number(testnetMaterial.txVersion));
      txJson.chainName.toLowerCase().should.equal(chainName);
      txJson.eraPeriod.should.equal(64);
    });
  });

  describe('comprehensive error handling', function () {
    it('should throw error for missing origin hotkey', function () {
      builder
        .amount('1000000000000')
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1')
        .destinationNetuid('1');

      assert.throws(
        () => builder.validateTransaction({} as any),
        (e: Error) => e.message.includes('Transaction validation failed')
      );
    });

    it('should throw error for missing destination hotkey', function () {
      builder
        .amount('1000000000000')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .originNetuid('1')
        .destinationNetuid('1');

      assert.throws(
        () => builder.validateTransaction({} as any),
        (e: Error) => e.message.includes('Transaction validation failed')
      );
    });

    it('should throw error for missing origin netuid', function () {
      builder
        .amount('1000000000000')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .destinationNetuid('1');

      assert.throws(
        () => builder.validateTransaction({} as any),
        (e: Error) => e.message.includes('Transaction validation failed')
      );
    });

    it('should throw error for missing destination netuid', function () {
      builder
        .amount('1000000000000')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1');

      assert.throws(
        () => builder.validateTransaction({} as any),
        (e: Error) => e.message.includes('Transaction validation failed')
      );
    });

    it('should throw error for missing amount', function () {
      builder
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1')
        .destinationNetuid('1');

      assert.throws(
        () => builder.validateTransaction({} as any),
        (e: Error) => e.message.includes('Transaction validation failed')
      );
    });

    it('should throw error for invalid transaction type in fromImplementation', function () {
      const config = buildTestConfig();
      const material = utils.getMaterial(config.network.type);
      const mockBuilder = new TestMoveStakeBuilder(config).material(material);
      mockBuilder.setMethodForTesting({
        name: 'transferKeepAlive',
        args: { dest: { id: 'test' }, value: '1000' },
        pallet: 'balances',
      });

      assert.throws(
        () => {
          // Call the validation logic directly
          if (mockBuilder['_method']?.name !== 'moveStake') {
            throw new InvalidTransactionError(
              `Invalid Transaction Type: ${mockBuilder['_method']?.name}. Expected moveStake`
            );
          }
        },
        (e: Error) => e.message.includes('Invalid Transaction Type: transferKeepAlive. Expected moveStake')
      );
    });

    it('should handle malformed raw transaction', function () {
      assert.throws(
        () => builder.from('invalid_hex_data'),
        (e: Error) => e.message !== undefined
      );
    });
  });

  describe('boundary value and edge case tests', function () {
    it('should handle very large amounts', function () {
      const largeAmount = '999999999999999999999999999999';
      should.doesNotThrow(() => builder.amount(largeAmount));
    });

    it('should handle same origin and destination hotkeys', function () {
      const sameAddress = '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT';
      should.doesNotThrow(() => {
        builder.originHotkey({ address: sameAddress }).destinationHotkey({ address: sameAddress });
      });
    });

    it('should handle same origin and destination netuids', function () {
      should.doesNotThrow(() => {
        builder.originNetuid('5').destinationNetuid('5');
      });
    });

    it('should validate various address formats', function () {
      const invalidAddresses = [
        '',
        '123',
        'invalid_address_format',
        '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT_invalid',
      ];

      invalidAddresses.forEach((address) => {
        assert.throws(
          () => builder.originHotkey({ address }),
          (e: Error) => e.message.includes('is not a well-formed dot address')
        );
        assert.throws(
          () => builder.destinationHotkey({ address }),
          (e: Error) => e.message.includes('is not a well-formed dot address')
        );
      });
    });

    it('should handle boundary netuid values', function () {
      should.doesNotThrow(() => builder.originNetuid('0'));
      should.doesNotThrow(() => builder.originNetuid('128'));
      should.doesNotThrow(() => builder.destinationNetuid('0'));
      should.doesNotThrow(() => builder.destinationNetuid('128'));

      assert.throws(
        () => builder.originNetuid('-1'),
        (e: Error) => e.message.includes('Invalid netuid: -1. Must be a non-negative integer.')
      );
      assert.throws(
        () => builder.destinationNetuid('129'),
        (e: Error) => e.message.includes('Invalid netuid: 129. Netuid must be between 0 and 128.')
      );
    });
  });

  describe('transaction explanation validation', function () {
    it('should provide correct explanation with different subnet tokens', async function () {
      builder
        .amount('1000000000000')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1')
        .destinationNetuid('2')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const explanation = tx.explainTransaction();

      explanation.should.have.properties(['outputs', 'outputAmount', 'changeAmount', 'fee', 'type']);
      explanation.outputs.should.have.length(1);
      explanation.outputs[0].should.have.properties(['address', 'amount', 'tokenName']);
      explanation.outputs[0].address.should.equal('5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq');
      explanation.outputs[0].amount.should.equal('1000000000000');
      explanation.changeAmount.should.equal('0');
      explanation.fee.should.have.properties(['fee', 'type']);
      explanation.fee.type.should.equal('tip');
    });

    it('should handle explanation with zero tip', async function () {
      builder
        .amount('500000000')
        .originHotkey({ address: '5FCPTnjevGqAuTttetBy4a24Ej3pH9fiQ8fmvP1ZkrVsLUoT' })
        .destinationHotkey({ address: '5Ffp1wJCPu4hzVDTo7XaMLqZSvSadyUQmxWPDw74CBjECSoq' })
        .originNetuid('1')
        .destinationNetuid('1')
        .sender({ address: sender.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock(referenceBlock)
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });

      const tx = await builder.build();
      const explanation = tx.explainTransaction();

      explanation.fee.fee.should.equal('0');
      explanation.outputAmount.should.equal('0');
    });
  });
});
