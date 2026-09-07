import { Psbt, Transaction } from '@bitgo/wasm-utxo';

import { BitcoinCoreAdapter } from './bitcoin';
import type { Pox5LocalConfig } from './config';
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

export class HiroRegtestFundingAdapter {
  public constructor(private readonly config: Pox5LocalConfig, private readonly logger?: (message: string) => void) {}

  public async requestFaucet(address: string): Promise<string> {
    if (this.config.profile === 'local') throw new Error('The local profile does not use a Hiro faucet');
    this.logger?.(`POST BTC faucet for ${address}`);
    const response = await fetch(
      `${this.config.bitcoin.faucetUrl}?address=${encodeURIComponent(address)}&xlarge=true`,
      { method: 'POST', signal: AbortSignal.timeout(this.config.bitcoin.timeoutMs) }
    );
    const body = await response.text();
    if (!response.ok) throw new Error(`BTC faucet returned ${response.status}: ${body}`);
    const value = JSON.parse(body) as { txid?: unknown };
    if (typeof value.txid !== 'string') throw new Error(`BTC faucet response did not contain txid: ${body}`);
    this.logger?.(`BTC faucet accepted ${value.txid}`);
    return value.txid;
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
