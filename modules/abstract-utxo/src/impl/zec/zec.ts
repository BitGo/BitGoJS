/**
 * @prettier
 */
import { fixedScriptWallet, hasPsbtMagic, zcashAddress } from '@bitgo/wasm-utxo';
import {
  BitGoBase,
  ExtraPrebuildParamsOptions,
  HalfSignedUtxoTransaction,
  IBaseCoin,
  IWallet,
  MPCAlgorithm,
  SignedTransaction,
  TxIntentMismatchError,
  UnifiedRecipientPreference,
  Wallet,
} from '@bitgo/sdk-core';
import _ from 'lodash';

import {
  AbstractUtxoCoin,
  ParseTransactionOptions,
  ExplainTransactionOptions,
  SignTransactionOptions,
  UtxoCoinSpecific,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../../abstractUtxoCoin';
import type { ParsedTransaction } from '../../transaction/types';
import type { TransactionExplanation } from '../../transaction/fixedScript/explainTransaction';
import { stringToBufferTryFormats } from '../../transaction/decode';
import { UtxoCoinName, toWasmUtxoCoinName } from '../../names';
import { AddressCodec } from '../../transaction/recipient';

import { ZecAddressCodec } from './address';
import { signIronwoodTransaction } from './signIronwoodTransaction';
import { resolvePsbtRecipients, PsbtRecipient } from './recipients';
import { assertShieldedWalletAddress } from './shieldedAddress';
import type { ZcashCoinName } from './types';
import { explainShieldedSpendPsbt, verifyShieldedSpendAgainstRecipients } from './shieldedVerify';

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

  override supportsTss(): boolean {
    // Shielded (Orchard/Ironwood) wallets are RedPallas TSS; without this the Wallet
    // constructor never instantiates tssUtils and TSS sends crash on `prebuildTxWithIntent`.
    return true;
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

  override async verifyTransaction<TNumber extends number | bigint = number>(
    params: VerifyTransactionOptions<TNumber>
  ): Promise<boolean> {
    if (params.walletType === 'tss' || params.wallet?.multisigType() === 'tss') {
      // TSS (RedPallas) wallets carry no xpub keychains, so the fixed-script verification
      // path (which fetches `{ pub }`-shaped keychains to classify outputs) cannot run.
      return this.verifyShieldedTransaction(params);
    }
    return super.verifyTransaction(params);
  }

  /**
   * Verify a prebuilt transaction for a TSS (RedPallas) shielded wallet against the requested
   * recipients, without wallet keys or wallet data.
   *
   * The client holds no viewing keys, so it cannot prove which addresses are the wallet's.
   * The only change it can recognize is the keyless parser's `isChange` (an output paying back
   * to the exact address of a note the transaction spends — where wallet-platform always sends
   * change). The prebuild must therefore:
   *   - pass the key-free bundle verifier,
   *   - contain every requested recipient with its exact amount,
   *   - pay every other output to parser-marked change, and
   *   - pay a fee within the ZIP-317 bounds wallet-platform enforces.
   */
  async verifyShieldedTransaction<TNumber extends number | bigint = number>(
    params: VerifyTransactionOptions<TNumber>
  ): Promise<boolean> {
    const { txParams, txPrebuild, reqId } = params;
    const txExplanation = await TxIntentMismatchError.tryGetTxExplanation(this as unknown as IBaseCoin, txPrebuild);
    const throwTxMismatch = (message: string): never => {
      throw new TxIntentMismatchError(message, reqId, [txParams], txPrebuild.txHex, txExplanation);
    };
    if (txPrebuild.txHex === undefined) {
      return throwTxMismatch('missing required txPrebuild property txHex');
    }
    try {
      verifyShieldedSpendAgainstRecipients(txPrebuild.txHex, txParams.recipients ?? [], this.name as ZcashCoinName);
    } catch (e) {
      return throwTxMismatch(e instanceof Error ? e.message : String(e));
    }
    return true;
  }

  /**
   * Shielded spend PSBTs of TSS (RedPallas) wallets carry no fixed-script keys, so they are
   * explained keylessly; everything else keeps the fixed-script path.
   */
  override async explainTransaction<TNumber extends number | bigint = number>(
    params: ExplainTransactionOptions<TNumber>,
    wallet?: IWallet
  ): Promise<TransactionExplanation> {
    const isTssWallet = wallet?.multisigType() === 'tss';
    if (!params.pubs && (wallet === undefined || isTssWallet)) {
      const tx = this.decodeTransactionFromPrebuild(params);
      // A shielded-input v6 PSBT is a RedPallas spend bundle; a transparent-input one (a
      // fixed-script shielding send) still needs the wallet's pubs.
      if (
        tx instanceof fixedScriptWallet.ZcashIronwoodBitGoPsbt &&
        (isTssWallet || tx.shieldedStatus().inputKind === 'shielded')
      ) {
        return explainShieldedSpendPsbt(tx);
      }
    }
    return super.explainTransaction(params, wallet);
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
