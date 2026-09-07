import { Psbt, Transaction } from '@bitgo/wasm-utxo';

import { BitcoinCoreAdapter } from './bitcoin';
import type { Pox5LocalConfig } from './config';
import { requestHiroBtcFaucet } from './hiro-btc-faucet';
import { waitFor } from './rpc';

type MempoolTransaction = {
  txid: string;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
  };
};

export type ConfirmedFaucetFunding = {
  faucetTxid: string;
  blockHash: string;
  blockHeight: number;
};

export type BtcLockProofData = {
  headerHex: string;
  txids: string[];
  txIndex: number;
  txCount: number;
  legacyTxHex: string;
};

function assertText(value: string, field: string): string {
  if (value.length === 0) throw new Error(`${field} returned an empty response`);
  return value;
}

// tbtcstxsignet uses Hiro's independent staking-testnet signet, not public Bitcoin signet.
export const HIRO_SIGNET_MEMPOOL_API = 'https://mempool.bitcoin.staking-testnet.hiro.so/api';
const HIRO_SIGNET_CHECKPOINT_HEIGHT = 100;
export const HIRO_SIGNET_CHECKPOINT_HASH = '0000019991e15b7657534ae3b332d7a618ab10bdace1ca0350f210a64e175abd';
// Since the 2026-10 chain reset, tbtcstxsignet has produced blocks on a steady ~2-minute
// cadence (observed 2026-10-15: 15 consecutive blocks exactly 120s apart). That pace
// holds only until the first 2016-block difficulty adjustment, which should pull the
// chain back toward the ~600 s nominal target (the pre-reset chain averaged ~10 minutes
// with inter-block gaps up to ~72 minutes). The confirmation timeout deliberately stays
// at 2 h so it covers both regimes and pre-reset-scale stalls.
// Schedule and measurements: modules/utxo-pox5/README.md#signet-block-schedule.
export const HIRO_SIGNET_CONFIRMATION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const TXID_PATTERN = /^[0-9a-f]{64}$/i;

export interface HiroSignetFundingOptions {
  mempoolApi?: string;
  timeoutMs?: number;
  confirmationTimeoutMs?: number;
  pollIntervalMs?: number;
  fetcher?: typeof fetch;
}

function positiveMilliseconds(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 86_400_000) {
    throw new Error(`${name} must be a positive integer no greater than 24 hours`);
  }
  return value;
}

function signetMempoolApi(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.replace(/\/$/, '').endsWith('/api')
  ) {
    throw new Error('Signet mempool API must be an HTTPS /api endpoint without credentials or query parameters');
  }
  return url.toString().replace(/\/$/, '');
}

export class HiroSignetFundingAdapter {
  private readonly mempoolApi: string;
  private readonly timeoutMs: number;
  private readonly confirmationTimeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly fetcher: typeof fetch;

  public constructor(options: HiroSignetFundingOptions = {}, private readonly logger?: (message: string) => void) {
    this.mempoolApi = signetMempoolApi(options.mempoolApi ?? HIRO_SIGNET_MEMPOOL_API);
    this.timeoutMs = positiveMilliseconds(options.timeoutMs ?? 10_000, 'Signet request timeout');
    this.confirmationTimeoutMs = positiveMilliseconds(
      options.confirmationTimeoutMs ?? HIRO_SIGNET_CONFIRMATION_TIMEOUT_MS,
      'Signet confirmation timeout'
    );
    this.pollIntervalMs = positiveMilliseconds(options.pollIntervalMs ?? 15_000, 'Signet polling interval');
    this.fetcher = options.fetcher ?? globalThis.fetch;
  }

  public async requestFaucet(address: string): Promise<string> {
    this.logger?.(`POST signet BTC faucet for ${address}`);
    return requestHiroBtcFaucet('tbtcstxsignet', address, { timeoutMs: this.timeoutMs, fetcher: this.fetcher });
  }

