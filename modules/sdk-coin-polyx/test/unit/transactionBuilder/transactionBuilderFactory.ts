import { coins } from '@bitgo/statics';
import should from 'should';
import { TransactionBuilderFactory, TransferBuilder, V8TransferBuilder, V8HexTransferBuilder } from '../../../src/lib';
import { Interface } from '../../../src';
import { rawTx, accounts } from '../../resources';
import * as materialData from '../../resources/materialData.json';
import { buildTestConfig } from './base';

describe('Tao Transaction Builder Factory', function () {
  const sender = accounts.account1;
  let factory: TransactionBuilderFactory;

  xdescribe('parse generic builders', function () {
    before(function () {
      factory = new TransactionBuilderFactory(coins.get('tpolyx'));
    });

    [{ type: 'transfer', builder: TransferBuilder }].forEach((txn) => {
      it(`should parse an unsigned ${txn.type} txn and return a ${txn.type} builder`, async () => {
        const builder = factory.from(rawTx[txn.type].unsigned).material(materialData as Interface.Material);

        builder.should.be.instanceOf(txn.builder);

        builder
          .validity({ firstValid: 3933 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
          .sender({ address: sender.address });
        const tx = await builder.build();
        should.equal(tx.toBroadcastFormat(), rawTx[txn.type].unsigned);
      });

      it(`should parse a signed ${txn.type} txn and return a ${txn.type} builder`, async () => {
        const builder = factory.from(rawTx[txn.type].signed).material(materialData as Interface.Material);

        builder.should.be.instanceOf(txn.builder);

        builder
          .validity({ firstValid: 3933 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
        const tx = await builder.build();
        should.equal(tx.toBroadcastFormat(), rawTx[txn.type].signed);
      });
    });
  });

  describe('tryGetV8Builder routing', function () {
    const receiver = accounts.account2;

    let v8TransferTxHex: string;
    let v8HexTransferTxHex: string;

    before(async function () {
      const config = buildTestConfig();

      // Build an unsigned v8 transferWithMemo tx (plain-string memo, not 0x-prefixed)
      const v8Tx = await new V8TransferBuilder(config)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('0')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' })
        .build();
      v8TransferTxHex = v8Tx.toBroadcastFormat();

      // Build an unsigned v8 hex-memo transferWithMemo tx
      const v8HexTx = await new V8HexTransferBuilder(config)
        .amount('1000000')
        .to({ address: receiver.address })
        .sender({ address: sender.address })
        .memo('56594')
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 1 })
        .fee({ amount: 0, type: 'tip' })
        .build();
      v8HexTransferTxHex = v8HexTx.toBroadcastFormat();
    });

    it('routes a v8 transferWithMemo tx to V8TransferBuilder via fallback', function () {
      // A v8 txHex encodes transferWithMemo at call index 0x28 (Balances pallet, call 40),
      // which does not exist in the v7 SDK metadata. The factory falls back to tryGetV8Builder,
      // decodes against v8 metadata, and returns the correct builder.
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(v8TransferTxHex);
      should.ok(builder instanceof V8TransferBuilder, 'expected V8TransferBuilder from tryGetV8Builder fallback');
    });

    it('routes a v8 hex-memo transferWithMemo tx to V8HexTransferBuilder via fallback', function () {
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(v8HexTransferTxHex);
      should.ok(builder instanceof V8HexTransferBuilder, 'expected V8HexTransferBuilder from tryGetV8Builder fallback');
    });

    it('routes a v7 transferWithMemo tx to TransferBuilder directly', function () {
      const factoryInst = new TransactionBuilderFactory(buildTestConfig());
      const builder = factoryInst.from(rawTx.transfer.signed);
      should.ok(builder instanceof TransferBuilder, 'expected TransferBuilder for v7 txHex');
    });
  });
});
