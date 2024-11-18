import { getBuilder } from '../getBuilder';
import should from 'should';

describe('Coredao Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tcoredao');
      const txHex =
        '0x02f86482045b010102825208944943dd2a2494e3ea5937954cb836692a047695b50180c080a0a967298f91f5c8bb735a0837e68cb43d6541f987028b60a10a165f55bca0eda6a04266fc6f2b7b1c55636bbcc2552fbe18930cf0a483ba85d2fa496fe3042f1796';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
