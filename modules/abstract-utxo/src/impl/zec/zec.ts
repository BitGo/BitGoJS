/**
 * @prettier
 */
import { fixedScriptWallet, hasPsbtMagic, zcashAddress } from '@bitgo/wasm-utxo';
import {
  BitGoBase,
  ExtraPrebuildParamsOptions,
  MPCAlgorithm,
  Wallet,
  UnifiedRecipientPreference,
} from '@bitgo/sdk-core';

import { AbstractUtxoCoin, ParseTransactionOptions } from '../../abstractUtxoCoin';
import type { ParsedTransaction } from '../../transaction/types';
import { stringToBufferTryFormats } from '../../transaction/decode';
import { UtxoCoinName, toWasmUtxoCoinName } from '../../names';
import { AddressCodec } from '../../transaction/recipient';

import { ZecAddressCodec } from './address';
import { resolvePsbtRecipients, PsbtRecipient } from './recipients';
import type { ZcashCoinName } from './types';

export class Zec extends AbstractUtxoCoin {
  readonly name: UtxoCoinName = 'zec';

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  /**
   * ZEC shielded (Orchard/Ironwood) custodial wallets use RedPallas threshold keys.
   * Transparent (secp256k1 multisig) flows are unaffected: MPCAlgorithm is only
   * consulted on the TSS custodial wallet-creation path.
   * @inheritdoc
   */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'redpallas';
  }

  static createInstance(bitgo: BitGoBase): Zec {
    return new Zec(bitgo);
  }

  override get addressCodec(): ZecAddressCodec {
    return new ZecAddressCodec(this.name, this.wasmName);
  }

  isValidAddress(address: string, param?: { anyFormat?: boolean; allowLightning?: boolean } | boolean): boolean {
    return this.addressCodec.isValidAddress(address);
  }

  private inferUnifiedRecipientPreference(
    recipients: { address: string | undefined }[] | undefined
  ): UnifiedRecipientPreference | undefined {
    const shieldedness = (recipients ?? []).map((recipient): UnifiedRecipientPreference | undefined => {
      const address = recipient.address;
      if (address === undefined) {
        return 'transparent';
      }
      if (AddressCodec.isScriptRecipient(address)) {
        return 'transparent';
      }
      const hasTransparentReceiver = zcashAddress.hasTransparentReceiver(address, this.wasmName);
      const hasOrchardReceiver = zcashAddress.hasOrchardReceiver(address, this.wasmName);
      return hasOrchardReceiver && !hasTransparentReceiver
        ? 'shielded'
        : hasTransparentReceiver
        ? 'transparent'
        : undefined;
    });
    if (shieldedness.includes('shielded') && shieldedness.includes('transparent')) {
      throw new Error('Mixed shielded and transparent recipients are not supported');
    }
    return shieldedness.includes('shielded') ? 'shielded' : undefined;
  }

  override async parseTransaction<TNumber extends number | bigint = number>(
    params: ParseTransactionOptions<TNumber>
  ): Promise<ParsedTransaction<TNumber>> {
    const preference =
      params.txParams.unifiedRecipientPreference ?? this.inferUnifiedRecipientPreference(params.txParams.recipients);
    return this.parseTransactionWithAddressCodec(
      params,
      new ZecAddressCodec(this.name, this.wasmName, preference ?? 'transparent')
    );
  }

  override async getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions & { wallet: Wallet }) {
    const extraParams = await super.getExtraPrebuildParams(buildParams);
    const { unifiedRecipientPreference } = buildParams;
    if (unifiedRecipientPreference === undefined) {
      return extraParams;
    }
    return { ...extraParams, unifiedRecipientPreference };
  }

  override decodeTransaction(input: Buffer | string): fixedScriptWallet.BitGoPsbt {
    const buffer = typeof input === 'string' ? stringToBufferTryFormats(input, ['hex', 'base64']) : input;
    if (!hasPsbtMagic(buffer)) {
      return super.decodeTransaction(input);
    }
    return fixedScriptWallet.ZcashPsbt.fromBytes(buffer, toWasmUtxoCoinName(this.name) as ZcashCoinName);
  }
  resolveRecipientsFromPsbt(input: Buffer | string, walletKeys: fixedScriptWallet.RootWalletKeys): PsbtRecipient[] {
    const psbt = this.decodeTransaction(input);
    if (!(psbt instanceof fixedScriptWallet.ZcashBitGoPsbt)) {
      throw new Error('expected a Zcash PSBT');
    }
    return resolvePsbtRecipients(psbt, walletKeys, this.addressCodec);
  }
}
