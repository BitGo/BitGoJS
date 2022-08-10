import { TokenTransferBuilder } from '../src';
import { BaseCoin as CoinConfig, coins, PolkadotSpecNameType } from '@bitgo/statics';
import { accounts, mockTssSignature, material } from './resources';

export interface Material {
  genesisHash: string;
  chainName: string;
  specName: PolkadotSpecNameType;
  specVersion: number;
  txVersion: number;
  metadata: `0x${string}`;
}

describe('Dot Transfer Builder', () => {
  let builder: TokenTransferBuilder;

  beforeEach(() => {
    const config = coins.get('taca') as Readonly<CoinConfig>;
    // console.log('config ' + JSON.stringify(config, null, 2));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore ignore this error
    builder = new TokenTransferBuilder(config).material(material);
  });

  describe('build transfer transaction', () => {
    it('should build a transfer transaction', async () => {
      builder
        .amount('90034235235322')
        .to({ address: accounts.account1.address })
        .sender({ address: accounts.account2.address })
        .validity({ firstValid: 3933, maxDuration: 64 })
        .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
        .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
        .fee({ amount: 0, type: 'tip' });
      builder.addSignature({ pub: accounts.account2.publicKey }, Buffer.from(mockTssSignature, 'hex'));
      const tx = await builder.build();
      const txJson = tx.toJson();
      console.log('TX' + JSON.stringify(tx, null, 2));
      console.log('TO JSON' + JSON.stringify(txJson, null, 2));
    });
  });
});
