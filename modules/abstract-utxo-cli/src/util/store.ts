import type { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import type { BitGoAPI } from '@bitgo/sdk-api';

export const store: {
  bitgo: BitGoAPI | null;
  coin: AbstractUtxoCoin | null;
} = {
  bitgo: null,
  coin: null,
};
