export type KrsProvider = {
  feeType: 'flatUsd';
  feeAmount: number;
  supportedCoins: string[];
  feeAddresses?: Record<string, string>;
};

// KRS providers and their fee structures
export const krsProviders: Record<string, KrsProvider> = {
  keyternal: {
    feeType: 'flatUsd',
    feeAmount: 99,
    supportedCoins: ['btc', 'eth'],
    feeAddresses: {
      btc: '', // TODO [BG-6965] Get address from Keyternal - recovery will fail for now until Keyternal is ready
    },
  },
  bitgoKRSv2: {
    feeType: 'flatUsd',
    feeAmount: 0, // we will receive payments off-chain
    supportedCoins: ['btc', 'eth'],
  },
  dai: {
    feeType: 'flatUsd',
    feeAmount: 0, // dai will receive payments off-chain
    supportedCoins: ['btc', 'eth', 'xlm', 'xrp', 'dash', 'zec', 'ltc', 'bch', 'bsv', 'bcha'],
  },
};
