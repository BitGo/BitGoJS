import {
  BaseCoin,
  BitGoBase,
  VerifyAddressOptions,
  ParsedTransaction,
  ParseTransactionOptions,
  KeyPair,
  SignTransactionOptions,
  SignedTransaction,
  InitiateRecoveryOptions,
  SupplementGenerateWalletOptions,
  KeychainsTriplet,
  TransactionPrebuild,
  PresignTransactionOptions,
  FeeEstimateOptions,
  DeriveKeyWithSeedOptions,
  AuditKeyParams,
  PopulatedIntent,
  PrebuildTransactionWithIntentOptions,
  TokenTransferRecipientParams,
  BuildNftTransferDataOptions,
  BaseBroadcastTransactionOptions,
  BaseBroadcastTransactionResult,
  MPCAlgorithm,
  Wallet,
  IInscriptionBuilder,
  ExtraPrebuildParamsOptions,
  ValidMofNOptions,
  VerifyTransactionOptions,
  ITransactionExplanation,
  RecoverTokenTransaction,
  RecoverWalletTokenOptions,
  PrecreateBitGoOptions,
  IWallet,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import { Hash } from 'crypto';
import { KeyPair as FlrpKeyPair } from './lib/keyPair';

export class Flrp extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }
    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Flrp(bitgo, staticsCoin);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }
  getFamily(): CoinFamily {
    return this._staticsCoin.family as CoinFamily;
  }
  getFullName(): string {
    return this._staticsCoin.fullName;
  }
  getBaseFactor(): number | string {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  // TODO WIN-6321, 6322, 6318: All below methods will be implemented in coming ticket
  // Feature flags
  supportsTss(): boolean {
    return false;
  }
  supportsMessageSigning(): boolean {
    return false;
  }
  supportsSigningTypedData(): boolean {
    return false;
  }
  supportsBlockTarget(): boolean {
    return false;
  }
  supportsLightning(): boolean {
    return false;
  }
  supportsBlsDkg(): boolean {
    return false;
  }
  isEVM(): boolean {
    return false;
  }

  // Conversions (placeholder)
  // Use BaseCoin default conversions (baseUnitsToBigUnits / bigUnitsToBaseUnits)

  // Key methods (stubs)
  generateKeyPair(): KeyPair {
    const keyPair = new FlrpKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Failed to generate private key');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }
  generateRootKeyPair(): KeyPair {
    throw new Error('generateRootKeyPair not implemented');
  }
  keyIdsForSigning(): number[] {
    return [0, 1, 2];
  }
  isValidPub(_pub: string): boolean {
    return false;
  }
  isValidAddress(_address: string): boolean {
    return false;
  }
  isValidMofNSetup(_params: ValidMofNOptions): boolean {
    return false;
  }
  canonicalAddress(address: string): string {
    return address;
  }
  checkRecipient(_recipient: { address: string; amount: string | number }): void {
    /* no-op */
  }

  // Verification
  async verifyAddress(_params: VerifyAddressOptions): Promise<boolean> {
    throw new Error('verifyAddress not implemented');
  }
  async isWalletAddress(_params: VerifyAddressOptions): Promise<boolean> {
    throw new Error('isWalletAddress not implemented');
  }
  async verifyTransaction(_params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('verifyTransaction not implemented');
  }

  // Tx lifecycle
  async signTransaction(_params: SignTransactionOptions): Promise<SignedTransaction> {
    // TODO WIN-6320: implement signTransaction
    throw new Error('signTransaction not implemented');
  }
  async explainTransaction(
    _options: Record<string, unknown>
  ): Promise<ITransactionExplanation<unknown, string | number> | undefined> {
    // TODO WIN-6320: implement signTransaction
    throw new Error('explainTransaction not implemented');
  }
  async parseTransaction(_params: ParseTransactionOptions): Promise<ParsedTransaction> {
    // TODO WIN-6320: implement signTransaction
    throw new Error('parseTransaction not implemented');
  }
  async presignTransaction(_params: PresignTransactionOptions): Promise<PresignTransactionOptions> {
    // TODO WIN-6320: implement signTransaction
    throw new Error('presignTransaction not implemented');
  }
  async postProcessPrebuild(prebuild: TransactionPrebuild): Promise<TransactionPrebuild> {
    // TODO WIN-6320: implement signTransaction
    return prebuild;
  }
  async getExtraPrebuildParams(_buildParams: ExtraPrebuildParamsOptions): Promise<Record<string, unknown>> {
    // TODO WIN-6320: implement signTransaction
    return {};
  }
  async feeEstimate(_params: FeeEstimateOptions): Promise<unknown> {
    // TODO WIN-6320: implement signTransaction
    throw new Error('feeEstimate not implemented');
  }
  async broadcastTransaction(_params: BaseBroadcastTransactionOptions): Promise<BaseBroadcastTransactionResult> {
    // TODO WIN-6320: implement signTransaction
    throw new Error('broadcastTransaction not implemented');
  }

  // Wallet helpers
  async supplementGenerateWallet(
    _walletParams: SupplementGenerateWalletOptions,
    _keychains: KeychainsTriplet
  ): Promise<Record<string, unknown>> {
    return {};
  }
  newWalletObject(walletParams: unknown): IWallet {
    return walletParams as IWallet;
  }
  preCreateBitGo(_params: PrecreateBitGoOptions): void {
    /* no-op */
  }
  initiateRecovery(_params: InitiateRecoveryOptions): never {
    throw new Error('initiateRecovery not implemented');
  }

  // Signing helpers
  async signMessage(_key: { prv: string }, _message: string): Promise<Buffer> {
    throw new Error('signMessage not implemented');
  }
  async createKeySignatures(
    _prv: string,
    _backup: { pub: string },
    _bitgo: { pub: string }
  ): Promise<{ backup: string; bitgo: string }> {
    throw new Error('createKeySignatures not implemented');
  }
  async getSignablePayload(_serializedTx: string): Promise<Buffer> {
    throw new Error('getSignablePayload not implemented');
  }
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  // Token / NFT / inscription / recovery placeholders
  recoverToken(_params: RecoverWalletTokenOptions): Promise<RecoverTokenTransaction> {
    throw new Error('recoverToken not implemented');
  }
  buildNftTransferData(_params: BuildNftTransferDataOptions): string | TokenTransferRecipientParams {
    throw new Error('buildNftTransferData not implemented');
  }
  getInscriptionBuilder(_wallet: Wallet): IInscriptionBuilder {
    throw new Error('getInscriptionBuilder not implemented');
  }

  // Misc
  getHashFunction(): Hash {
    throw new Error('getHashFunction not implemented');
  }
  deriveKeyWithSeed(_params: DeriveKeyWithSeedOptions): { key: string; derivationPath: string } {
    throw new Error('deriveKeyWithSeed not implemented');
  }
  setCoinSpecificFieldsInIntent(_intent: PopulatedIntent, _params: PrebuildTransactionWithIntentOptions): void {
    /* no-op */
  }
  assertIsValidKey(_params: AuditKeyParams): void {
    /* no-op */
  }
  auditDecryptedKey(): void {
    /* no-op */
  }
}