  public async waitForConfirmed(txid: string): Promise<ConfirmedFaucetFunding> {
    if (!TXID_PATTERN.test(txid)) throw new Error('Signet transaction id must be 64 hexadecimal characters');
    const deadline = Date.now() + this.confirmationTimeoutMs;
    const checkpoint = await this.fetcher(`${this.mempoolApi}/block-height/${HIRO_SIGNET_CHECKPOINT_HEIGHT}`, {
      signal: AbortSignal.timeout(Math.min(this.timeoutMs, this.confirmationTimeoutMs)),
    });
    if (!checkpoint.ok || (await checkpoint.text()).trim().toLowerCase() !== HIRO_SIGNET_CHECKPOINT_HASH) {
      throw new Error('Signet mempool API does not match the independent Hiro staking signet chain');
    }

    this.logger?.(`Waiting for signet transaction ${txid} confirmation`);
    while (Date.now() < deadline) {
      const response = await this.fetcher(`${this.mempoolApi}/tx/${txid}`, {
        signal: AbortSignal.timeout(Math.min(this.timeoutMs, Math.max(1, deadline - Date.now()))),
      });
      if (response.ok) {
        const value: unknown = await response.json();
        if (typeof value !== 'object' || value === null || !('txid' in value) || !('status' in value)) {
          throw new Error('Signet mempool transaction response is invalid');
        }
        const { status } = value;
        if (
          typeof value.txid !== 'string' ||
          value.txid.toLowerCase() !== txid.toLowerCase() ||
          typeof status !== 'object' ||
          status === null ||
          !('confirmed' in status) ||
          typeof status.confirmed !== 'boolean'
        ) {
          throw new Error('Signet mempool transaction response is invalid');
        }
        if (status.confirmed) {
          if (
            !('block_hash' in status) ||
            typeof status.block_hash !== 'string' ||
            !TXID_PATTERN.test(status.block_hash) ||
            !('block_height' in status) ||
            typeof status.block_height !== 'number' ||
            !Number.isSafeInteger(status.block_height) ||
            status.block_height < 0
          ) {
            throw new Error('Signet mempool confirmation has an invalid block hash or height');
          }
          const canonicalBlock = await this.fetcher(`${this.mempoolApi}/block-height/${status.block_height}`, {
            signal: AbortSignal.timeout(Math.min(this.timeoutMs, Math.max(1, deadline - Date.now()))),
          });
          if (
            !canonicalBlock.ok ||
            (await canonicalBlock.text()).trim().toLowerCase() !== status.block_hash.toLowerCase()
          ) {
            throw new Error('Signet transaction block is not on the independent Hiro staking signet chain');
          }
          return { faucetTxid: txid, blockHash: status.block_hash, blockHeight: status.block_height };
        }
      } else if (response.status !== 404) {
        throw new Error(`Signet mempool API returned HTTP ${response.status}`);
      }
      const remainingMs = deadline - Date.now();
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(this.pollIntervalMs, remainingMs)));
      }
    }
    throw new Error(`Timed out waiting for signet transaction ${txid} confirmation`);
  }
}

export class HiroRegtestFundingAdapter {
  public constructor(private readonly config: Pox5LocalConfig, private readonly logger?: (message: string) => void) {}

  public async requestFaucet(address: string): Promise<string> {
    if (this.config.profile === 'local') throw new Error('The local profile does not use a Hiro faucet');
    this.logger?.(`POST BTC faucet for ${address}`);
    const txid = await requestHiroBtcFaucet(this.config.coinName, address, {
      faucetUrl: this.config.bitcoin.faucetUrl,
      timeoutMs: this.config.bitcoin.timeoutMs,
    });
    this.logger?.(`BTC faucet accepted ${txid}`);
    return txid;
  }

  public async waitForConfirmed(txid: string): Promise<ConfirmedFaucetFunding> {
    this.logger?.(`Waiting for faucet transaction ${txid} confirmation`);
    const deadline = Date.now() + this.config.bitcoin.startupTimeoutMs;
    let lastStatus = 'unavailable';
    while (Date.now() < deadline) {
      const response = await fetch(`${this.config.bitcoin.mempoolApi}/tx/${encodeURIComponent(txid)}`, {
        signal: AbortSignal.timeout(this.config.bitcoin.timeoutMs),
      });
      if (response.ok) {
        const value = (await response.json()) as MempoolTransaction;
        lastStatus = JSON.stringify(value.status);
        if (
          value.status.confirmed &&
          value.status.block_hash !== undefined &&
          value.status.block_height !== undefined
        ) {
          return {
            faucetTxid: txid,
            blockHash: value.status.block_hash,
            blockHeight: value.status.block_height,
          };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 15_000));
    }
    throw new Error(`Timed out waiting for BTC faucet transaction ${txid}: ${lastStatus}`);
  }

