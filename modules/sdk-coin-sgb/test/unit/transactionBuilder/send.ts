import { getBuilder } from '../getBuilder';
import should from 'should';

describe('Sgb Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tsgb');
      const txHex =
        '0xf86c038505d21dba00825208944943dd2a2494e3ea5937954cb836692a047695b5880de0b6b3a76400008044a015a6462b8a8d84cd3a495cba311281c565fd0502673e1783e0824fd5f807a68ca074c0525384fe579b52526a2f242b897b12cdb79519c8215d0d4346ae14a36cbb';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
