import 'should';
import {
  AccountNetwork,
  BaseNetwork,
  DynamicNetwork,
  getNetwork,
  Networks,
  NetworkType,
  PolyxNetwork,
} from '../../src/networks';

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

    describe('Sui Network', function () {
      it('should have correct explorer URLs', function () {
        Networks.main.sui.explorerUrl.should.equal('https://explorer.sui.io/txblock/?network=mainnet');
        Networks.main.sui.accountExplorerUrl.should.equal('https://explorer.sui.io/address/?network=mainnet');
        Networks.test.sui.explorerUrl.should.equal('https://explorer.sui.io/txblock/?network=testnet');
        Networks.test.sui.accountExplorerUrl.should.equal('https://explorer.sui.io/address/?network=testnet');
      });
    });

    describe('Ada Network', function () {
      it('should have correct explorer URLs', function () {
        Networks.main.ada.explorerUrl.should.equal('https://cardanoscan.io/transaction/');
        Networks.main.ada.accountExplorerUrl.should.equal('https://cardanoscan.io/address/');
        Networks.test.ada.explorerUrl.should.equal('https://preprod.cardanoscan.io/transaction/');
        Networks.test.ada.accountExplorerUrl.should.equal('https://preprod.cardanoscan.io/address/');
      });
    });

    describe('Near Network', function () {
      it('should have correct explorer URLs', function () {
        Networks.main.near.explorerUrl.should.equal('https://nearblocks.io/txns/');
        Networks.main.near.accountExplorerUrl.should.equal('https://nearblocks.io/address/');
        Networks.test.near.explorerUrl.should.equal('https://testnet.nearblocks.io/txns/');
        Networks.test.near.accountExplorerUrl.should.equal('https://testnet.nearblocks.io/address/');
      });
    });

    describe('FlareP Network', function () {
      it('should have correct explorer URLs', function () {
        Networks.main.flrP.explorerUrl.should.equal('https://flarescan.com/blockchain/pvm/tx/');
        Networks.main.flrP.accountExplorerUrl.should.equal('https://flarescan.com/blockchain/pvm/address/');
        Networks.test.flrP.explorerUrl.should.equal('https://coston2.testnet.flarescan.com/blockchain/pvm/tx/');
        Networks.test.flrP.accountExplorerUrl.should.equal(
          'https://coston2.testnet.flarescan.com/blockchain/pvm/address/'
        );
      });
    });
  });
});

describe('Cosmos-family addressPrefix', function () {
  const cases: Array<[string, AccountNetwork, string]> = [
    ['main.atom', Networks.main.atom, 'cosmos'],
    ['test.atom', Networks.test.atom, 'cosmos'],
    ['main.osmo', Networks.main.osmo, 'osmo'],
    ['test.osmo', Networks.test.osmo, 'osmo'],
    ['main.sei', Networks.main.sei, 'sei'],
    ['test.sei', Networks.test.sei, 'sei'],
    ['main.tia', Networks.main.tia, 'celestia'],
    ['test.tia', Networks.test.tia, 'celestia'],
    ['main.baby', Networks.main.baby, 'bbn'],
    ['test.baby', Networks.test.baby, 'bbn'],
    ['main.bld', Networks.main.bld, 'agoric'],
    ['test.bld', Networks.test.bld, 'agoric'],
    ['main.initia', Networks.main.initia, 'init'],
    ['test.initia', Networks.test.initia, 'init'],
    ['main.zeta', Networks.main.zeta, 'zeta'],
    ['test.zeta', Networks.test.zeta, 'zeta'],
    ['main.asi', Networks.main.asi, 'fetch'],
    ['test.asi', Networks.test.asi, 'fetch'],
    ['main.islm', Networks.main.islm, 'haqq'],
    ['test.islm', Networks.test.islm, 'haqq'],
    ['main.injective', Networks.main.injective, 'inj'],
    ['test.injective', Networks.test.injective, 'inj'],
    ['main.hash', Networks.main.hash, 'pb'],
    ['test.hash', Networks.test.hash, 'tp'],
    ['main.coreum', Networks.main.coreum, 'core'],
    ['test.coreum', Networks.test.coreum, 'testcore'],
    ['main.cronos', Networks.main.cronos, 'cro'],
    ['test.cronos', Networks.test.cronos, 'tcro'],
    ['main.rune', Networks.main.rune, 'thor'],
    ['test.rune', Networks.test.rune, 'sthor'],
    ['main.mantra', Networks.main.mantra, 'mantra'],
    ['test.mantra', Networks.test.mantra, 'mantra'],
    ['main.kavacosmos', Networks.main.kavacosmos, 'kava'],
    ['test.kavacosmos', Networks.test.kavacosmos, 'kava'],
    ['main.dydx', Networks.main.dydx, 'dydx'],
    ['test.dydx', Networks.test.dydx, 'dydx'],
  ];

  for (const [label, network, hrp] of cases) {
    it(`Networks.${label} has addressPrefix '${hrp}'`, function () {
      network.should.have.property('addressPrefix', hrp);
    });
  }
});

describe('Polymesh (POLYX) v8 network fields', function () {
  it('mainnet has v8SpecVersion and v8TxVersion', function () {
    const network: PolyxNetwork = Networks.main.polyx as PolyxNetwork;
    network.should.have.property('v8SpecVersion', 8000000);
    network.should.have.property('v8TxVersion', 8);
    network.should.have.property('specVersion', 7002000);
    network.should.have.property('txVersion', 7);
  });

  it('testnet has v8SpecVersion and v8TxVersion', function () {
    const network: PolyxNetwork = Networks.test.polyx as PolyxNetwork;
    network.should.have.property('v8SpecVersion', 8000000);
    network.should.have.property('v8TxVersion', 8);
    network.should.have.property('specVersion', 7002000);
    network.should.have.property('txVersion', 7);
  });

  it('PolyxNetwork interface has required fields', function () {
    const network: PolyxNetwork = Networks.main.polyx as PolyxNetwork;
    network.should.have.property('specName', 'polymesh_mainnet');
    network.should.have.property('genesisHash');
    network.should.have.property('chainName', 'Polymesh Mainnet');
  });
});

describe('DynamicNetwork and getNetwork', function () {
  it('DynamicNetwork should be an instance of BaseNetwork', function () {
    const network = new DynamicNetwork({ name: 'TestDynNet', type: 'testnet', family: 'eth' });
    network.should.be.instanceOf(BaseNetwork);
    network.name.should.equal('TestDynNet');
    network.type.should.equal(NetworkType.TESTNET);
  });

  it('getNetwork should resolve JSON string, static name, and throw for unknown', function () {
    // JSON-encoded DynamicNetworkOptions
    const jsonNetwork = getNetwork(JSON.stringify({ name: 'AmsNet', type: 'mainnet', family: 'sol' }));
    jsonNetwork.should.be.instanceOf(BaseNetwork);
    jsonNetwork.name.should.equal('AmsNet');

    // Static network by name
    const staticNetwork = getNetwork('Ethereum');
    staticNetwork.should.deepEqual(Networks.main.ethereum);

    // Unknown name throws
    (() => getNetwork('NonExistentNetworkXYZ')).should.throw('Network NonExistentNetworkXYZ not found');
  });
});
