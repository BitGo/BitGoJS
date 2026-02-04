import * as utxolib from '@bitgo/utxo-lib';
import { CoinName, fixedScriptWallet, address as wasmAddress } from '@bitgo/wasm-utxo';

import { getNetworkFromCoinName } from '../names';
import type { WalletUnspent } from '../unspent';

type RootWalletKeys = utxolib.bitgo.RootWalletKeys;

const { chainCodesP2tr, chainCodesP2trMusig2 } = utxolib.bitgo;

type ChainCode = utxolib.bitgo.ChainCode;

/**
 * Check if a chain code is for a taproot script type
 */
export function isTaprootChain(chain: ChainCode): boolean {
  return (
    (chainCodesP2tr as readonly number[]).includes(chain) || (chainCodesP2trMusig2 as readonly number[]).includes(chain)
  );
}

class InsufficientFundsError extends Error {
  constructor(
    public totalInputAmount: bigint,
    public approximateFee: bigint,
    public krsFee: bigint,
    public recoveryAmount: bigint
  ) {
    super(
      `This wallet's balance is too low to pay the fees specified by the KRS provider.` +
        `Existing balance on wallet: ${totalInputAmount.toString()}. ` +
        `Estimated network fee for the recovery transaction: ${approximateFee.toString()}` +
        `KRS fee to pay: ${krsFee.toString()}. ` +
        `After deducting fees, your total recoverable balance is ${recoveryAmount.toString()}`
    );
  }
}

interface CreateBackupKeyRecoveryPsbtOptions {
  feeRateSatVB: number;
  recoveryDestination: string;
  keyRecoveryServiceFee: bigint;
  keyRecoveryServiceFeeAddress: string | undefined;
  /** Block height for Zcash networks (required to determine consensus branch ID) */
  blockHeight?: number;
}

/**
 * Check if the network is a Zcash network
 */
function isZcash(coinName: CoinName): coinName is 'zec' | 'tzec' {
  return coinName === 'zec' || coinName === 'tzec';
}

/**
 * Default block heights for Zcash networks if not provided.
 * These should be set to a height after the latest network upgrade.
 * TODO(BTC-2901): get the height from blockchair API instead of hardcoding.
 */
const ZCASH_DEFAULT_BLOCK_HEIGHTS: Record<'zec' | 'tzec', number> = {
  zec: 3146400,
  tzec: 3536500,
};

/**
 * Options for creating an empty wasm-utxo PSBT
 */
export interface CreateEmptyWasmPsbtOptions {
  /** Block height for Zcash networks (required to determine consensus branch ID) */
  blockHeight?: number;
}

/**
 * Create an empty wasm-utxo BitGoPsbt for a given network.
 * Handles Zcash networks specially by using ZcashBitGoPsbt.
 *
 * @param network - The network for the PSBT
 * @param rootWalletKeys - The wallet keys
 * @param options - Optional settings (e.g., blockHeight for Zcash)
 * @returns A wasm-utxo BitGoPsbt instance
 */
export function createEmptyWasmPsbt(
  coinName: CoinName,
  rootWalletKeys: RootWalletKeys,
  options?: CreateEmptyWasmPsbtOptions
): fixedScriptWallet.BitGoPsbt {
  if (isZcash(coinName)) {
    // For Zcash, use ZcashBitGoPsbt which requires block height to determine consensus branch ID
    const blockHeight = options?.blockHeight ?? ZCASH_DEFAULT_BLOCK_HEIGHTS[coinName];
    return fixedScriptWallet.ZcashBitGoPsbt.createEmpty(coinName, rootWalletKeys, {
      blockHeight,
    });
  }

  return fixedScriptWallet.BitGoPsbt.createEmpty(coinName, rootWalletKeys);
}

/**
 * Add wallet inputs from unspents to a wasm-utxo BitGoPsbt.
 * Handles taproot inputs by setting the appropriate signPath.
 *
 * @param wasmPsbt - The wasm-utxo BitGoPsbt to add inputs to
 * @param unspents - The wallet unspents to add as inputs
 * @param rootWalletKeys - The wallet keys
 */
export function addWalletInputsToWasmPsbt(
  wasmPsbt: fixedScriptWallet.BitGoPsbt,
  unspents: WalletUnspent<bigint>[],
  rootWalletKeys: RootWalletKeys
): void {
  unspents.forEach((unspent) => {
    const { txid, vout } = utxolib.bitgo.parseOutputId(unspent.id);
    const signPath: fixedScriptWallet.SignPath | undefined = isTaprootChain(unspent.chain)
      ? { signer: 'user', cosigner: 'backup' }
      : undefined;

    // prevTx may be added dynamically in backupKeyRecovery for non-segwit inputs
    const prevTx = (unspent as WalletUnspent<bigint> & { prevTx?: Buffer }).prevTx;

    wasmPsbt.addWalletInput(
      {
        txid,
        vout,
        value: unspent.value,
        prevTx: prevTx,
      },
      rootWalletKeys,
      {
        scriptId: { chain: unspent.chain, index: unspent.index },
        signPath,
      }
    );
  });
}

