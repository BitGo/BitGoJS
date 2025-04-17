import { getBuilder } from '../getBuilder';
import should from 'should';

describe('Mon Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tmon');
      const txHex =
        '0x02f87282279f028477359400850c1b710800825208948952fde89aa69a8827fccfffaca07cc67581fe6585174876e80080c001a0f06c60dd83823794cc0c22b17004b9ecd8ec9ca5e17a5b5a588ee9503f1282bba07e5391bd6160c425cee734b19b16b25b96b98721e062ca8029c09acfb125013a';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
