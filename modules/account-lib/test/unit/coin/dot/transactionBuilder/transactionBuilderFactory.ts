import should from 'should';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { register } from '../../../../../src/index';
import {
  TransactionBuilderFactory,
  TransferBuilder,
  AddressInitializationBuilder,
  StakingBuilder,
  UnstakeBuilder,
} from '../../../../../src/coin/dot';
import * as dotResources from '../../../../resources/dot';
import * as materialData from '../../../../resources/dot/materialData.json';
import { TestDotNetwork } from './base';
import { Material } from '../../../../../src/coin/dot/iface';

class StubTransactionBuilderFactory extends TransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    const testNetwork = { ..._coinConfig.network } as TestDotNetwork;
    super({ ..._coinConfig, network: testNetwork });
  }
}

describe('dot Transaction Builder Factory', () => {
  const factory = register('tdot', StubTransactionBuilderFactory).material(materialData as Material);
  const { rawTx } = dotResources;
  const sender = dotResources.accounts.account1;
  const sender2 = dotResources.accounts.account3;

  [
    { type: 'transfer', builder: TransferBuilder },
    { type: 'addProxy', builder: AddressInitializationBuilder },
    { type: 'stake', builder: StakingBuilder },
    { type: 'unstake', builder: UnstakeBuilder },
  ].forEach((txn) => {
    it(`should parse an unsigned ${txn.type} txn and return a ${txn.type} builder`, async () => {
      const builder = factory.from(rawTx[txn.type].unsigned);

      should(builder).instanceOf(txn.builder);

      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address });
      const tx = await builder.build();
      should.equal(tx.toBroadcastFormat(), rawTx[txn.type].unsigned);
    });

    it(`should parse a signed ${txn.type} txn and return a ${txn.type} builder`, async () => {
      const builder = factory.from(rawTx[txn.type].signed);

      should(builder).instanceOf(txn.builder);

      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      should.equal(tx.toBroadcastFormat(), rawTx[txn.type].signed);
    });
  });

  it('should parse an unsigned proxy txn and return a proxy builder', async () => {
    const builder = factory.from(rawTx.proxy.unsigned);
    should(builder).instanceOf(TransferBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender({ address: sender.address });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.proxy.unsigned);
  });

  it('should parse a signed proxy txn and return a proxy builder', async () => {
    const builder = factory.from(rawTx.proxy.signed);
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