/**
 * Add an output to a wasm-utxo BitGoPsbt.
 *
 * @param wasmPsbt - The wasm-utxo BitGoPsbt to add the output to
 * @param address - The destination address
 * @param value - The output value in satoshis
 * @param network - The network (used to convert address to script)
 * @returns The output index
 */
export function addOutputToWasmPsbt(
  wasmPsbt: fixedScriptWallet.BitGoPsbt,
  address: string,
  value: bigint,
  coinName: CoinName
): number {
  const script = wasmAddress.toOutputScriptWithCoin(address, coinName);
  return wasmPsbt.addOutput({ script, value });
}

/**
 * Convert a wasm-utxo BitGoPsbt to a utxolib UtxoPsbt.
 *
 * @param wasmPsbt - The wasm-utxo BitGoPsbt to convert
 * @param network - The network
 * @returns A utxolib UtxoPsbt
 */
export function toPsbtToUtxolibPsbt(
  wasmPsbt: fixedScriptWallet.BitGoPsbt | utxolib.bitgo.UtxoPsbt,
  coinName: CoinName
): utxolib.bitgo.UtxoPsbt {
  if (wasmPsbt instanceof fixedScriptWallet.BitGoPsbt) {
    const network = getNetworkFromCoinName(coinName);
    return utxolib.bitgo.createPsbtFromBuffer(Buffer.from(wasmPsbt.serialize()), network);
  }
  return wasmPsbt;
}

/**
 * Create a backup key recovery PSBT using wasm-utxo
 */
function createBackupKeyRecoveryPsbtWasm(
  coinName: CoinName,
  rootWalletKeys: RootWalletKeys,
  unspents: WalletUnspent<bigint>[],
  options: CreateBackupKeyRecoveryPsbtOptions
): fixedScriptWallet.BitGoPsbt {
  const { feeRateSatVB, recoveryDestination, keyRecoveryServiceFee, keyRecoveryServiceFeeAddress } = options;

  // Create PSBT with wasm-utxo and add wallet inputs using shared utilities
  const wasmPsbt = createEmptyWasmPsbt(coinName, rootWalletKeys, { blockHeight: options.blockHeight });
  addWalletInputsToWasmPsbt(wasmPsbt, unspents, rootWalletKeys);

  // Calculate dimensions using wasm-utxo Dimensions
  let dimensions = fixedScriptWallet.Dimensions.fromPsbt(wasmPsbt).plus(
    fixedScriptWallet.Dimensions.fromOutput(recoveryDestination, coinName)
  );

  if (keyRecoveryServiceFeeAddress) {
    dimensions = dimensions.plus(fixedScriptWallet.Dimensions.fromOutput(keyRecoveryServiceFeeAddress, coinName));
  }

  const approximateFee = BigInt(dimensions.getVSize() * feeRateSatVB);
  const totalInputAmount = utxolib.bitgo.unspentSum(unspents, 'bigint');
  const recoveryAmount = totalInputAmount - approximateFee - keyRecoveryServiceFee;

  if (recoveryAmount < BigInt(0)) {
    throw new InsufficientFundsError(totalInputAmount, approximateFee, keyRecoveryServiceFee, recoveryAmount);
  }

  // Add outputs to wasm PSBT
  addOutputToWasmPsbt(wasmPsbt, recoveryDestination, recoveryAmount, coinName);

  if (keyRecoveryServiceFeeAddress) {
    addOutputToWasmPsbt(wasmPsbt, keyRecoveryServiceFeeAddress, keyRecoveryServiceFee, coinName);
  }

  return wasmPsbt;
}

/**
 * Create a backup key recovery PSBT.
 *
 * @param coinName - The coin name for the PSBT
 * @param rootWalletKeys - The wallet keys
 * @param unspents - The unspents to include in the PSBT
 * @param options - Options for creating the PSBT
 */
export function createBackupKeyRecoveryPsbt(
  coinName: CoinName,
  rootWalletKeys: RootWalletKeys,
  unspents: WalletUnspent<bigint>[],
  options: CreateBackupKeyRecoveryPsbtOptions
): fixedScriptWallet.BitGoPsbt {
  if (options.keyRecoveryServiceFee > 0 && !options.keyRecoveryServiceFeeAddress) {
    throw new Error('keyRecoveryServiceFeeAddress is required when keyRecoveryServiceFee is provided');
  }

  return createBackupKeyRecoveryPsbtWasm(coinName, rootWalletKeys, unspents, options);
}

export function getRecoveryAmount(
  psbt: fixedScriptWallet.BitGoPsbt,
  walletKeys: RootWalletKeys,
  address: string
): bigint {
  const parsedOutputs = psbt.parseOutputsWithWalletKeys(walletKeys);
  const recoveryOutput = parsedOutputs.find((o) => o.address === address);
  if (!recoveryOutput) {
    throw new Error(`Recovery destination output not found in PSBT: ${address}`);
  }
  return BigInt(recoveryOutput.value);
}
