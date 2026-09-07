import { randomInt, randomUUID } from 'node:crypto';

import type { BitGoAPI } from '@bitgo/sdk-api';
import type { IWallet } from '@bitgo/sdk-core';

import {
  createBitGoApiClient,
  createBitGoWallet,
  getBitGoApiToken,
  isFixedScriptMainWallet,
  listBitGoWallets,
  outpointFromUnspent,
  parseBitGoCoin,
  parseBitGoEnvironment,
  responseUnspents,
  summarizeBitGoWallet,
  summarizeUnspent,
  type BitGoCoinName,
  type BitGoEnvironment,
  type BitGoWalletSummary,
  type BitGoWalletType,
} from './bitgo-api';
import { loadPox5LocalConfig, type Pox5LocalConfig } from './config';
import { HiroRegtestFundingAdapter, type ConfirmedFaucetFunding } from './funding';
import { waitFor } from './rpc';

export interface BitGoApiIntegrationContext {
  config: Pox5LocalConfig;
  coinName: BitGoCoinName;
  environment: BitGoEnvironment;
  bitgo: BitGoAPI;
  funding: HiroRegtestFundingAdapter;
  token: string;
}

export interface SelectedBitGoWallet {
  wallet: IWallet;
  summary: BitGoWalletSummary;
  listedWalletCount: number;
  eligibleWalletCount: number;
}

export interface IndexedWalletUnspent {
  outpoint: string;
  amountSats: string;
  address?: string;
  confirmations?: number;
}

export interface FaucetWalletFunding extends IndexedWalletUnspent {
  address: string;
  txid: string;
  confirmation: ConfirmedFaucetFunding;
}

export function loadBitGoApiIntegrationContext(): BitGoApiIntegrationContext {
  const profile = process.env.POX5_NETWORK;
  if (profile !== 'tbtcstx' && profile !== 'tbtcstxprivate1') {
    throw new Error('POX5_NETWORK must be tbtcstx or tbtcstxprivate1 for BitGo API integration tests');
  }
  const config = loadPox5LocalConfig({ ...process.env, POX5_FULLNODE_MODE: 'direct' });
  const coinName = parseBitGoCoin(config.coinName);
  const environment = parseBitGoEnvironment(process.env.POX5_BITGO_API_ENV ?? 'staging');
  const token = getBitGoApiToken(environment);
  const bitgo = createBitGoApiClient(environment, token);
  const funding = new HiroRegtestFundingAdapter(config, console.log);
  return { config, coinName, environment, bitgo, funding, token };
}

export async function authenticateBitGoApi(context: BitGoApiIntegrationContext): Promise<void> {
  await context.bitgo.get(context.bitgo.url('/user/me')).result();
  await context.bitgo.unlock({ otp: '0000000', duration: 3600 });
}

export async function selectRandomFundingWallet(
  context: BitGoApiIntegrationContext,
  walletPassphrase?: string
): Promise<SelectedBitGoWallet> {
  const listedWallets = await listBitGoWallets(context.bitgo, context.coinName);
  const eligibleWallets = listedWallets.filter((wallet) => isFixedScriptMainWallet(wallet));
  const summary =
    eligibleWallets.length > 0
      ? eligibleWallets[randomInt(eligibleWallets.length)]
      : await createBitGoWalletIfNeeded(context, walletPassphrase, `pox5-fund-${context.coinName}`);
  const wallet = await context.bitgo.coin(context.coinName).wallets().get({ id: summary.id });
  return {
    wallet,
    summary,
    listedWalletCount: listedWallets.length,
    eligibleWalletCount: eligibleWallets.length,
  };
}

export async function createOrGetFakeStakeWallet(
  context: BitGoApiIntegrationContext,
  walletPassphrase: string
): Promise<SelectedBitGoWallet> {
  const label = process.env.POX5_FAKE_STAKE_WALLET_LABEL?.trim() || `pox5-fake-stake-${context.coinName}`;
  if (label.length > 100 || /[\r\n]/.test(label)) throw new Error('Invalid fake-stake wallet label');
  return createOrGetDedicatedWallet(context, walletPassphrase, label);
}

export async function createOrGetLiveStakingWallet(
  context: BitGoApiIntegrationContext,
  walletPassphrase: string | undefined,
  walletType: BitGoWalletType = 'hot'
): Promise<SelectedBitGoWallet> {
  const walletId = process.env.POX5_WP_SIGN_WALLET_ID?.trim();
  if (walletId) {
    const wallet = await context.bitgo.coin(context.coinName).wallets().get({ id: walletId });
    const summary = summarizeBitGoWallet(wallet);
    if (!isFixedScriptMainWallet(summary, walletType)) {
      throw new Error(`POX5_WP_SIGN_WALLET_ID must identify a fixed-script ${walletType} main wallet`);
    }
    const expectedEnterpriseId = process.env.POX5_BITGO_ENTERPRISE_ID?.trim();
    const actualEnterpriseId = wallet.toJSON().enterprise;
    if (expectedEnterpriseId && actualEnterpriseId !== expectedEnterpriseId) {
      throw new Error('POX5_WP_SIGN_WALLET_ID does not belong to POX5_BITGO_ENTERPRISE_ID');
    }
    return { wallet, summary, listedWalletCount: 1, eligibleWalletCount: 1 };
  }
  const label =
    walletType === 'hot' ? `pox5-wp-staking-${context.coinName}` : `pox5-wp-staking-${walletType}-${context.coinName}`;
  return createOrGetDedicatedWallet(context, walletPassphrase, label, walletType);
}

