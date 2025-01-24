import { getBuilder } from '../getBuilder';
import should from 'should';

describe('Xdc Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('txdc');
      const txHex =
        '0xf86d058502e90edd00825208944943dd2a2494e3ea5937954cb836692a047695b5880de0b6b3a764000080818aa0ca224695a7a9563b2b137fbc1e29b4f4648d4efc790acbcc4fc7e32b27ec4931a053c609798c695a9f2f94adacfdf0c74944762d39f1a059a3268aa3df7ea29fd3';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
