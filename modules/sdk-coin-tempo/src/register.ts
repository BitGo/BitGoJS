import { BitGoBase } from '@bitgo/sdk-core';
import { Tempo } from './tempo';
import { Ttempo } from './ttempo';
import { Tip20Token } from './tip20Token';

/**
 * Register Tempo and TIP20 tokens with the SDK
 * @param sdk - BitGo SDK instance
 */
export const register = (sdk: BitGoBase): void => {
  // Register base Tempo coins
  sdk.register('tempo', Tempo.createInstance);
  sdk.register('ttempo', Ttempo.createInstance);

  // Register TIP20 tokens (skeleton)
  // TODO: Add actual token configurations from @bitgo/statics
  // For now, this creates an empty array which can be populated progressively
  const tip20Tokens = Tip20Token.createTokenConstructors([
    // TODO: Add TIP20 token configurations here
    // Example:
    // {
    //   type: 'tempo:usdc',
    //   coin: 'tempo',
    //   network: 'Mainnet',
    //   name: 'USD Coin on Tempo',
    //   tokenContractAddress: '0x...',
    //   decimalPlaces: 6,
    // },
  ]);

  // Register each TIP20 token with the SDK
  tip20Tokens.forEach(({ name, coinConstructor }) => {
    sdk.register(name, coinConstructor);
  });
};
