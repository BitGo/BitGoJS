import should from 'should';
import { TokenTransferBuilder } from '../../../src/lib';
import { coins } from '@bitgo/statics';
import { TokenSymbol } from '@acala-network/txwrapper-acala';
import { material } from '../../resources';

describe('Aca Transfer Builder', () => {
  let builder: TokenTransferBuilder;

  const sender = '5CaxhddMMK3RDfVG5jNpXK1wH5JypeLaDirt1tdBAjjHby2C';
  const receiver = '5DLkMpzjemtsMh4kkEJ1jmu3kYagqJ4QWZShrg4MYDknGcah';

  const genesisHash = '0x5c562e6300954998233c9a40b6b86f3028977e6d32d0da1af207738d19f98c1b';
  const chainName = 'Acala Mandala TC7';
  const specVersion = 2090;
  const txVersion = 1;

  beforeEach(() => {
    const config = coins.get('taca');
    builder = new TokenTransferBuilder(config).material(material);
  });

  it('should build an unsigned transfer transaction', async () => {
    builder
      .amount('90034235235322')
      .to({ address: receiver })
      .token(TokenSymbol.AUSD)
      .sender({ address: sender })
      .validity({ firstValid: 3933, maxDuration: 64 })
      .referenceBlock('0x149799bc9602cb5cf201f3425fb8d253b2d4e61fc119dcab3249f307f594754d')
      .sequenceId({ name: 'Nonce', keyword: 'nonce', value: 200 })
      .fee({ amount: 0, type: 'tip' });
    const tx = await builder.build();
    const txJson = tx.toJson();
    should.deepEqual(txJson.amount, '90034235235322');
    should.deepEqual(txJson.to, receiver);
    should.deepEqual(txJson.sender, sender);
    should.deepEqual(txJson.genesisHash, genesisHash);
    should.deepEqual(txJson.specVersion, specVersion);
    should.deepEqual(txJson.transactionVersion, txVersion);
    should.deepEqual(txJson.chainName, chainName);
    should.deepEqual(txJson.token, TokenSymbol.AUSD);

    console.log('TX' + JSON.stringify(tx, null, 2));
    console.log('TO JSON' + JSON.stringify(txJson, null, 2));
  });
});
