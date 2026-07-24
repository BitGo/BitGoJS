import { getBuilder } from '../getBuilder';
import should from 'should';

describe('BSC Transfer Builder', () => {
  describe('Build from TxHex', function () {
    it('Should successfully build from txHex', async function () {
      const txBuilder = getBuilder('tbsc');
      const txHex =
        '0xf8ad82026d85059f73c1808303d09094f5caa5e3e93afbc21bd19ef4f2691a37121f791780b844fb90b32000000000000000000000000090a4693ee469ac4f04bb9bb8ccf955e6cf4cf875000000000000000000000000000000000000000000000000000000000000000181e5a08d37159dab62ce1f450cab33c932603505952e351f5da8da70023cdc9275be57a034be4eac6c2d636c6f1f0762ab0390fc8aa2fc541a968c911f8ef05a3422f44f';
      txBuilder.from(txHex);
      const parsedTx = await txBuilder.build();

      should.exist(parsedTx.toJson());
    });
  });
});
