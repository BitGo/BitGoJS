import { getBuilder } from '../getBuilder';
import should from 'should';
import * as testData from '../resources';

describe('World Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tworld');
      const txHex = testData.TXN_Hash;
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
