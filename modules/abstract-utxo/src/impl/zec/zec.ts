/**
 * @prettier
 */
import {
  address as wasmAddress,
  fixedScriptWallet,
  hasPsbtMagic,
  isWasmUtxoError,
  zcashAddress as wasmZcashAddress,
} from '@bitgo/wasm-utxo';
import { BitGoBase, ExtraPrebuildParamsOptions, Wallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { stringToBufferTryFormats } from '../../transaction/decode';
import { UtxoCoinName } from '../../names';

import { resolvePsbtRecipients, ResolvePsbtRecipientsOptions, PsbtRecipient } from './recipients';

/**
 * Parse `address` as a ZIP-316 Unified Address for `network`, or return `undefined` if it isn't
 * one (malformed, wrong network, or not bech32m-shaped at all).
 */
function tryParseUnifiedAddress(
  address: string,
  network: 'zec' | 'tzec'
): fixedScriptWallet.ZcashUnifiedAddress | undefined {
  try {
    return fixedScriptWallet.ZcashUnifiedAddress.parse(address, network);
  } catch (e) {
    return undefined;
  }
}

export class Zec extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'zec';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): Zec {
    return new Zec(bitgo);
  }

  /**
   * Forward `unifiedRecipientPreference` alongside the standard extra build params. Zcash builds
   * that carry this preference always go through the wasm-utxo (Ironwood/v6-capable) build path
   * on Wallet Platform rather than the legacy utxolib path, since utxolib has no notion of
   * Unified Addresses or shielded outputs.
   */
  override async getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions & { wallet: Wallet }) {
    const extraParams = await super.getExtraPrebuildParams(buildParams);
    const unifiedRecipientPreference = buildParams.unifiedRecipientPreference as string | undefined;
    if (unifiedRecipientPreference === undefined) {
      return extraParams;
    }
    return { ...extraParams, unifiedRecipientPreference };
  }

  /**
   * In addition to ordinary transparent addresses, Zcash accepts ZIP-316 Unified Addresses that
   * carry a transparent receiver, an Orchard/Ironwood receiver, or both. `unifiedRecipientPreference`
   * (which of those receivers a build should spend to) is not this method's concern — it only
   * answers whether `address` is a spendable address at all.
   */
  override isValidAddress(
    address: string,
    param?: { anyFormat?: boolean; allowLightning?: boolean } | boolean
  ): boolean {
    const unifiedAddress = tryParseUnifiedAddress(address, this.name as 'zec' | 'tzec');
    if (unifiedAddress !== undefined) {
      return unifiedAddress.transparentScript !== undefined || unifiedAddress.orchardReceiver !== undefined;
    }
    return super.isValidAddress(address, param);
  }

  /**
   * Resolve `address` to an output script. For a Unified Address, `unifiedRecipientPreference ===
   * 'shielded'` resolves to the raw 43-byte Orchard/Ironwood receiver (a shielded output, no
   * scriptPubKey) instead of the default transparent scriptPubKey. Non-Unified addresses and any
   * other `unifiedRecipientPreference` value are unaffected and resolve exactly as the base
   * implementation would.
   */
  override resolveOutputScript(address: string, unifiedRecipientPreference?: string): Uint8Array {
    if (unifiedRecipientPreference === 'shielded') {
      return wasmZcashAddress.toShieldedReceiverWithCoin(address, this.name);
    }
    return wasmAddress.toOutputScriptWithCoin(address, this.name);
  }

  /**
   * Zcash v6 (Ironwood) PSBTs carry their shielded side as an orchard PCZT and cannot be
   * deserialized by the generic `ZcashBitGoPsbt` — attempt that first (the common, non-shielding
   * case) and fall back to `ZcashIronwoodBitGoPsbt.fromBytes` for v6-shaped bytes.
   */
  override decodeTransaction(input: Buffer | string): fixedScriptWallet.BitGoPsbt {
    const buffer = typeof input === 'string' ? stringToBufferTryFormats(input, ['hex', 'base64']) : input;
    if (!hasPsbtMagic(buffer)) {
      return super.decodeTransaction(input);
    }
    try {
      return fixedScriptWallet.ZcashBitGoPsbt.fromBytes(buffer, this.name as 'zec' | 'tzec');
    } catch (e) {
      // `ZcashBitGoPsbt.fromBytes` signals v6 (Ironwood) bytes with a plain Error (not a
      // WasmUtxoError) telling the caller to use `ZcashIronwoodBitGoPsbt.fromBytes` instead —
      // see its doc comment. Fall back for that message as well as wasm-layer errors.
      if (isWasmUtxoError(e) || (e instanceof Error && e.message.includes('v6 (Ironwood)'))) {
        return fixedScriptWallet.ZcashIronwoodBitGoPsbt.fromBytes(buffer, this.name as 'zec' | 'tzec');
      }
      throw e;
    }
  }

  override decodeTransactionFromPrebuild(prebuild: {
    txHex?: string;
    txBase64?: string;
    txHexPsbt?: string;
  }): fixedScriptWallet.BitGoPsbt {
    const string = prebuild.txHexPsbt ?? prebuild.txHex ?? prebuild.txBase64;
    if (!string) {
      throw new Error('missing required txHex or txBase64 property');
    }
    return this.decodeTransaction(string);
  }

  /**
   * Decode a Zcash PSBT (v4 Sapling-shaped or v6 Ironwood) and resolve its recipient list.
   * The decode-side counterpart of the wallet-platform build path's recipient resolution:
   * shielded outputs resolve to their single-receiver Orchard Unified Address, transparent
   * outputs to their transparent address. Change and custom-change outputs are excluded.
   */
  resolveRecipientsFromPsbt(
    input: Buffer | string,
    walletKeys: fixedScriptWallet.RootWalletKeys,
    opts: ResolvePsbtRecipientsOptions = {}
  ): PsbtRecipient[] {
    const psbt = this.decodeTransaction(input);
    if (!(psbt instanceof fixedScriptWallet.ZcashBitGoPsbt)) {
      throw new Error('expected a Zcash PSBT');
    }
    return resolvePsbtRecipients(psbt, walletKeys, opts);
  }
}
