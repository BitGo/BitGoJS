import * as utxolib from '@bitgo/utxo-lib';
import { Dimensions } from '@bitgo/unspents';
import { fixedScriptWallet, utxolibCompat } from '@bitgo/wasm-utxo';

type RootWalletKeys = utxolib.bitgo.RootWalletKeys;
type WalletUnspent<TNumber extends number | bigint> = utxolib.bitgo.WalletUnspent<TNumber>;

const { chainCodesP2tr, chainCodesP2trMusig2 } = utxolib.bitgo;

type ChainCode = utxolib.bitgo.ChainCode;

/**
 * Backend to use for PSBT creation.
 * - 'wasm-utxo': Use wasm-utxo for PSBT creation (default)
 * - 'utxolib': Use utxolib for PSBT creation (legacy)
 */
export type PsbtBackend = 'wasm-utxo' | 'utxolib';

/**
 * Check if a chain code is for a taproot script type
 */
function isTaprootChain(chain: ChainCode): boolean {
  return (
    (chainCodesP2tr as readonly number[]).includes(chain) || (chainCodesP2trMusig2 as readonly number[]).includes(chain)
  );
}

/**
 * Convert utxolib Network to wasm-utxo network name
 */
function toNetworkName(network: utxolib.Network): utxolibCompat.UtxolibName {
  const networkName = utxolib.getNetworkName(network);
  if (!networkName) {
    throw new Error(`Invalid network`);
  }
  return networkName;
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
 * Create a backup key recovery PSBT using utxolib (legacy implementation)
 */
function createBackupKeyRecoveryPsbtUtxolib(
  network: utxolib.Network,
  rootWalletKeys: RootWalletKeys,
  unspents: WalletUnspent<bigint>[],
  options: CreateBackupKeyRecoveryPsbtOptions
): utxolib.bitgo.UtxoPsbt {
  const { feeRateSatVB, recoveryDestination, keyRecoveryServiceFee, keyRecoveryServiceFeeAddress } = options;

  const psbt = utxolib.bitgo.createPsbtForNetwork({ network });
  utxolib.bitgo.addXpubsToPsbt(psbt, rootWalletKeys);
  unspents.forEach((unspent) => {
    utxolib.bitgo.addWalletUnspentToPsbt(psbt, unspent, rootWalletKeys, 'user', 'backup');
  });

  let dimensions = Dimensions.fromPsbt(psbt).plus(
    Dimensions.fromOutput({ script: utxolib.address.toOutputScript(recoveryDestination, network) })
  );

  if (keyRecoveryServiceFeeAddress) {
    dimensions = dimensions.plus(
      Dimensions.fromOutput({
        script: utxolib.address.toOutputScript(keyRecoveryServiceFeeAddress, network),
      })
    );
  }

  const approximateFee = BigInt(dimensions.getVSize() * feeRateSatVB);
  const totalInputAmount = utxolib.bitgo.unspentSum(unspents, 'bigint');
  const recoveryAmount = totalInputAmount - approximateFee - keyRecoveryServiceFee;

  if (recoveryAmount < BigInt(0)) {
    throw new InsufficientFundsError(totalInputAmount, approximateFee, keyRecoveryServiceFee, recoveryAmount);
  }

  psbt.addOutput({ script: utxolib.address.toOutputScript(recoveryDestination, network), value: recoveryAmount });

  if (keyRecoveryServiceFeeAddress) {
    psbt.addOutput({
      script: utxolib.address.toOutputScript(keyRecoveryServiceFeeAddress, network),
      value: keyRecoveryServiceFee,
    });
  }

  return psbt;
}

/**
 * Check if the network is a Zcash network
 */
function isZcashNetwork(networkName: utxolibCompat.UtxolibName): boolean {
  return networkName === 'zcash' || networkName === 'zcashTest';
}

/**
 * Default block heights for Zcash networks if not provided.
 * These should be set to a height after the latest network upgrade.
 * TODO(BTC-2901): get the height from blockchair API instead of hardcoding.
 */
const ZCASH_DEFAULT_BLOCK_HEIGHTS: Record<string, number> = {
  zcash: 3146400,
  zcashTest: 3536500,
};

/**
 * Create a backup key recovery PSBT using wasm-utxo
 */
function createBackupKeyRecoveryPsbtWasm(
  network: utxolib.Network,
  rootWalletKeys: RootWalletKeys,
  unspents: WalletUnspent<bigint>[],
  options: CreateBackupKeyRecoveryPsbtOptions
): utxolib.bitgo.UtxoPsbt {
  const { feeRateSatVB, recoveryDestination, keyRecoveryServiceFee, keyRecoveryServiceFeeAddress } = options;

  const networkName = toNetworkName(network);

  // Create PSBT with wasm-utxo and add wallet inputs
  // wasm-utxo's RootWalletKeys.from() accepts utxolib's RootWalletKeys format (IWalletKeys interface)
  let wasmPsbt: fixedScriptWallet.BitGoPsbt;

  if (isZcashNetwork(networkName)) {
    // For Zcash, use ZcashBitGoPsbt which requires block height to determine consensus branch ID
    const blockHeight = options.blockHeight ?? ZCASH_DEFAULT_BLOCK_HEIGHTS[networkName];
    wasmPsbt = fixedScriptWallet.ZcashBitGoPsbt.createEmpty(networkName as 'zcash' | 'zcashTest', rootWalletKeys, {
      blockHeight,
    });
  } else {
    wasmPsbt = fixedScriptWallet.BitGoPsbt.createEmpty(networkName, rootWalletKeys);
  }

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

  // Convert wasm-utxo PSBT to utxolib PSBT for dimension calculation and output addition
  const psbt = utxolib.bitgo.createPsbtFromBuffer(Buffer.from(wasmPsbt.serialize()), network);

  let dimensions = Dimensions.fromPsbt(psbt).plus(
    Dimensions.fromOutput({ script: utxolib.address.toOutputScript(recoveryDestination, network) })
  );

  if (keyRecoveryServiceFeeAddress) {
    dimensions = dimensions.plus(
      Dimensions.fromOutput({
        script: utxolib.address.toOutputScript(keyRecoveryServiceFeeAddress, network),
      })
    );
  }

  const approximateFee = BigInt(dimensions.getVSize() * feeRateSatVB);
  const totalInputAmount = utxolib.bitgo.unspentSum(unspents, 'bigint');
  const recoveryAmount = totalInputAmount - approximateFee - keyRecoveryServiceFee;

  if (recoveryAmount < BigInt(0)) {
    throw new InsufficientFundsError(totalInputAmount, approximateFee, keyRecoveryServiceFee, recoveryAmount);
  }

  psbt.addOutput({ script: utxolib.address.toOutputScript(recoveryDestination, network), value: recoveryAmount });

  if (keyRecoveryServiceFeeAddress) {
    psbt.addOutput({
      script: utxolib.address.toOutputScript(keyRecoveryServiceFeeAddress, network),
      value: keyRecoveryServiceFee,
    });
  }

  return psbt;
}

/**
 * Create a backup key recovery PSBT.
 *
 * @param network - The network for the PSBT
 * @param rootWalletKeys - The wallet keys
 * @param unspents - The unspents to include in the PSBT
 * @param options - Options for creating the PSBT
 * @param backend - Which backend to use for PSBT creation (default: 'wasm-utxo')
 */
export function createBackupKeyRecoveryPsbt(
  network: utxolib.Network,
  rootWalletKeys: RootWalletKeys,
  unspents: WalletUnspent<bigint>[],
  options: CreateBackupKeyRecoveryPsbtOptions,
  backend: PsbtBackend = 'wasm-utxo'
): utxolib.bitgo.UtxoPsbt {
  if (options.keyRecoveryServiceFee > 0 && !options.keyRecoveryServiceFeeAddress) {
    throw new Error('keyRecoveryServiceFeeAddress is required when keyRecoveryServiceFee is provided');
  }

  if (backend === 'wasm-utxo') {
    return createBackupKeyRecoveryPsbtWasm(network, rootWalletKeys, unspents, options);
  } else {
    return createBackupKeyRecoveryPsbtUtxolib(network, rootWalletKeys, unspents, options);
  }
}

export function getRecoveryAmount(psbt: utxolib.bitgo.UtxoPsbt, address: string): bigint {
  const recoveryOutputScript = utxolib.address.toOutputScript(address, psbt.network);
  const output = psbt.txOutputs.find((o) => o.script.equals(recoveryOutputScript));
  if (!output) {
    throw new Error(`Recovery destination output not found in PSBT: ${address}`);
  }
  return output.value;
}
