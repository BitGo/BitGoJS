/**
 * @prettier
 */
import { fixedScriptWallet, hasPsbtMagic, zcashAddress as wasmZcashAddress } from '@bitgo/wasm-utxo';
import { BitGoBase, ExtraPrebuildParamsOptions, Wallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { stringToBufferTryFormats } from '../../transaction/decode';
import { UtxoCoinName } from '../../names';

import { resolvePsbtRecipients, PsbtRecipient } from './recipients';

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
    try {
      const unifiedAddress = fixedScriptWallet.ZcashUnifiedAddress.parse(address, this.name as 'zec' | 'tzec');
      return unifiedAddress.transparentScript !== undefined || unifiedAddress.orchardReceiver !== undefined;
    } catch (e) {
      // Not a unified address for this network — defer to the base transparent-address
      // validation.
      return super.isValidAddress(address, param);
    }
  }

  /**
   * Resolve `address` to an output script. For a Unified Address, `unifiedRecipientPreference ===
   * 'shielded'` resolves to the raw 43-byte Orchard/Ironwood receiver (a shielded output, no
   * scriptPubKey); any other value resolves the Unified Address's transparent receiver (a plain
   * transparent address decodes exactly as the base implementation would). A Unified Address
   * without a transparent receiver cannot resolve transparently and throws.
   */
  override resolveOutputScript(address: string, unifiedRecipientPreference?: string): Uint8Array {
    if (unifiedRecipientPreference === 'shielded') {
      return wasmZcashAddress.toShieldedReceiverWithCoin(address, this.name);
    }
    return wasmZcashAddress.toTransparentReceiverWithCoin(address, this.name);
  }

  /**
   * Infer the Unified-Address recipient preference from the recipients when the caller did not
   * pass one — mirroring wallet-platform's utxo-core `buildTransaction` (`inferIsShielded` +
   * `classifyRecipientShieldedness`): a Unified Address carrying only an Orchard receiver can
   * only be spent shielded, one carrying only a transparent receiver only transparently, one
   * carrying both is ambiguous, and a mix of shielded and transparent recipients is rejected.
   */
  getUnifiedRecipientPreference(txParams: {
    recipients?: { address?: string; amount: number | bigint | string }[];
    unifiedRecipientPreference?: string;
  }): string | undefined {
    if (txParams.unifiedRecipientPreference !== undefined) {
      return txParams.unifiedRecipientPreference;
    }
    const shieldedness = (txParams.recipients ?? []).map((recipient) => {
      if (recipient.address === undefined) {
        // Raw script inherently transparent.
        return 'transparent' as const;
      }
      let unified: fixedScriptWallet.ZcashUnifiedAddress | undefined;
      try {
        unified = fixedScriptWallet.ZcashUnifiedAddress.parse(recipient.address, this.name as 'zec' | 'tzec');
      } catch (e) {
        // Not a unified address: the ordinary transparent address-decoding path handles it.
        return 'transparent' as const;
      }
      if (unified.hasOrchardReceiver && unified.hasTransparentReceiver) {
        throw new Error(
          `Unified address ${recipient.address} carries both transparent and Orchard receivers; specify unifiedRecipientPreference: "shielded" or "transparent"`
        );
      }
      if (unified.hasTransparentReceiver) {
        return 'transparent' as const;
      }
      if (unified.hasOrchardReceiver) {
        return 'shielded' as const;
      }
      throw new Error(`Unified address ${recipient.address} carries no transparent or Orchard receiver`);
    });
    const hasShielded = shieldedness.includes('shielded');
    const hasTransparent = shieldedness.includes('transparent');
    if (hasShielded && hasTransparent) {
      throw new Error('Mixed shielded and transparent recipients are not supported');
    }
    return hasShielded ? 'shielded' : undefined;
  }

  /**
   * Deserialize a Zcash PSBT (v4 Sapling-shaped or v6 Ironwood). `ZcashPsbt.fromBytes` reads
   * the Zcash transaction version from the parsed metadata and returns the format-specific
   * implementation — `ZcashBitGoPsbt` for v4, `ZcashIronwoodBitGoPsbt` for v6 — so no
   * byte-level sniffing or fallback dispatch is needed here.
   */
  override decodeTransaction(input: Buffer | string): fixedScriptWallet.BitGoPsbt {
    const buffer = typeof input === 'string' ? stringToBufferTryFormats(input, ['hex', 'base64']) : input;
    if (!hasPsbtMagic(buffer)) {
      return super.decodeTransaction(input);
    }
    return fixedScriptWallet.ZcashPsbt.fromBytes(buffer, this.name as 'zec' | 'tzec');
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
   * outputs to their transparent address. Change outputs are excluded.
   */
  resolveRecipientsFromPsbt(input: Buffer | string, walletKeys: fixedScriptWallet.RootWalletKeys): PsbtRecipient[] {
    const psbt = this.decodeTransaction(input);
    if (!(psbt instanceof fixedScriptWallet.ZcashBitGoPsbt)) {
      throw new Error('expected a Zcash PSBT');
    }
    return resolvePsbtRecipients(psbt, walletKeys);
  }
}
