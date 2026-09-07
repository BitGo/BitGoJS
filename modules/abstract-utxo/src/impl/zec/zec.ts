/**
 * @prettier
 */
import { fixedScriptWallet, hasPsbtMagic, isWasmUtxoError } from '@bitgo/wasm-utxo';
import { BitGoBase, ExtraPrebuildParamsOptions, Wallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin, ParseTransactionOptions, VerifyTransactionOptions } from '../../abstractUtxoCoin';
import { stringToBufferTryFormats } from '../../transaction/decode';
import type { UnifiedRecipientPreference } from '../../transaction/recipient';
import type { ParsedTransaction } from '../../transaction/types';
import { UtxoCoinName } from '../../names';

import { ZcashAddressCodec, tryParseUnifiedAddress } from './addressCodec';
import { resolvePsbtRecipients, ResolvePsbtRecipientsOptions, PsbtRecipient } from './recipients';

function getUnifiedRecipientPreference<TNumber extends number | bigint>(
  txParams: ParseTransactionOptions<TNumber>['txParams']
): UnifiedRecipientPreference | undefined {
  return (
    txParams as ParseTransactionOptions<TNumber>['txParams'] & {
      unifiedRecipientPreference?: UnifiedRecipientPreference;
    }
  ).unifiedRecipientPreference;
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
    const unifiedRecipientPreference = buildParams.unifiedRecipientPreference as UnifiedRecipientPreference | undefined;
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

  override parseTransaction<TNumber extends number | bigint = number>(
    params: ParseTransactionOptions<TNumber>
  ): Promise<ParsedTransaction<TNumber>> {
    return this.parseTransactionWithAddressCodec(
      params,
      new ZcashAddressCodec(this.name as 'zec' | 'tzec', getUnifiedRecipientPreference(params.txParams))
    );
  }

  override verifyTransaction<TNumber extends number | bigint = number>(
    params: VerifyTransactionOptions<TNumber>
  ): Promise<boolean> {
    return this.verifyTransactionWithAddressCodec(
      params,
      new ZcashAddressCodec(this.name as 'zec' | 'tzec', getUnifiedRecipientPreference(params.txParams))
    );
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
