import { erc20Coins } from '../../src/coins/erc20Coins';
import { cosmosTokens } from '../../src/coins/cosmosTokens';
import { avaxTokens } from '../../src/coins/avaxTokens';
import { bscTokens } from '../../src/coins/bscTokens';
import { nep141Tokens } from '../../src/coins/nep141Tokens';
import { polygonTokens } from '../../src/coins/polygonTokens';
import { NetworkType } from '../../src/networks';

describe('Token Naming Convention Tests', function () {
  const allTokens = [...erc20Coins, ...cosmosTokens, ...avaxTokens, ...bscTokens, ...nep141Tokens, ...polygonTokens];

  // Helper function to filter tokens by network type
  function getTokensByNetworkType(networkType: NetworkType) {
    return allTokens.filter((token) => token.network.type === networkType);
  }

  // Get mainnet and testnet tokens
  const mainnetTokens = getTokensByNetworkType(NetworkType.MAINNET);
  const testnetTokens = getTokensByNetworkType(NetworkType.TESTNET);

  it('should ensure testnet tokens are properly prefixed and mainnet tokens are not', function () {
    // List of testnet tokens that are exceptions to the 't' prefix rule
    const testnetPrefixExceptions: string[] = [
      'gteth',
      'hteth',
      'gusdt',
      'ghdo',
      'gterc2dp',
      'gterc6dp',
      'ghcn',
      'gterc18dp',
      'gtaave18dp',
      'gtbat18dp',
      'gtcomp18dp',
      'gtgrt18dp',
      'gtlink18dp',
      'gtmkr18dp',
      'gtsnx18dp',
      'gtuni18dp',
      'gtusdt6dp',
      'gtyfi18dp',
      'gtwbtc18dp',
      'hteth:stgusd1',
      'hteth:tsteth',
      'hteth:gousd',
      'hteth:usd1',
      'hteth:amstest',
      'hterc18dp',
      'hteth:bgerchv2',
      'hteth:aut',
      'hterc6dp',
      'hterc2dp',
      'fixed',
      'schz',
      'bgerch',
    ];

    testnetTokens.forEach((token) => {
      const tokenName = token.name;

      // Skip known exceptions
      if (testnetPrefixExceptions.includes(tokenName)) {
        return;
      }

      // All testnet tokens should start with 't'
      tokenName.should.startWith('t', `Testnet token "${tokenName}" should start with 't'`);
    });

    mainnetTokens.forEach((token) => {
      const tokenName = token.name;
      const parts = tokenName.split(':');
      const prefix = parts[0];

      // If token name has a colon, check the prefix; otherwise, check the whole name
      const nameToCheck = parts.length > 1 ? prefix : tokenName;

      // List of mainnet tokens that legitimately start with 't'
      const allowedTPrefixMainnet: string[] = [
        'threshold',
        'taud',
        'tbill',
        'tbtc1',
        'tbtc2',
        'tcad',
        'tco',
        'tel',
        'ten',
        'tenx',
        'tgbp',
        'thkd',
        'thunder',
        'tiox',
        'tknt',
        'tko',
        'tkx',
        'tlab',
        'tlm',
        'tlos',
        'tnt',
        'tok',
        'trac',
        'traxx',
        'trb',
        'tribe',
        'tribl',
        'trl',
        'troy',
        'trst',
        'tru',
        'truf',
        'trufv2',
        'tryb',
        'tryx',
        'tst',
        'tusd',
        'txl',
        'tomobear',
        'tomobull',
        'trxbear',
        'trxbull',
        'trxhedge',
        'telegramdao',
        'term',
        'tio',
        'tokamak',
        'toke',
        'token',
        'tomi',
        'tomobear2',
        'trumplose',
        'trumpwin',
        'trx-erc20',
        'trxdoom',
        'trxmoon',
        'trybbear',
        'trybbull',
        'tsuka',
        'toncoin',
      ];

      if (allowedTPrefixMainnet.includes(nameToCheck)) {
        return;
      }

      // Mainnet tokens should not start with 't'
      nameToCheck.startsWith('t').should.be.false(`Mainnet token "${tokenName}" should not start with 't'`);
    });
  });

  it('should have matching network prefixes between mainnet and testnet token pairs', function () {
    // Only test tokens that follow the network:token pattern
    const tokensWithColon = allTokens.filter((token) => token.name.includes(':'));

    // Group tokens by their base name (removing 't' prefix for testnet)
    const tokensByBase = new Map<
      string,
      { token: unknown; networkPrefix: string; tokenId: string; isTestnet: boolean }[]
    >();

    tokensWithColon.forEach((token) => {
      const tokenName = token.name;
      const parts = tokenName.split(':');
      const networkPrefix = parts[0];
      const tokenId = parts[1];

      const knownNetworkExceptions = ['hteth'];
      if (knownNetworkExceptions.includes(networkPrefix)) {
        return; // Skip known exceptions
      }

      // For testnet tokens, remove the 't' prefix to get the base network name
      let baseNetworkName: string;
      if (token.network.type === NetworkType.TESTNET) {
        baseNetworkName = networkPrefix.startsWith('t') ? networkPrefix.substring(1) : networkPrefix; // Remove 't' prefix
      } else {
        baseNetworkName = networkPrefix;
      }

      // Create a key with the base network name and token identifier
      const key = `${baseNetworkName}:${tokenId}`;

      if (!tokensByBase.has(key)) {
        tokensByBase.set(key, []);
      }

      tokensByBase.get(key)?.push({
        token,
        networkPrefix,
        tokenId,
        isTestnet: token.network.type === NetworkType.TESTNET,
      });
    });

    // Check pairs to ensure proper testnet/mainnet naming convention
    tokensByBase.forEach((tokenVersions, _key) => {
      // If there are multiple versions of the same token (testnet and mainnet)
      if (tokenVersions.length > 1) {
        const testnetVersions = tokenVersions.filter(
          (v): v is (typeof tokenVersions)[number] & { isTestnet: true } => v.isTestnet
        );
        const mainnetVersions = tokenVersions.filter(
          (v): v is (typeof tokenVersions)[number] & { isTestnet: false } => !v.isTestnet
        );

        // Only check if we have both testnet and mainnet versions
        if (testnetVersions.length > 0 && mainnetVersions.length > 0) {
          testnetVersions.forEach((testnetVersion: any) => {
            mainnetVersions.forEach((mainnetVersion: any) => {
              // Special cases for tokens which don't follow the pattern
              if (
                (testnetVersion.networkPrefix === 'ofct' && mainnetVersion.networkPrefix === 'ofc') ||
                (testnetVersion.networkPrefix === 'thash' && mainnetVersion.networkPrefix === 'hash') ||
                (testnetVersion.networkPrefix === 'tpolygon' && mainnetVersion.networkPrefix === 'polygon')
              ) {
                return; // Skip the check for these special cases
              }

              // Skip tokens with known prefix mismatches
              const knownMismatches: string[] = [];

              if (knownMismatches.some((m) => mainnetVersion.token.name.includes(m))) {
                return; // Skip known mismatches
              }

              // Testnet version should be 't' + mainnet network prefix
              testnetVersion.networkPrefix.should.equal(
                `t${mainnetVersion.networkPrefix}`,
                `Testnet token ${testnetVersion.token.name} should have network prefix 't${mainnetVersion.networkPrefix}'`
              );
            });
          });
        }
      }
    });
  });

  it('should maintain matching decimal places between mainnet and testnet pairs when possible', function () {
    // Only test tokens that follow the network:token pattern
    const tokensWithColon = allTokens.filter((token) => token.name.includes(':'));

    // Known exceptions where mainnet and testnet tokens intentionally have different decimal places
    const knownDecimalExceptions: { mainnet: string; testnet: string }[] = [
      { mainnet: 'eth:dot', testnet: 'teth:dot' }, // 10 vs 12 decimal places
      { mainnet: 'eth:usdc', testnet: 'teth:usdc' }, // 6 vs 18 decimal places
      { mainnet: 'eth:usdt', testnet: 'teth:usdt' }, // 6 vs 18 decimal places
      { mainnet: 'eth:link', testnet: 'teth:link' }, // 18 vs 6 decimal places
    ];

    // Group tokens by their base token identifier and compatible network prefixes
    const tokenPairs = new Map<string, { token: any; networkPrefix: string; isTestnet: boolean }[]>();

    tokensWithColon.forEach((token) => {
      const tokenName = token.name;
      const parts = tokenName.split(':');
      const networkPrefix = parts[0];
      const tokenId = parts[1];

      const knownNetworkExceptions = ['hteth'];
      if (knownNetworkExceptions.includes(networkPrefix)) {
        return; // Skip known exceptions
      }

      // For testnet tokens, get the equivalent mainnet prefix
      let baseNetworkName: string;
      if (token.network.type === NetworkType.TESTNET) {
        baseNetworkName = networkPrefix.startsWith('t') ? networkPrefix.substring(1) : networkPrefix;
      } else {
        baseNetworkName = networkPrefix;
      }

      // Create a key that combines the base network name and token identifier
      const key = `${baseNetworkName}:${tokenId}`;

      if (!tokenPairs.has(key)) {
        tokenPairs.set(key, []);
      }
      tokenPairs.get(key)?.push({
        token,
        networkPrefix,
        isTestnet: token.network.type === NetworkType.TESTNET,
      });
    });

    // Check that decimal places match between testnet and mainnet tokens
    tokenPairs.forEach((tokens, _tokenId) => {
      // If there are both mainnet and testnet versions of this token
      if (tokens.length > 1) {
        const testnetTokens = tokens.filter(
          (t: { token: any; networkPrefix: string; isTestnet: boolean }) => t.isTestnet
        );
        const mainnetTokens = tokens.filter(
          (t: { token: any; networkPrefix: string; isTestnet: boolean }) => !t.isTestnet
        );

        if (testnetTokens.length > 0 && mainnetTokens.length > 0) {
          testnetTokens.forEach((testnetToken: { token: any; networkPrefix: string; isTestnet: boolean }) => {
            // For debugging token pairs
            // console.log({ testnetTokens, mainnetTokens });

            mainnetTokens.forEach((mainnetToken: { token: any; networkPrefix: string; isTestnet: boolean }) => {
              // Skip checking decimal places for known exceptions
              const isException = knownDecimalExceptions.some(
                (exception) =>
                  mainnetToken.token.name === exception.mainnet && testnetToken.token.name === exception.testnet
              );

              if (isException) {
                return; // Skip this check for known exceptions
              }

              testnetToken.token.decimalPlaces.should.equal(
                mainnetToken.token.decimalPlaces,
                `Token pair ${mainnetToken.token.name}/${testnetToken.token.name} should have matching decimal places`
              );
            });
          });
        }
      }
    });
  });

  it('should ensure all token names are lowercase', function () {
    // List of tokens that are exceptions to the lowercase rule
    const lowercaseExceptions: string[] = ['tpolygon:BitGoTest'];

    allTokens.forEach((token) => {
      const tokenName = token.name;
      // Skip known exceptions
      if (lowercaseExceptions.includes(tokenName)) {
        return;
      }
      tokenName.should.equal(tokenName.toLowerCase(), `Token "${tokenName}" should be lowercase`);
    });
  });

  it('should have consistent naming for non-colon tokens', function () {
    // Get base coins (without colons)
    const baseCoins = allTokens.filter((token) => !token.name.includes(':'));

    // Group by basename (removing 't' prefix for testnet)
    const tokensByBase = new Map<string, { token: any; name: string; isTestnet: boolean }[]>();

    baseCoins.forEach((token) => {
      const tokenName = token.name;
      let baseName: string;

      // For testnet tokens, remove the 't' prefix to get the base name
      if (token.network.type === NetworkType.TESTNET && tokenName.startsWith('t')) {
        baseName = tokenName.substring(1); // Remove 't' prefix
      } else {
        baseName = tokenName;
      }

      // Skip special cases that legitimately start with 't'
      const legitimateTPrefixTokens: string[] = [
        'threshold',
        'taud',
        'tbill',
        'tbtc1',
        'tbtc2',
        'tcad',
        'tel',
        'tenx',
        'tgbp',
        'token',
        'tusd',
      ];
      if (legitimateTPrefixTokens.includes(baseName)) {
        return;
      }

      if (!tokensByBase.has(baseName)) {
        tokensByBase.set(baseName, []);
      }

      tokensByBase.get(baseName)?.push({
        token,
        name: tokenName,
        isTestnet: token.network.type === NetworkType.TESTNET,
      });
    });

    // Check pairs
    tokensByBase.forEach((versions, _baseName) => {
      // If we have multiple versions of the same base coin
      if (versions.length > 1) {
        const testnetVersions = versions.filter((v: { token: any; name: string; isTestnet: boolean }) => v.isTestnet);
        const mainnetVersions = versions.filter((v: { token: any; name: string; isTestnet: boolean }) => !v.isTestnet);

        // Check if we have both testnet and mainnet versions
        if (testnetVersions.length > 0 && mainnetVersions.length > 0) {
          testnetVersions.forEach((testnetVersion: { token: any; name: string; isTestnet: boolean }) => {
            mainnetVersions.forEach((mainnetVersion: { token: any; name: string; isTestnet: boolean }) => {
              // Testnet name should be 't' + mainnet name
              testnetVersion.name.should.equal(
                `t${mainnetVersion.name}`,
                `Testnet token ${testnetVersion.token.name} should be named 't${mainnetVersion.name}'`
              );
            });
          });
        }
      }
    });
  });
});
