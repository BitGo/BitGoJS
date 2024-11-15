import { getBuilder } from '../getBuilder';
import should from 'should';

describe('OASYS Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('toas');
      const txHex =
        '0x02f86482249c010102825208944943dd2a2494e3ea5937954cb836692a047695b50180c001a0d3538b0f4f39bdbfa76becc187985c04ee0a01d0bc686a3c004b5f9f5a9a4fa5a036e4917be05a8ac0eb8639187ce746d7c47f74f04213118ba57873ec23ae1c2b';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