async function createOrGetDedicatedWallet(
  context: BitGoApiIntegrationContext,
  walletPassphrase: string | undefined,
  label: string,
  walletType: BitGoWalletType = 'hot'
): Promise<SelectedBitGoWallet> {
  const listedWallets = await listBitGoWallets(context.bitgo, context.coinName);
  const testWallets = listedWallets.filter(
    (wallet) => wallet.label === label && isFixedScriptMainWallet(wallet, walletType)
  );
  if (testWallets.length > 1) {
    throw new Error(`Multiple PoX-5 wallets found with the dedicated test label ${label}`);
  }
  const summary =
    testWallets[0] ??
    (await createBitGoWallet(context.bitgo, context.coinName, {
      label,
      walletPassphrase,
      walletType,
      ...(process.env.POX5_BITGO_ENTERPRISE_ID ? { enterprise: process.env.POX5_BITGO_ENTERPRISE_ID } : {}),
    }));

  if (!isFixedScriptMainWallet(summary, walletType)) {
    throw new Error(`PoX-5 test wallet must be a ${walletType} on-chain main wallet`);
  }
  const wallet = await context.bitgo.coin(context.coinName).wallets().get({ id: summary.id });
  return { wallet, summary, listedWalletCount: listedWallets.length, eligibleWalletCount: testWallets.length };
}

export async function faucetFundWallet(
  context: BitGoApiIntegrationContext,
  wallet: IWallet
): Promise<FaucetWalletFunding> {
  const { address } = await wallet.createAddress();
  if (typeof address !== 'string' || address.length === 0) throw new Error('BitGo did not return a deposit address');
  const txid = await context.funding.requestFaucet(address);
  const confirmation = await context.funding.waitForConfirmed(txid);
  const unspent = await waitForWalletUnspent(context, wallet, txid, address);
  return { ...unspent, address, txid, confirmation };
}

export async function findSufficientWalletUnspent(
  wallet: IWallet,
  minimumAmountSats: string
): Promise<IndexedWalletUnspent | undefined> {
  if (!/^[1-9][0-9]*$/.test(minimumAmountSats)) throw new Error('Minimum unspent amount must be positive satoshis');
  const unspents = responseUnspents(await wallet.unspents({ limit: 100, minConfirms: 1, minValue: minimumAmountSats }));
  const minimum = BigInt(minimumAmountSats);
  for (const unspent of unspents) {
    const summary = summarizeUnspent(unspent);
    const outpoint = outpointFromUnspent(unspent);
    const amountSats = summary.amountSats;
    if (!outpoint || typeof amountSats !== 'string' || !/^[1-9][0-9]*$/.test(amountSats)) continue;
    if (BigInt(amountSats) < minimum) continue;
    if (typeof summary.confirmations === 'number' && summary.confirmations < 1) continue;
    return {
      outpoint,
      amountSats,
      ...(typeof summary.address === 'string' ? { address: summary.address } : {}),
      ...(typeof summary.confirmations === 'number' ? { confirmations: summary.confirmations } : {}),
    };
  }
  return undefined;
}

export async function waitForWalletUnspent(
  context: BitGoApiIntegrationContext,
  wallet: IWallet,
  txid: string,
  expectedAddress?: string
): Promise<IndexedWalletUnspent> {
  let indexedUnspent: IndexedWalletUnspent | undefined;
  await waitFor(
    `BitGo to index output ${txid} for wallet ${wallet.id()}`,
    async () => {
      const unspents = responseUnspents(await wallet.unspents({ limit: 100 }));
      const matchingUnspent = unspents.find((unspent) => {
        const summary = summarizeUnspent(unspent);
        const outpoint = outpointFromUnspent(unspent);
        const amountSats = summary.amountSats;
        return (
          outpoint?.startsWith(`${txid.toLowerCase()}:`) === true &&
          (expectedAddress === undefined || summary.address === undefined || summary.address === expectedAddress) &&
          typeof amountSats === 'string' &&
          /^[1-9][0-9]*$/.test(amountSats)
        );
      });
      if (!matchingUnspent) return false;
      const summary = summarizeUnspent(matchingUnspent);
      const outpoint = outpointFromUnspent(matchingUnspent);
      if (!outpoint || typeof summary.amountSats !== 'string') return false;
      indexedUnspent = {
        outpoint,
        amountSats: summary.amountSats,
        ...(typeof summary.address === 'string' ? { address: summary.address } : {}),
        ...(typeof summary.confirmations === 'number' ? { confirmations: summary.confirmations } : {}),
      };
      return true;
    },
    context.config.bitcoin.startupTimeoutMs,
    15_000
  );
  if (!indexedUnspent) throw new Error(`BitGo did not index an unspent for transaction ${txid}`);
  return indexedUnspent;
}

async function createBitGoWalletIfNeeded(
  context: BitGoApiIntegrationContext,
  walletPassphrase: string | undefined,
  labelPrefix: string
): Promise<BitGoWalletSummary> {
  if (!walletPassphrase) throw new Error('BITGO_WALLET_PASSPHRASE is required when no eligible wallet exists');
  return await createBitGoWallet(context.bitgo, context.coinName, {
    label: `${labelPrefix}-${randomUUID()}`,
    walletPassphrase,
    ...(process.env.POX5_BITGO_ENTERPRISE_ID ? { enterprise: process.env.POX5_BITGO_ENTERPRISE_ID } : {}),
  });
}
