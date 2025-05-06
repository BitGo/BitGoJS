import { coins } from '@bitgo/statics';
import should from 'should';
import { TransactionBuilderFactory, TransferBuilder } from '../../../src/lib';
import { Interface } from '../../../src';
import { rawTx, accounts } from '../../resources';
import * as materialData from '../../resources/materialData.json';

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
});
