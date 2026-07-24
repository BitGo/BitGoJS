import { getBuilder } from '../getBuilder';
import should from 'should';

describe('Flr Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tflr');
      const txHex =
        '0xf86e038505d21dba00825208944943dd2a2494e3ea5937954cb836692a047695b5880de0b6b3a764000080820108a07fdc8942a7230a91022492180290b10ab9f50c14836966e7e0b6a25ce8c3fedea06d3ce650b2bd7117a5315b10c6054f5f1960fbeda4399d6a34b2f6ca6c68fd8e';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
