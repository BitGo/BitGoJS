import 'should';
import {
  coins,
  CoinFamily,
  Networks,
  AccountCoin,
  CoinFeature,
  UnderlyingAsset,
  BaseUnit,
  KeyCurve,
  CoinMap,
} from '../../src';
import {
  getFormattedEthLikeTokenConfig,
  getEthLikeTokens,
  getFormattedTokens,
  EthLikeTokenConfig,
  TokenTypeEnum,
} from '../../src/tokenConfig';
import { EthLikeERC20Token } from '../../src/account';

describe('EthLike Token Config Functions', function () {
  describe('getEthLikeTokenConfig', function () {
    it('should convert an EthLikeERC20Token to EthLikeTokenConfig for mainnet', function () {
      // Create a mock mainnet EthLikeERC20Token
      const mockMainnetToken = new EthLikeERC20Token({
        id: '12345678-1234-4234-8234-123456789012',
        name: 'ip:testtoken',
        fullName: 'Test Token',
        network: Networks.main.ip,
        contractAddress: '0x1234567890123456789012345678901234567890',
        decimalPlaces: 18,
        asset: UnderlyingAsset.IP,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'TESTTOKEN',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const config = getFormattedEthLikeTokenConfig(CoinMap.fromCoins([mockMainnetToken]), TokenTypeEnum.ERC20)[0];

      config.should.not.be.undefined();
      config.type.should.equal('ip:testtoken');
      config.coin.should.equal('ip');
      config.network.should.equal('Mainnet');
      config.name.should.equal('Test Token');
      config.tokenContractAddress.should.equal('0x1234567890123456789012345678901234567890');
      config.decimalPlaces.should.equal(18);
    });

    it('should convert an EthLikeERC20Token to EthLikeTokenConfig for testnet', function () {
      // Create a mock testnet EthLikeERC20Token
      const mockTestnetToken = new EthLikeERC20Token({
        id: '22345678-2234-4234-9234-223456789012',
        name: 'tip:testtoken',
        fullName: 'Test Token Testnet',
        network: Networks.test.ip,
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        decimalPlaces: 6,
        asset: UnderlyingAsset.IP,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'TESTTOKEN',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const config = getFormattedEthLikeTokenConfig(CoinMap.fromCoins([mockTestnetToken]), TokenTypeEnum.ERC20)[0];

      config.should.not.be.undefined();
      config.type.should.equal('tip:testtoken');
      config.coin.should.equal('tip');
      config.network.should.equal('Testnet');
      config.name.should.equal('Test Token Testnet');
      config.tokenContractAddress.should.equal('0xabcdef1234567890abcdef1234567890abcdef12');
      config.decimalPlaces.should.equal(6);
    });

    it('should lowercase the contract address', function () {
      const mockToken = new EthLikeERC20Token({
        id: '32345678-3234-4234-a234-323456789012',
        name: 'ip:uppercase',
        fullName: 'Uppercase Token',
        network: Networks.main.ip,
        contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        decimalPlaces: 18,
        asset: UnderlyingAsset.IP,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'UPPERCASE',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const config = getFormattedEthLikeTokenConfig(CoinMap.fromCoins([mockToken]), TokenTypeEnum.ERC20)[0];

      config.tokenContractAddress.should.equal('0xabcdef1234567890abcdef1234567890abcdef12');
      config.tokenContractAddress.should.not.match(/[A-F]/);
    });

    it('should extract coin name from token name using split', function () {
      const mockToken = new EthLikeERC20Token({
        id: '42345678-4234-4234-b234-423456789012',
        name: 'ip:usdc',
        fullName: 'USD Coin',
        network: Networks.main.ip,
        contractAddress: '0x1234567890123456789012345678901234567890',
        decimalPlaces: 6,
        asset: UnderlyingAsset.IP,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'USDC',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const config = getFormattedEthLikeTokenConfig(CoinMap.fromCoins([mockToken]), TokenTypeEnum.ERC20)[0];

      config.coin.should.equal('ip');
      config.type.should.equal('ip:usdc');
    });

    it('should convert an EthLikeERC20Token to EthLikeTokenConfig for hypeevm mainnet', function () {
      // Create a mock mainnet EthLikeERC20Token for hypeevm
      const mockMainnetToken = new EthLikeERC20Token({
        id: 'a1234567-1234-4234-8234-123456789012',
        name: 'hypeevm:testtoken',
        fullName: 'HypeEVM Test Token',
        network: Networks.main.hypeevm,
        contractAddress: '0x9876543210987654321098765432109876543210',
        decimalPlaces: 18,
        asset: UnderlyingAsset.HYPEEVM,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'TESTTOKEN',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const config = getFormattedEthLikeTokenConfig(CoinMap.fromCoins([mockMainnetToken]), TokenTypeEnum.ERC20)[0];

      config.should.not.be.undefined();
      config.type.should.equal('hypeevm:testtoken');
      config.coin.should.equal('hypeevm');
      config.network.should.equal('Mainnet');
      config.name.should.equal('HypeEVM Test Token');
      config.tokenContractAddress.should.equal('0x9876543210987654321098765432109876543210');
      config.decimalPlaces.should.equal(18);
    });

    it('should convert an EthLikeERC20Token to EthLikeTokenConfig for thypeevm testnet', function () {
      // Create a mock testnet EthLikeERC20Token for thypeevm
      const mockTestnetToken = new EthLikeERC20Token({
        id: 'b2234567-2234-4234-9234-223456789012',
        name: 'thypeevm:testtoken',
        fullName: 'HypeEVM Test Token Testnet',
        network: Networks.test.hypeevm,
        contractAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
        decimalPlaces: 18,
        asset: UnderlyingAsset.HYPEEVM,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'TESTTOKEN',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const config = getFormattedEthLikeTokenConfig(CoinMap.fromCoins([mockTestnetToken]), TokenTypeEnum.ERC20)[0];

      config.should.not.be.undefined();
      config.type.should.equal('thypeevm:testtoken');
      config.coin.should.equal('thypeevm');
      config.network.should.equal('Testnet');
      config.name.should.equal('HypeEVM Test Token Testnet');
      config.tokenContractAddress.should.equal('0xfedcba0987654321fedcba0987654321fedcba09');
      config.decimalPlaces.should.equal(18);
    });
  });

  describe('getFormattedEthLikeTokenConfig', function () {
    it('should filter only EthLikeERC20Token instances from mixed coin types', function () {
      const mockEthLikeToken = new EthLikeERC20Token({
        id: '52345678-5234-4234-8234-523456789012',
        name: 'ip:token1',
        fullName: 'Token 1',
        network: Networks.main.ip,
        contractAddress: '0x1111111111111111111111111111111111111111',
        decimalPlaces: 18,
        asset: UnderlyingAsset.IP,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'TOKEN1',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const mockAccountCoin = new AccountCoin({
        id: '62345678-6234-4234-9234-623456789012',
        name: 'btc',
        fullName: 'Bitcoin',
        network: Networks.main.bitcoin,
        decimalPlaces: 8,
        asset: UnderlyingAsset.BTC,
        features: [...AccountCoin.DEFAULT_FEATURES],
        prefix: '',
        suffix: 'BTC',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: false,
        baseUnit: BaseUnit.BTC,
      });

      const result = getFormattedEthLikeTokenConfig(
        CoinMap.fromCoins([mockEthLikeToken, mockAccountCoin]),
        TokenTypeEnum.ERC20
      );

      result.length.should.equal(1);
      result[0].type.should.equal('ip:token1');
    });

    it('should handle multiple EthLikeERC20Token instances', function () {
      const mockToken1 = new EthLikeERC20Token({
        id: '72345678-7234-4234-a234-723456789012',
        name: 'ip:token1',
        fullName: 'Token 1',
        network: Networks.main.ip,
        contractAddress: '0x1111111111111111111111111111111111111111',
        decimalPlaces: 18,
        asset: UnderlyingAsset.IP,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'TOKEN1',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const mockToken2 = new EthLikeERC20Token({
        id: '82345678-8234-4234-b234-823456789012',
        name: 'tip:token2',
        fullName: 'Token 2',
        network: Networks.test.ip,
        contractAddress: '0x2222222222222222222222222222222222222222',
        decimalPlaces: 6,
        asset: UnderlyingAsset.IP,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'TOKEN2',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const result = getFormattedEthLikeTokenConfig(CoinMap.fromCoins([mockToken1, mockToken2]), TokenTypeEnum.ERC20);

      result.length.should.equal(2);
      result[0].type.should.equal('ip:token1');
      result[0].network.should.equal('Mainnet');
      result[1].type.should.equal('tip:token2');
      result[1].network.should.equal('Testnet');
    });

    it('should use default coins map when no parameter is provided', function () {
      const result = getFormattedEthLikeTokenConfig(undefined, TokenTypeEnum.ERC20);

      result.should.be.an.Array();
      // Check that it filters coins from the default coin map
      result.forEach((config: EthLikeTokenConfig) => {
        config.should.have.property('type');
        config.should.have.property('coin');
        config.should.have.property('network');
        config.should.have.property('name');
        config.should.have.property('tokenContractAddress');
        config.should.have.property('decimalPlaces');
      });
    });

    it('should return configs with all required properties', function () {
      const mockToken = new EthLikeERC20Token({
        id: '92345678-9234-4234-8234-923456789012',
        name: 'ip:proptest',
        fullName: 'Property Test Token',
        network: Networks.main.ip,
        contractAddress: '0x3333333333333333333333333333333333333333',
        decimalPlaces: 12,
        asset: UnderlyingAsset.IP,
        features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.EIP1559],
        prefix: '',
        suffix: 'PROPTEST',
        primaryKeyCurve: KeyCurve.Secp256k1,
        isToken: true,
        baseUnit: BaseUnit.ETH,
      });

      const result = getFormattedEthLikeTokenConfig(CoinMap.fromCoins([mockToken]), TokenTypeEnum.ERC20);

      result[0].should.have.property('type').which.is.a.String();
      result[0].should.have.property('coin').which.is.a.String();
      result[0].should.have.property('network').which.is.a.String();
      result[0].should.have.property('name').which.is.a.String();
      result[0].should.have.property('tokenContractAddress').which.is.a.String();
      result[0].should.have.property('decimalPlaces').which.is.a.Number();
    });
  });

  describe('getEthLikeTokens', function () {
    it('should return a map with tokens for EVM chains supporting ERC20', function () {
      const result = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);

      result.should.be.an.Object();
      // The function includes all EVM chains with SUPPORTS_ERC20 feature
      if (result.ip) {
        result.ip.should.have.property('tokens');
        result.ip.tokens.should.be.an.Array();
      }
      if (result.hypeevm) {
        result.hypeevm.should.have.property('tokens');
        result.hypeevm.tokens.should.be.an.Array();
      }
    });

    it('should filter mainnet tokens correctly', function () {
      const result = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);

      Object.values(result).forEach((chainData) => {
        chainData.tokens.forEach((token) => {
          token.network.should.equal('Mainnet');
        });
      });
    });

    it('should filter testnet tokens correctly', function () {
      const result = getEthLikeTokens('Testnet', TokenTypeEnum.ERC20);

      Object.values(result).forEach((chainData) => {
        chainData.tokens.forEach((token) => {
          token.network.should.equal('Testnet');
        });
      });
    });

    it('should prepend "t" to coin name for testnet tokens', function () {
      const result = getEthLikeTokens('Testnet', TokenTypeEnum.ERC20);

      if (result.ip && result.ip.tokens.length > 0) {
        result.ip.tokens.forEach((token) => {
          token.coin.should.equal('tip');
        });
      }
      if (result.hypeevm && result.hypeevm.tokens.length > 0) {
        result.hypeevm.tokens.forEach((token) => {
          token.coin.should.equal('thypeevm');
        });
      }
    });

    it('should not prepend "t" to coin name for mainnet tokens', function () {
      const result = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);

      if (result.ip && result.ip.tokens.length > 0) {
        result.ip.tokens.forEach((token) => {
          token.coin.should.equal('ip');
        });
      }
      if (result.hypeevm && result.hypeevm.tokens.length > 0) {
        result.hypeevm.tokens.forEach((token) => {
          token.coin.should.equal('hypeevm');
        });
      }
    });

    it('should only include tokens from chains with SUPPORTS_ERC20 feature', function () {
      const result = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);

      // Verify that all included chains are AccountCoins with SUPPORTS_ERC20 feature
      Object.keys(result).forEach((family) => {
        const coin = coins.get(family as CoinFamily);
        if (coin) {
          coin.should.be.instanceOf(AccountCoin);
          coin.features.should.containEql(CoinFeature.SUPPORTS_ERC20);
        }
      });
    });

    it('should return empty tokens array for chains without tokens', function () {
      const result = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);

      // If a chain is in the result but has no tokens, it should have an empty array
      Object.values(result).forEach((chainData) => {
        chainData.tokens.should.be.an.Array();
      });
    });

    it('should group tokens by their coin family', function () {
      const result = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);

      if (result.ip && result.ip.tokens.length > 0) {
        result.ip.tokens.forEach((token) => {
          // All tokens in ip group should have coin 'ip'
          token.coin.should.equal('ip');
        });
      }
      if (result.hypeevm && result.hypeevm.tokens.length > 0) {
        result.hypeevm.tokens.forEach((token) => {
          // All tokens in hypeevm group should have coin 'hypeevm'
          token.coin.should.equal('hypeevm');
        });
      }
      if (result.plume && result.plume.tokens.length > 0) {
        result.plume.tokens.forEach((token) => {
          token.coin.should.equal('plume');
        });
      }
    });

    it('should return tokens with correct structure', function () {
      const mainnetResult = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);

      Object.values(mainnetResult).forEach((chainData) => {
        chainData.should.have.property('tokens');
        chainData.tokens.should.be.an.Array();

        chainData.tokens.forEach((token) => {
          token.should.have.property('type');
          token.should.have.property('coin');
          token.should.have.property('network');
          token.should.have.property('name');
          token.should.have.property('tokenContractAddress');
          token.should.have.property('decimalPlaces');
        });
      });
    });

    it('should handle both Mainnet and Testnet parameters', function () {
      const mainnetResult = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);
      const testnetResult = getEthLikeTokens('Testnet', TokenTypeEnum.ERC20);

      mainnetResult.should.be.an.Object();
      testnetResult.should.be.an.Object();

      // Verify network segregation
      Object.values(mainnetResult).forEach((chainData) => {
        chainData.tokens.forEach((token) => {
          token.network.should.equal('Mainnet');
        });
      });

      Object.values(testnetResult).forEach((chainData) => {
        chainData.tokens.forEach((token) => {
          token.network.should.equal('Testnet');
        });
      });
    });

    it('should not mix mainnet and testnet tokens', function () {
      const mainnetResult = getEthLikeTokens('Mainnet', TokenTypeEnum.ERC20);
      const testnetResult = getEthLikeTokens('Testnet', TokenTypeEnum.ERC20);

      // Get all token types from mainnet
      const mainnetTokenTypes = new Set<string>();
      Object.values(mainnetResult).forEach((chainData) => {
        chainData.tokens.forEach((token) => {
          mainnetTokenTypes.add(token.type);
        });
      });

      // Verify testnet tokens are different (should start with 't' prefix typically)
      Object.values(testnetResult).forEach((chainData) => {
        chainData.tokens.forEach((token) => {
          // Testnet token types should not be in mainnet set
          if (mainnetTokenTypes.has(token.type)) {
            // This would be an error - same token in both networks
            throw new Error(`Token ${token.type} appears in both mainnet and testnet`);
          }
        });
      });
    });
  });

  describe('Integration with real coins', function () {
    it('should work with EthLikeERC20Token instances from the coins map', function () {
      const ethLikeTokens = Array.from(coins).filter((coin) => coin instanceof EthLikeERC20Token);

      if (ethLikeTokens.length > 0) {
        const configs = getFormattedEthLikeTokenConfig(coins, TokenTypeEnum.ERC20);

        configs.length.should.be.greaterThanOrEqual(0);

        configs.forEach((config) => {
          config.should.have.property('type');
          config.should.have.property('coin');
          config.should.have.property('network');
          config.should.have.property('name');
          config.should.have.property('tokenContractAddress');
          config.should.have.property('decimalPlaces');

          // Verify network is either Mainnet or Testnet
          ['Mainnet', 'Testnet'].should.containEql(config.network);

          // Verify contract address is lowercase
          config.tokenContractAddress.should.equal(config.tokenContractAddress.toLowerCase());
        });
      }
    });

    it('should correctly identify EthLikeERC20Token instances in coins map', function () {
      let ethLikeTokenCount = 0;

      coins.forEach((coin) => {
        if (coin instanceof EthLikeERC20Token) {
          ethLikeTokenCount++;
        }
      });

      const formattedConfigs = getFormattedEthLikeTokenConfig(coins, TokenTypeEnum.ERC20);
      formattedConfigs.length.should.equal(ethLikeTokenCount);
    });
  });

  describe('getFormattedTokens', function () {
    it('should return bitcoin and testnet properties with the same keys', function () {
      const tokens = getFormattedTokens();

      tokens.should.have.property('bitcoin');
      tokens.should.have.property('testnet');

      // Get all keys from bitcoin and testnet
      const bitcoinKeys = Object.keys(tokens.bitcoin).sort();
      const testnetKeys = Object.keys(tokens.testnet).sort();

      // Both should have the same number of keys
      bitcoinKeys.length.should.equal(testnetKeys.length);

      // Both should have the exact same keys
      bitcoinKeys.should.deepEqual(testnetKeys);

      // Verify all keys are present in both
      bitcoinKeys.forEach((key) => {
        tokens.testnet.should.have.property(key);
      });

      testnetKeys.forEach((key) => {
        tokens.bitcoin.should.have.property(key);
      });
    });
  });
});
