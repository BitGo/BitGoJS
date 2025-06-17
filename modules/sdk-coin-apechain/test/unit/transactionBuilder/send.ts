import { getBuilder } from '../getBuilder';
import should from 'should';

describe('apechain Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tapechain');
      const txHex =
        '0xf86b0b839896808252089457d9b883d46ceeea30b16682113053de9d10ec46865af3107a400080830102d2a03a1fcc5fa74f4d753cf1184bb7a071bfaef3f64c5fa38788baaba0c8081309f6a032680cd57308746ca5b89c03a0ac7a59ceb2fe8e7b5ca23ff9c6eef3007dfbac';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
