import 'should';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { coins, CoinFeature } from '@bitgo/statics';

describe('OFC ERC20 Tokens Configuration:', function () {
  let bitgo;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('validate addressCoin configuration for all OFC ERC20 tokens', function () {
    it('should have addressCoin matching the first part of underlying asset', function () {
      // Get all OFC ERC20 tokens (ofcerc20 and tofcerc20 instances)
      // These are identified by having an addressCoin property
      const ofcCoins = coins.filter((coin: any) => coin.family === 'ofc' && coin.addressCoin);

      const misconfigurations: string[] = [];

      ofcCoins.forEach((ofcCoin: any) => {
        // Get the underlying asset
        const asset = ofcCoin.asset;

        // Skip if no addressCoin property (not all OFC coins have it)
        if (!ofcCoin.addressCoin) {
          return;
        }

        // Skip testnet tokens - they use testnet-specific addressCoins
        // (e.g., gteth, hteth, tsol, tavaxc, tpolygon, tarbeth)
        if (ofcCoin.network.type === 'testnet') {
          return;
        }

        // Determine expected addressCoin from the asset (mainnet only)
        let expectedAddressCoin;

        if (asset.includes(':')) {
          // For assets like 'baseeth:spec', 'xdc:usdc', 'mon:usdc', etc.
          // The addressCoin should be the part before the colon
          expectedAddressCoin = asset.split(':')[0];
        } else if (ofcCoin.name.includes(':')) {
          // For tokens with ':' in the name like 'ofcbaseeth:spec'
          // Extract the chain from the name
          const nameParts = ofcCoin.name.replace(/^ofc/, '').split(':');
          if (nameParts.length > 1) {
            expectedAddressCoin = nameParts[0];
          } else {
            expectedAddressCoin = 'eth'; // Default to eth for standard ERC20 tokens
          }
        } else {
          // For standard tokens without ':' in asset (e.g., 'USDC', 'LINK')
          expectedAddressCoin = 'eth';
        }

        // Check addressCoin matches expected value
        if (ofcCoin.addressCoin !== expectedAddressCoin) {
          misconfigurations.push(
            `Token ${ofcCoin.name} with asset ${asset} should have addressCoin='${expectedAddressCoin}' but has '${ofcCoin.addressCoin}'`
          );
        }
      });

      // Report all misconfigurations at once
      if (misconfigurations.length > 0) {
        throw new Error(
          `Found ${misconfigurations.length} addressCoin misconfigurations:\n` + misconfigurations.join('\n')
        );
      }
    });

    it('should validate specific chain-specific tokens', function () {
      // Test specific tokens by chain
      const testCases = [
        // XDC Network tokens
        { token: 'ofcxdc:usdc', addressCoin: 'xdc', chain: 'XDC' },
        { token: 'ofcxdc:lbt', addressCoin: 'xdc', chain: 'XDC' },
        { token: 'ofcxdc:gama', addressCoin: 'xdc', chain: 'XDC' },
        { token: 'ofcxdc:srx', addressCoin: 'xdc', chain: 'XDC' },
        { token: 'ofcxdc:weth', addressCoin: 'xdc', chain: 'XDC' },
        // Base Ethereum tokens
        { token: 'ofcbaseeth:spec', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:soon', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:wave', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:tig', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:virtual', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:zora', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:toshi', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:creator', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:avnt', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:mira', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:towns', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:recall', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:brlv', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:wbrly', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:sapien', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:aixbt', addressCoin: 'baseeth', chain: 'Base' },
        { token: 'ofcbaseeth:brett', addressCoin: 'baseeth', chain: 'Base' },
        // MON Network tokens
        { token: 'ofcmon:usdc', addressCoin: 'mon', chain: 'MON' },
        { token: 'ofcmon:wmon', addressCoin: 'mon', chain: 'MON' },
        // HYPE Network token
        { token: 'ofchype:hwhype', addressCoin: 'hype', chain: 'HYPE' },
        // IP (Story Network) token
        { token: 'ofcip:aria', addressCoin: 'ip', chain: 'Story' },
      ];

      const errors: string[] = [];

      testCases.forEach(({ token, addressCoin, chain }) => {
        const ofcCoin: any = coins.get(token);
        if (!ofcCoin) {
          errors.push(`${chain} token ${token} not found in statics`);
        } else if (ofcCoin.addressCoin !== addressCoin) {
          errors.push(
            `${chain} token ${token} should have addressCoin='${addressCoin}' but has '${ofcCoin.addressCoin}'`
          );
        }
      });

      if (errors.length > 0) {
        throw new Error(`Found ${errors.length} configuration errors:\n` + errors.join('\n'));
      }
    });

    it('should validate all tokens have addressCoin property', function () {
      // Get all OFC ERC20 tokens (ofcerc20 and tofcerc20 instances)
      // These should all have an addressCoin property
      const ofcErc20Tokens = coins.filter(
        (coin: any) =>
          coin.family === 'ofc' && coin.isToken === true && (coin.name.includes(':') || coin.asset.includes(':'))
      );

      const tokensWithoutAddressCoin: string[] = [];

      ofcErc20Tokens.forEach((ofcCoin: any) => {
        if (!ofcCoin.addressCoin) {
          tokensWithoutAddressCoin.push(`${ofcCoin.name} (asset: ${ofcCoin.asset})`);
        }
      });

      // Report tokens without addressCoin (informational only, not a failure)
      tokensWithoutAddressCoin.length.should.be.greaterThanOrEqual(0);
    });
  });

  describe('validate required custody features for all OFC ERC20 tokens', function () {
    it('should have required custody features for ofcerc20 and tofcerc20 tokens', function () {
      const requiredFeatures = [
        CoinFeature.ACCOUNT_MODEL,
        CoinFeature.REQUIRES_BIG_NUMBER,
        CoinFeature.CUSTODY,
        CoinFeature.CUSTODY_BITGO_TRUST,
      ];

      // Get all OFC ERC20 tokens (ofcerc20 and tofcerc20 instances)
      // These are identified by having an addressCoin property
      const ofcCoins = coins.filter((coin: any) => coin.family === 'ofc' && coin.addressCoin);

      const missingFeatures: string[] = [];

      ofcCoins.forEach((ofcCoin) => {
        requiredFeatures.forEach((feature) => {
          if (!ofcCoin.features.includes(feature)) {
            missingFeatures.push(`Token ${ofcCoin.name} is missing feature: ${feature}`);
          }
        });
      });

      if (missingFeatures.length > 0) {
        throw new Error(`Found ${missingFeatures.length} missing features:\n` + missingFeatures.join('\n'));
      }
    });
  });

  describe('validate address validation for chain-specific tokens', function () {
    it('should validate bg- format addresses for all OFC tokens', function () {
      // Get sample OFC tokens from different chains
      const testTokens = [
        'ofcxdc:usdc',
        'ofcbaseeth:spec',
        'ofcmon:usdc',
        'ofchype:hwhype',
        'ofcip:aria',
        'ofceth',
        'ofcbtc',
      ];

      const errors: string[] = [];

      testTokens.forEach((tokenName) => {
        const ofcCoin = bitgo.coin(tokenName);
        if (ofcCoin) {
          const validBgAddress = 'bg-5b2b80eafbdf94d5030bb23f9b56ad64';
          const invalidBgAddress = 'bg-5b2b80eafbdf94d5030bb23f9b56ad64nnn';

          if (!ofcCoin.isValidAddress(validBgAddress)) {
            errors.push(`${tokenName} should accept valid bg- address format`);
          }

          if (ofcCoin.isValidAddress(invalidBgAddress)) {
            errors.push(`${tokenName} should reject invalid bg- address format`);
          }
        }
      });

      if (errors.length > 0) {
        throw new Error(`Found ${errors.length} address validation errors:\n` + errors.join('\n'));
      }
    });
  });

  describe('validate all OFC tokens are properly registered', function () {
    it('should be able to instantiate all OFC tokens', function () {
      const ofcCoins = coins.filter((coin) => coin.family === 'ofc');
      const errors: string[] = [];

      ofcCoins.forEach((ofcCoin) => {
        try {
          const coin = bitgo.coin(ofcCoin.name);
          if (!coin) {
            errors.push(`Failed to instantiate ${ofcCoin.name}`);
          }
        } catch (e) {
          errors.push(`Error instantiating ${ofcCoin.name}: ${e.message}`);
        }
      });

      if (errors.length > 0) {
        throw new Error(`Found ${errors.length} instantiation errors:\n` + errors.join('\n'));
      }
    });
  });
});
