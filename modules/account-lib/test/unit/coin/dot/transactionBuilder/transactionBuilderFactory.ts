import should from 'should';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
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
import { TestDotNetwork } from './base';
import { Material } from '../../../../../src/coin/dot/iface';

class StubTransactionBuilderFactory extends TransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    const testNetwork = { ..._coinConfig.network } as TestDotNetwork;
    super({ ..._coinConfig, network: testNetwork });
  }
}

function memPrint(str: string) {
  const formatMemoryUsage = (data: number) => `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;
  const memoryData = process.memoryUsage();
  const memoryUsage = {
    rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
    heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
    heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
    external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
    test: `${str} => The test we are in`,
  };
  console.log(memoryUsage);
}

// TODO: BG-43197
xdescribe('dot Transaction Builder Factory', async () => {
  const factory = register('tdot', StubTransactionBuilderFactory);
  const sender = accounts.account1;
  const sender2 = accounts.account3;

  [
    { type: 'transfer', builder: TransferBuilder },
    { type: 'addProxy', builder: AddressInitializationBuilder },
    { type: 'stake', builder: StakingBuilder },
    { type: 'unstake', builder: UnstakeBuilder },
  ].forEach((txn) => {
    it(`should parse an unsigned ${txn.type} txn and return a ${txn.type} builder`, async () => {
      memPrint(`should parse an unsigned ${txn.type} txn and return a ${txn.type} builder`);
      const builder = factory.material(materialData as Material).from(rawTx[txn.type].unsigned);

      should(builder).instanceOf(txn.builder);

      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address });
      const tx = await builder.build();
      should.equal(tx.toBroadcastFormat(), rawTx[txn.type].unsigned);
    });

    it(`should parse a signed ${txn.type} txn and return a ${txn.type} builder`, async () => {
      const builder = factory.material(materialData as Material).from(rawTx[txn.type].signed);

      should(builder).instanceOf(txn.builder);

      builder
        .validity({ firstValid: 3933 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sender({ address: sender.address })
        .sign({ key: sender.secretKey });
      const tx = await builder.build();
      should.equal(tx.toBroadcastFormat(), rawTx[txn.type].signed);
    });
    // memPrint();
  });

  it('should parse an unsigned proxy txn and return a proxy builder', async () => {
    const builder = factory.material(materialData as Material).from(rawTx.proxy.unsigned);
    should(builder).instanceOf(TransferBuilder);
    builder
      .validity({ firstValid: 3933 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sender({ address: sender.address });
    const tx = await builder.build();
    should.equal(tx.toBroadcastFormat(), rawTx.proxy.unsigned);
    memPrint('should parse an unsigned proxy txn and return a proxy builder');
  });

  it('should parse a signed proxy txn and return a proxy builder', async () => {
    const builder = factory.material(materialData as Material).from(rawTx.proxy.signed);
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