  /**
   * Ensure the local Core wallet has enough confirmed balance to fund a PoX
   * lock. The faucet pays a Core-generated address, so no private key crosses
   * into the TypeScript runner.
   */
  public async ensureCoreWalletFunds(bitcoin: BitcoinCoreAdapter, minimumSats: bigint): Promise<void> {
    if (this.config.profile === 'local') {
      throw new Error('Use Bitcoin Core mining to fund the local profile');
    }
    await waitFor(
      `${this.config.coinName} Bitcoin Core readiness`,
      async () => {
        const info = await bitcoin.getBlockchainInfo();
        return info.chain === 'regtest' && info.headers >= info.blocks;
      },
      this.config.bitcoin.startupTimeoutMs
    );
    const balance = await bitcoin.getWalletBalance();
    if (BigInt(Math.floor(balance.trusted * 100_000_000)) >= minimumSats) return;

    const faucetAddress = await bitcoin.getNewAddress(`pox5-${this.config.profile}-faucet`);
    const faucetTxid = await this.requestFaucet(faucetAddress);
    await this.waitForConfirmed(faucetTxid);
    await waitFor(
      `${this.config.coinName} faucet balance in local Core wallet`,
      async () => {
        const current = await bitcoin.getWalletBalance();
        return BigInt(Math.floor(current.trusted * 100_000_000)) >= minimumSats;
      },
      this.config.bitcoin.startupTimeoutMs
    );
  }

  public async fundLock(bitcoin: BitcoinCoreAdapter, lockAddress: string, amountSats: bigint): Promise<string> {
    await this.ensureCoreWalletFunds(bitcoin, amountSats + 10_000n);
    return assertText(await bitcoin.sendToAddress(lockAddress, amountSats), 'sendtoaddress');
  }

  public async getLockProofData(txid: string, confirmation: ConfirmedFaucetFunding): Promise<BtcLockProofData> {
    const [headerResponse, txidsResponse, txCountResponse, rawResponse] = await Promise.all([
      fetch(`${this.config.bitcoin.mempoolApi}/block/${confirmation.blockHash}/header`),
      fetch(`${this.config.bitcoin.mempoolApi}/block/${confirmation.blockHash}/txids`),
      fetch(`${this.config.bitcoin.mempoolApi}/block/${confirmation.blockHash}`),
      fetch(`${this.config.bitcoin.mempoolApi}/tx/${encodeURIComponent(txid)}/hex`),
    ]);
    if (!headerResponse.ok || !txidsResponse.ok || !txCountResponse.ok || !rawResponse.ok) {
      throw new Error(`Unable to retrieve private-1 SPV data for ${txid}`);
    }
    const headerHex = (await headerResponse.text()).trim();
    const txids = (await txidsResponse.json()) as unknown;
    const block = (await txCountResponse.json()) as { tx_count?: unknown };
    const segwitTxHex = (await rawResponse.text()).trim();
    if (!Array.isArray(txids) || !txids.every((value) => typeof value === 'string')) {
      throw new Error('private-1 mempool txids response was invalid');
    }
    const txIndex = txids.indexOf(txid);
    if (txIndex < 0) throw new Error(`Transaction ${txid} was not found in block ${confirmation.blockHash}`);
    if (typeof block.tx_count !== 'number') throw new Error('private-1 mempool block response had no tx_count');
    const segwitTransaction = Transaction.fromBytes(Buffer.from(segwitTxHex, 'hex'));
    const legacyTransaction = Psbt.create(segwitTransaction.version(), segwitTransaction.lockTime());
    for (const input of segwitTransaction.getInputs()) {
      // These placeholder UTXO fields are omitted from the unsigned transaction bytes.
      legacyTransaction.addInput(
        input.previousOutput.txid,
        input.previousOutput.vout,
        1n,
        Buffer.from([0x51]),
        input.sequence
      );
    }
    for (const output of segwitTransaction.getOutputs()) {
      legacyTransaction.addOutput(output.script, output.value);
    }
    const legacyTxHex = Buffer.from(legacyTransaction.getUnsignedTx()).toString('hex');
    return { headerHex, txids, txIndex, txCount: block.tx_count, legacyTxHex };
  }
}
