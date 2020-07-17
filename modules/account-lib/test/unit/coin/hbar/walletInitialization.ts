import { register } from '../../../../src/index';
import { TransactionBuilderFactory } from '../../../../src/coin/hbar';

describe('Wallet initialization', () => {
  const factory = register('thbar', TransactionBuilderFactory);
  it('should build a valid raw tx for wallet init', async () => {
    const builder = factory.getWalletInitializationBuilder();
    builder.fee({ fee: '100000000' });
    builder.owner('1c5b8332673e2bdd7d677970e549e05157ea6a94f41a5da5020903c1c391f8ef');
    builder.owner('265f7cc91c0330ef27a626ff8688da761ab0543d33ba63c8315e2c91b6c595af');
    builder.owner('03ad12643db2a6ba5cf8a1da14d4bd5ee46625f88886d01cc70d2d9c6ee22666');
    builder.source({ address: '0.0.75861' });
    const tx = await builder.build();
    const raw = tx.toBroadcastFormat();
    const txData = tx.toJson();
    console.log(txData);
    console.log(Uint8Array.from(raw).toString());
  });
});
