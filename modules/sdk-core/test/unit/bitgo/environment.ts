import should from 'should';
import { Environments } from '../../../src';

describe('zkSync Era Environment Configuration', function () {
  it('should have evm config for mainnet zksyncera', function () {
    const mainnetEnv = Environments.prod;
    should.exist(mainnetEnv.evm);
    should.exist(mainnetEnv.evm?.zksyncera);
    mainnetEnv.evm?.zksyncera.baseUrl.should.equal('https://api.etherscan.io/v2');
  });

  it('should have evm config for testnet zksyncera', function () {
    const testnetEnv = Environments.test;
    should.exist(testnetEnv.evm);
    should.exist(testnetEnv.evm?.zksyncera);
    testnetEnv.evm?.zksyncera.baseUrl.should.equal('https://api.etherscan.io/v2');
  });
});

describe('HypeEvm Bridging Environment Configuration', function () {
  it('should have bridging config for mainnet Hypeevm', function () {
    const mainnetEnv = Environments.prod;
    should.exist(mainnetEnv.evm);
    should.exist(mainnetEnv.evm?.hypeevm);
    mainnetEnv.evm?.hypeevm.tokenId?.should.equal(150);
    mainnetEnv.evm?.hypeevm.systemAddr?.should.equal('0x2222222222222222222222222222222222222222');
  });

  it('should have bridging config for testnet Hypeevm', function () {
    const testnetEnv = Environments.test;
    should.exist(testnetEnv.evm);
    should.exist(testnetEnv.evm?.hypeevm);
    testnetEnv.evm?.hypeevm.tokenId?.should.equal(1105);
    testnetEnv.evm?.hypeevm.systemAddr?.should.equal('0x2222222222222222222222222222222222222222');
  });
});
