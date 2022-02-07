import should from 'should';
import { register } from '../../../../../src';
import {
  TransactionBuilderFactory,
  TransferBuilder,
  AddressInitializationBuilder,
  StakingBuilder,
  UnstakeBuilder,
} from '../../../../../src/coin/dot';
import { rawTx, accounts } from '../../../../resources/dot';
import * as materialData from '../../../../resources/dot/materialData.json';
import { Material } from '../../../../../src/coin/dot/iface';

describe('dot Transaction Builder Factory', function () {
  const sender = accounts.account1;
  const sender2 = accounts.account3;
  let factory: TransactionBuilderFactory;

  // TODO: BG-43197 & STLX-14374
  xdescribe('parse generic builders', function () {
    before(function () {
      factory = register('tdot', TransactionBuilderFactory);
    });

    [
      { type: 'transfer', builder: TransferBuilder },
      { type: 'addProxy', builder: AddressInitializationBuilder },
      { type: 'stake', builder: StakingBuilder },
      { type: 'unstake', builder: UnstakeBuilder },
    ].forEach((txn) => {
      it(`should parse an unsigned ${txn.type} txn and return a ${txn.type} builder`, async () => {
        const builder = factory.from(rawTx[txn.type].unsigned).material(materialData as Material);

        builder.should.be.instanceOf(txn.builder);

        builder
          .validity({ firstValid: 3933 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
          .sender({ address: sender.address });
        const tx = await builder.build();
        should.equal(tx.toBroadcastFormat(), rawTx[txn.type].unsigned);
      });

      it(`should parse a signed ${txn.type} txn and return a ${txn.type} builder`, async () => {
        const builder = factory.from(rawTx[txn.type].signed).material(materialData as Material);

        builder.should.be.instanceOf(txn.builder);

        builder
          .validity({ firstValid: 3933 })
          .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d');
        const tx = await builder.build();
        should.equal(tx.toBroadcastFormat(), rawTx[txn.type].signed);
      });
    });
  });

  describe('should parse proxy txn', function () {
    before(function () {
      factory = register('tdot', TransactionBuilderFactory);
    });

    it('should parse an unsigned proxy txn and return a proxy builder', async () => {
      const builder = factory.from(rawTx.proxy.unsigned).material(materialData as Material);
      should(builder).instanceOf(TransferBuilder);
      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address });
      const tx = await builder.build();
      should.equal(tx.toBroadcastFormat(), rawTx.proxy.unsigned);
    });

    it('should parse a signed proxy txn and return a proxy builder', async () => {
      const builder = factory.from(rawTx.proxy.signed).material(materialData as Material);
      should(builder).instanceOf(TransferBuilder);
      builder
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender2.address })
        .sign({ key: sender2.secretKey });
      const tx = await builder.build();
      should.equal(tx.toBroadcastFormat(), rawTx.proxy.signed);
    });
  });
});
