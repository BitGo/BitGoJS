import 'should';
import { Networks, NetworkType } from '../../src/networks';

Object.entries(Networks).forEach(([category, networks]) => {
  Object.entries(networks).forEach(([networkName, network]) => {
    describe(`Networks.${category}.${networkName}`, function () {
      if (!['main', 'test'].includes(category)) {
        throw new Error(`unexpected category ${category}`);
      }
      it(`has expected network type`, function () {
        network.type.should.eql(category === 'main' ? NetworkType.MAINNET : NetworkType.TESTNET);
      });
    });
  });
});
