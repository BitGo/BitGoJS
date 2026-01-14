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

    describe('ZkSyncEra Network', function () {
      it('should have correct mainnet chainId', function () {
        Networks.main.zkSyncEra.chainId.should.equal(324);
      });

      it('should have correct testnet chainId', function () {
        Networks.test.zkSyncEra.chainId.should.equal(300);
      });

      it('should have correct explorer URLs', function () {
        Networks.main.zkSyncEra.explorerUrl.should.equal('https://explorer.zksync.io/tx/');
        Networks.main.zkSyncEra.accountExplorerUrl.should.equal('https://explorer.zksync.io/address/');
        Networks.test.zkSyncEra.explorerUrl.should.equal('https://sepolia.explorer.zksync.io/tx/');
        Networks.test.zkSyncEra.accountExplorerUrl.should.equal('https://sepolia.explorer.zksync.io/address/');
      });

      it('should have correct operation hash prefixes', function () {
        Networks.main.zkSyncEra.nativeCoinOperationHashPrefix.should.equal('324');
        Networks.main.zkSyncEra.tokenOperationHashPrefix.should.equal('324-ERC20');
        Networks.test.zkSyncEra.nativeCoinOperationHashPrefix.should.equal('300');
        Networks.test.zkSyncEra.tokenOperationHashPrefix.should.equal('300-ERC20');
      });
      it('should have testnet contract addresses configured', function () {
        Networks.test.zkSyncEra.forwarderFactoryAddress.should.equal('0xdd498702f44c4da08eb9e08d3f015eefe5cb71fc');
        Networks.test.zkSyncEra.forwarderImplementationAddress.should.equal(
          '0xbe69cae311191fb45e648ed20847f06fad2dbab4'
        );
        Networks.test.zkSyncEra.walletFactoryAddress.should.equal('0x4550e1e7616d3364877fc6c9324938dab678621a');
        Networks.test.zkSyncEra.walletImplementationAddress.should.equal('0x92db2759d1dca129a0d9d46877f361be819184c4');
      });
    });
  });
});
