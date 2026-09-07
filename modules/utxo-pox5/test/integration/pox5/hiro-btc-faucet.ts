import type { BitGoWalletCreationCoinName } from './bitgo-api';

export interface HiroBtcFaucetProfile {
  faucetUrl: string;
  xlarge: boolean;
}

export const HIRO_BTC_FAUCET_PROFILES: Record<BitGoWalletCreationCoinName, HiroBtcFaucetProfile> = {
  tbtcstx: {
    faucetUrl: 'https://api.testnet.hiro.so/extended/v1/faucets/btc',
    xlarge: true,
  },
  tbtcstxprivate1: {
    faucetUrl: 'https://api.private-1.hiro.so/extended/v1/faucets/btc',
    xlarge: true,
  },
  tbtcstxsignet: {
    faucetUrl: 'https://api.staking-testnet.hiro.so/extended/v1/faucets/btc',
    xlarge: false,
  },
};

export const HIRO_BTC_FAUCET_COINS: readonly BitGoWalletCreationCoinName[] = [
  'tbtcstx',
  'tbtcstxprivate1',
  'tbtcstxsignet',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hiroBtcFaucetRequestUrl(
  coin: BitGoWalletCreationCoinName,
  address: string,
  faucetUrl = HIRO_BTC_FAUCET_PROFILES[coin].faucetUrl
): string {
  if (address.length === 0) throw new Error('BTC faucet address must not be empty');

  const url = new URL(faucetUrl);
  url.searchParams.set('address', address);
  if (HIRO_BTC_FAUCET_PROFILES[coin].xlarge) {
    url.searchParams.set('xlarge', 'true');
  } else {
    url.searchParams.delete('xlarge');
  }
  return url.toString();
}

export async function requestHiroBtcFaucet(
  coin: BitGoWalletCreationCoinName,
  address: string,
  options: { faucetUrl?: string; timeoutMs?: number; fetcher?: typeof fetch } = {}
): Promise<string> {
  const { faucetUrl, timeoutMs = 30_000, fetcher = globalThis.fetch } = options;
  const response = await fetcher(hiroBtcFaucetRequestUrl(coin, address, faucetUrl), {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`BTC faucet for ${coin} returned ${response.status}: ${body}`);

  const result: unknown = JSON.parse(body);
  if (!isRecord(result) || typeof result.txid !== 'string' || result.txid.length === 0) {
    throw new Error(`BTC faucet for ${coin} response did not contain a txid: ${body}`);
  }
  return result.txid;
}
