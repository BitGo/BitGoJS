/**
 * @prettier
 */
import { fixedScriptWallet, hasPsbtMagic, zcashAddress } from '@bitgo/wasm-utxo';
import {
  BitGoBase,
  ExtraPrebuildParamsOptions,
  HalfSignedUtxoTransaction,
  IWallet,
  MPCAlgorithm,
  SignedTransaction,
  Wallet,
  UnifiedRecipientPreference,
} from '@bitgo/sdk-core';
import _ from 'lodash';

import {
  AbstractUtxoCoin,
  ParseTransactionOptions,
  SignTransactionOptions,
  UtxoCoinSpecific,
  VerifyAddressOptions,
} from '../../abstractUtxoCoin';
import type { ParsedTransaction } from '../../transaction/types';
import { stringToBufferTryFormats } from '../../transaction/decode';
import { UtxoCoinName, toWasmUtxoCoinName } from '../../names';
import { AddressCodec } from '../../transaction/recipient';

import { ZecAddressCodec } from './address';
import { signIronwoodTransaction } from './signIronwoodTransaction';
import { resolvePsbtRecipients, PsbtRecipient } from './recipients';
import { assertShieldedWalletAddress } from './shieldedAddress';
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

  /**
   * Shielded (Orchard/Ironwood) addresses are returned with `coinSpecific.shielded` and
   * cannot be locally rederived from secp256k1 xpubs (RedPallas keychains carry none), so
   * verify them against the platform-reported diversifier/pkD instead of the fixed-script
   * transparent derivation the base class performs.
   * @inheritdoc
   */
  override async isWalletAddress(params: VerifyAddressOptions<UtxoCoinSpecific>, wallet?: IWallet): Promise<boolean> {
    if (params.coinSpecific?.shielded) {
      assertShieldedWalletAddress(this.name, params);
      return true;
    }
    return super.isWalletAddress(params, wallet);
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

  /**
   * Route v6 (Ironwood) prebuilds to the Ironwood signing path — its `sign` override requires
   * the wallet root keys to derive the ovk on the user's first signing round — and keep every
   * other prebuild (v4 and non-PSBT) on the generic path.
   */
  override async signTransaction<TNumber extends number | bigint = number>(
    params: SignTransactionOptions<TNumber>
  ): Promise<SignedTransaction | HalfSignedUtxoTransaction> {
    const txPrebuild = params?.txPrebuild;
    if (!_.isObject(txPrebuild)) {
      // Defer to the base path for its standard missing/malformed-prebuild validation errors.
      return super.signTransaction(params);
    }
    const tx = this.decodeTransactionFromPrebuild(txPrebuild);
    if (!(tx instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt)) {
      return super.signTransaction(params);
    }
    return signIronwoodTransaction(this, tx, params);
  }
  resolveRecipientsFromPsbt(input: Buffer | string, walletKeys: fixedScriptWallet.RootWalletKeys): PsbtRecipient[] {
    const psbt = this.decodeTransaction(input);
    if (!(psbt instanceof fixedScriptWallet.ZcashBitGoPsbt)) {
      throw new Error('expected a Zcash PSBT');
    }
    return resolvePsbtRecipients(psbt, walletKeys, this.addressCodec);
  }
}
