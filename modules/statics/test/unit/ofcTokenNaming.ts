import * as should from 'should';
import { ofcCoins } from '../../src/coins/ofcCoins';
import { NetworkType } from '../../src/networks';

describe('OFC Token Naming Convention Tests', function () {
  it('should have all testnet tokens on test network and mainnet tokens on main network', function () {
    // Known exceptions for testnet tokens that don't follow the typical naming pattern
    const testnetExceptions = ['ofcgteth', 'ofchteth', 'ofchooditeth'];

    ofcCoins.forEach((token) => {
      if (token.network.type === NetworkType.TESTNET) {
        // Skip checking naming convention for known exceptions
        if (testnetExceptions.includes(token.name)) {
          return;
        }

        // All testnet tokens should start with 'ofct'
        token.name.startsWith('ofct').should.be.true(`Testnet token ${token.name} should start with 'ofct'`);
      } else if (token.network.type === NetworkType.MAINNET) {
        // All mainnet tokens should start with 'ofc'
        token.name.startsWith('ofc').should.be.true(`Mainnet token ${token.name} should start with 'ofc'`);

        // Special case handling for tokens where the asset name starts with 't'
        // (e.g., ofctia for TIA/Celestia), these should be exempt from the 'ofct' check
        const assetName = token.asset.toString().toLowerCase();
        const isSpecialCase = assetName.startsWith('t');

        if (!isSpecialCase) {
          token.name.startsWith('ofct').should.be.false(`Mainnet token ${token.name} should not start with 'ofct'`);
        }
      }
    });
  });

  it('should have consistent fullName format for testnet tokens', function () {
    const testnetTokens = ofcCoins.filter((token) => token.network.type === NetworkType.TESTNET);

    testnetTokens.forEach((token) => {
      // All tokens should have a fullName defined
      should.exist(token.fullName, `Token ${token.name} is missing a fullName`);

      // Known exceptions that don't follow the "Test" or "Testnet" pattern
      const knownExceptions = [
        'ofcttrx:usdt', // "Tether USD"
        'ofcttrx:usd1', // "Test USD1 Token"
        'ofcttrx:stgusd1', // "Test USD1 Token"
        'ofctxrp:rlusd', // "RLUSD"
        'ofctxrp:xsgd', // "XSGB"
        'ofctpolygon:usdc', // "USD Coin"
        'ofctpolygon:usdt', // "Tether USD"
        'ofctpolygon:xsgd', // "XSGD"
        'ofctnear:usdc', // "USD Coin"
        'ofctbaseeth', // "Base Sepolia Chain"
      ];

      if (!knownExceptions.includes(token.name)) {
        const fullName = token.fullName.toLowerCase();
        const hasTestIndicator =
          fullName.startsWith('test ') || fullName.startsWith('testnet ') || fullName.includes('test');

        hasTestIndicator.should.be.true(
          `Testnet token ${token.name} has fullName "${token.fullName}" which should include "test" or "testnet"`
        );
      }
    });
  });

  it('should maintain network consistency between mainnet and testnet token pairs', function () {
    // Test for network tokens (those with a colon in the name)
    const mainnetNetworkTokens = ofcCoins.filter((token) => token.network.type === NetworkType.MAINNET);

    mainnetNetworkTokens.forEach((mainToken) => {
      // Replace 'ofc' with 'ofct' to get expected testnet token name
      const expectedTestTokenName = mainToken.name.replace(/^ofc/, 'ofct');

      // Find the matching testnet token if it exists
      const testToken = ofcCoins.find((token) => token.name === expectedTestTokenName);

      if (testToken) {
        testToken.network.type.should.equal(
          NetworkType.TESTNET,
          `Token ${expectedTestTokenName} should be on testnet network`
        );
      }
    });
  });

  it('should maintain matching decimal places between mainnet and testnet pairs when possible', function () {
    // Known exceptions where mainnet and testnet tokens intentionally have different decimal places
    const knownDecimalExceptions = [
      { mainnet: 'ofcdot', testnet: 'ofctdot' }, // 10 vs 12 decimal places
      { mainnet: 'ofcsol:usdt', testnet: 'ofctsol:usdt' }, // 6 vs 9 decimal places
      { mainnet: 'ofcsol:usdc', testnet: 'ofctsol:usdc' }, // 6 vs 9 decimal places
      { mainnet: 'ofcsol:srm', testnet: 'ofctsol:srm' }, // 6 vs 9 decimal places
      { mainnet: 'ofcsol:slnd', testnet: 'ofctsol:slnd' }, // 6 vs 9 decimal places
      { mainnet: 'ofcsol:ray', testnet: 'ofctsol:ray' }, // 6 vs 9 decimal places
      { mainnet: 'ofcsol:orca', testnet: 'ofctsol:orca' }, // 6 vs 9 decimal places
    ];

    const mainnetBasicTokens = ofcCoins.filter((token) => token.network.type === NetworkType.MAINNET);

    mainnetBasicTokens.forEach((mainToken) => {
      const mainTokenName = mainToken.name;
      const expectedTestTokenName = mainTokenName.replace(/^ofc/, 'ofct');

      // Skip known exceptions where decimal places are intentionally different
      const isException = knownDecimalExceptions.some((exception) => exception.mainnet === mainTokenName);

      if (isException) {
        return;
      }

      // Find the matching testnet token if it exists
      const testToken = ofcCoins.find((token) => token.name === expectedTestTokenName);

      if (testToken) {
        testToken.decimalPlaces.should.equal(
          mainToken.decimalPlaces,
          `Token ${mainToken.name} has ${mainToken.decimalPlaces} decimal places, but its testnet counterpart ${testToken.name} has ${testToken.decimalPlaces}`
        );
      }
    });
  });
});
