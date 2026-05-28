import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  CantonCommand,
  CantonCommandParams,
  CantonCreateCommand,
  CantonExerciseCommand,
  EDDSAMethods,
  extractCommonKeychain,
  InvalidAddressError,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  PopulatedIntent,
  PrebuildTransactionWithIntentOptions,
  SignedTransaction,
  SignTransactionOptions,
  TokenEnablementConfig,
  TransactionExplanation as BaseTransactionExplanation,
  TransactionParams,
  TransactionType,
  TssVerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { auditEddsaPrivateKey } from '@bitgo/sdk-lib-mpc';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from './lib';
import { KeyPair as CantonKeyPair } from './lib/keyPair';
import { CantonCommandKind, TxData } from './lib/iface';
import { Transaction } from './lib/transaction/transaction';
import utils from './lib/utils';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: TransactionType;
}

export interface ExplainTransactionOptions {
  txHex: string;
}

export interface CantonTransactionParams extends TransactionParams {
  cantonCommandParams?: CantonCommandParams;
}

export class Canton extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Canton(bitgo, staticsCoin);
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc */
  public getBaseFactor(): number {
    return 1e10;
  }

  /** @inheritDoc */
  public getChain(): string {
    return 'canton';
  }

  /** @inheritDoc */
  public getFamily(): string {
    return 'canton';
  }

  /** @inheritDoc */
  public getFullName(): string {
    return 'Canton';
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** inherited doc */
  requiresWalletInitializationTransaction(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  /** @inheritDoc */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams } = params;
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }
    const txBuilder = new TransactionBuilderFactory(coinConfig).from(rawTx);
    const transaction = txBuilder.transaction;
    const explainedTx = transaction.explainTransaction();
    switch (transaction.type) {
      case TransactionType.WalletInitialization:
      case TransactionType.TransferAccept:
      case TransactionType.TransferReject:
      case TransactionType.TransferAcknowledge:
      case TransactionType.TransferOfferWithdrawn:
      case TransactionType.CosignDelegationAccept:
      case TransactionType.CosignDelegationProposal:
      case TransactionType.AllocationAllocate:
      case TransactionType.AllocationRequest:
        // There is no recipient info to verify for these transaction types, so always return true.
        return true;
      case TransactionType.CantonCommand:
        return this.verifyCantonCommandTransaction(
          transaction,
          (txParams as CantonTransactionParams).cantonCommandParams
        );
      case TransactionType.OneStepPreApproval:
        // Canton is always a TSS wallet. The SDK's buildTokenEnablements passes enableTokens
        // through unchanged for TSS wallets (no conversion to recipients), so txParams.enableTokens
        // is the only source of user intent here.
        //
        // Receiver validation: the receiver of a OneStepPreApproval is always the wallet's root address.
        // We use enableToken.address if explicitly provided, otherwise fall back to
        // wallet.coinSpecific().rootAddress (the Canton party ID stored at wallet creation time).
        // Token name validation: checked when the token is resolvable from statics.
        if (
          txParams.type === 'enabletoken' &&
          txParams.enableTokens !== undefined &&
          txParams.enableTokens.length > 0
        ) {
          const txData = transaction.toJson() as TxData;
          const enableToken = txParams.enableTokens[0];
          const walletRootAddress = params.wallet?.coinSpecific?.()?.rootAddress;
          const expectedReceiver = enableToken.address ?? walletRootAddress;
          if (expectedReceiver) {
            // Strip ?memoId suffix if present in the stored address
            const [expectedReceiverBase] = expectedReceiver.split('?memoId=');
            if (txData.receiver !== expectedReceiverBase) {
              throw new Error(
                `OneStepPreApproval receiver mismatch: expected '${expectedReceiverBase}', got '${txData.receiver}'`
              );
            }
          }
          if (txData.token !== undefined && txData.token !== enableToken.name) {
            throw new Error(
              `OneStepPreApproval token name mismatch: expected '${enableToken.name}', got '${txData.token}'`
            );
          }
        }
        return true;
      case TransactionType.Send:
        if (txParams.recipients !== undefined) {
          const filteredRecipients = txParams.recipients?.map((recipient) => {
            const { address, amount, tokenName } = recipient;
            const [addressPart, memoId] = address.split('?memoId=');
            return {
              address: addressPart,
              amount,
              ...(memoId && { memo: memoId }),
              ...(tokenName && { tokenName }),
            };
          });
          const filteredOutputs = explainedTx.outputs?.map((output) => {
            const { address, amount, tokenName, memo } = output;
            return {
              address,
              amount,
              ...(memo && { memo }),
              ...(tokenName && { tokenName }),
            };
          });
          if (JSON.stringify(filteredRecipients) !== JSON.stringify(filteredOutputs)) {
            throw new Error('Tx outputs do not match with expected txParams recipients');
          }
        }
        return true;
      default: {
        throw new Error(`unknown transaction type, ${transaction.type}`);
      }
    }
  }

  private verifyCantonCommandTransaction(
    transaction: BaseTransaction,
    userParams: CantonCommandParams | undefined
  ): boolean {
    if (!userParams) {
      return true;
    }

    const cantonTx = transaction as Transaction;
    const rawPrepared = cantonTx.prepareCommand?.preparedTransaction;
    if (!rawPrepared) {
      throw new Error('CantonCommand verifyTransaction: missing preparedTransaction protobuf on tx prebuild');
    }

    const decodedCommand = utils.extractCantonCommandInfo(rawPrepared);
    const userCommand = userParams.command as Partial<CantonCommand>;

    // Input shape is enforced by mpcUtils at build time; here we resolve which branch is present.
    const hasCreate = 'CreateCommand' in userCommand && utils.isPlainObject(userCommand.CreateCommand);
    const hasExercise = 'ExerciseCommand' in userCommand && utils.isPlainObject(userCommand.ExerciseCommand);
    if (!hasCreate && !hasExercise) {
      throw new Error(
        `CantonCommand verifyTransaction: command must contain a CreateCommand or ExerciseCommand wrapper`
      );
    }
    if (hasCreate && hasExercise) {
      throw new Error(
        `CantonCommand verifyTransaction: command must contain exactly one of CreateCommand or ExerciseCommand, not both`
      );
    }
    const userKind: CantonCommandKind = hasCreate ? 'CreateCommand' : 'ExerciseCommand';
    if (decodedCommand.kind !== userKind) {
      throw new Error(
        `CantonCommand verifyTransaction: command kind mismatch — expected ${userKind}, got ${decodedCommand.kind}`
      );
    }

    const userInner =
      userKind === 'CreateCommand'
        ? (userCommand as CantonCreateCommand).CreateCommand
        : (userCommand as CantonExerciseCommand).ExerciseCommand;

    if (!userInner?.templateId) {
      throw new Error(`CantonCommand verifyTransaction: ${userKind}.templateId must be a non-empty string`);
    }

    // templateId (moduleName + entityName; package id is mutable, so ignored)
    const parsed = utils.parseCantonTemplateId(userInner.templateId);
    if (!parsed) {
      throw new Error(
        `CantonCommand verifyTransaction: invalid user templateId '${userInner.templateId}' — expected format 'Pkg:Module:Entity'`
      );
    }
    if (
      decodedCommand.templateId.moduleName !== parsed.moduleName ||
      decodedCommand.templateId.entityName !== parsed.entityName
    ) {
      throw new Error(
        `CantonCommand verifyTransaction: templateId mismatch — expected '${parsed.moduleName}:${parsed.entityName}', got '${decodedCommand.templateId.moduleName}:${decodedCommand.templateId.entityName}'`
      );
    }

    // Build the inject-as skip set once for use across the contractId and argument checks
    const skipPaths = utils.normalizeInjectAs(userParams.resolveContracts);

    // metadata.submitterInfo.actAs must contain exactly the same parties as the user's actAs
    if (!Array.isArray(userParams.actAs) || userParams.actAs.length === 0) {
      throw new Error(`CantonCommand verifyTransaction: actAs must be a non-empty array of party IDs`);
    }
    if (!userParams.actAs.every((p) => typeof p === 'string' && p.trim() !== '')) {
      throw new Error(`CantonCommand verifyTransaction: all actAs entries must be non-empty strings`);
    }
    const submitterActAs = cantonTx.cantonCommandActAsParties ?? [];
    if (!utils.sameElements(submitterActAs, userParams.actAs)) {
      throw new Error(
        `CantonCommand verifyTransaction: submitterInfo.actAs [${submitterActAs.join(
          ', '
        )}] does not match user actAs [${userParams.actAs.join(', ')}]`
      );
    }

    if (userKind === 'ExerciseCommand') {
      const exerciseInner = userInner as CantonExerciseCommand['ExerciseCommand'];

      // choice id
      if (decodedCommand.choice !== exerciseInner.choice) {
        throw new Error(
          `CantonCommand verifyTransaction: choice mismatch — expected '${exerciseInner.choice}', got '${
            decodedCommand.choice ?? ''
          }'`
        );
      }

      // every on-chain actingParty must be in the user's actAs (prevents privilege escalation)
      const onChainActors = decodedCommand.actingParties ?? [];
      for (const actor of onChainActors) {
        if (!userParams.actAs.includes(actor)) {
          throw new Error(
            `CantonCommand verifyTransaction: unauthorized acting party '${actor}' on root exercise (not in user actAs)`
          );
        }
      }

      // contractId — skip when absent/empty or when IMS will inject it via resolveContracts
      if (
        exerciseInner.contractId !== undefined &&
        exerciseInner.contractId !== '' &&
        !skipPaths.has('ExerciseCommand.contractId')
      ) {
        if (decodedCommand.contractId !== exerciseInner.contractId) {
          throw new Error(
            `CantonCommand verifyTransaction: contractId mismatch — expected '${exerciseInner.contractId}', got '${
              decodedCommand.contractId ?? ''
            }'`
          );
        }
      }

      // deep argument compare
      const argumentSkipPaths = this.relativeSkipPaths(skipPaths, 'ExerciseCommand.choiceArgument.');
      utils.assertDeepCantonMatch(exerciseInner.choiceArgument, decodedCommand.argument, argumentSkipPaths);
    } else {
      const createInner = userInner as CantonCreateCommand['CreateCommand'];

      // deep argument compare
      const argumentSkipPaths = this.relativeSkipPaths(skipPaths, 'CreateCommand.createArguments.');
      utils.assertDeepCantonMatch(createInner.createArguments, decodedCommand.argument, argumentSkipPaths);
    }

    return true;
  }

  private relativeSkipPaths(skipPaths: Set<string>, prefix: string): Set<string> {
    const out = new Set<string>();
    for (const p of skipPaths) {
      if (p.startsWith(prefix)) {
        const stripped = p.slice(prefix.length);
        if (stripped) out.add(stripped);
      }
    }
    return out;
  }

  /** @inheritDoc */
  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    // TODO: refactor this and use the `verifyEddsaMemoBasedWalletAddress` once published from sdk-core
    // https://bitgoinc.atlassian.net/browse/COIN-6347
    const { keychains, address: newAddress, index } = params;
    const [addressPart, memoId] = newAddress.split('?memoId=');
    if (!this.isValidAddress(addressPart)) {
      throw new InvalidAddressError(`invalid address: ${newAddress}`);
    }
    if (memoId && memoId !== `${index}`) {
      throw new InvalidAddressError(`invalid memoId index: ${memoId}`);
    }
    const commonKeychain = extractCommonKeychain(keychains);
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const derivationPath = 'm/0';
    const derivedPublicKey = MPC.deriveUnhardened(commonKeychain, derivationPath).slice(0, 64);
    const publicKeyBase64 = Buffer.from(derivedPublicKey, 'hex').toString('base64');
    const rootAddressFingerprint = utils.getAddressFromPublicKey(publicKeyBase64);
    const rootAddress = `${rootAddressFingerprint.slice(0, 5)}::${rootAddressFingerprint}`;
    return addressPart === rootAddress;
  }

  /** @inheritDoc */
  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new CantonKeyPair({ seed }) : new CantonKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /** @inheritDoc */
  explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;
    const txRaw = params.txHex;
    try {
      const txBuilder = factory.from(txRaw);
      rebuiltTransaction = txBuilder.transaction;
    } catch (e) {
      throw new Error('Invalid transaction');
    }
    return rebuiltTransaction.explainTransaction();
  }

  /** @inheritDoc */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /** @inheritDoc */
  isValidAddress(address: string): boolean {
    // canton addresses are of the form, partyHint::fingerprint
    // where partyHint is of length 5 and fingerprint is 68 characters long
    return utils.isValidAddress(address);
  }

  /** @inheritDoc */
  getTokenEnablementConfig(): TokenEnablementConfig {
    return {
      requiresTokenEnablement: true,
      supportsMultipleTokenEnablements: false,
    };
  }

  getAddressFromPublicKey(publicKeyHex: string): string {
    const publicKeyBase64 = Buffer.from(publicKeyHex, 'hex').toString('base64');
    return utils.getAddressFromPublicKey(publicKeyBase64);
  }

  /** @inheritDoc */
  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  auditDecryptedKey({ multiSigType, prv, publicKey }: AuditDecryptedKeyParams): void {
    if (multiSigType !== multisigTypes.tss) {
      throw new Error('Unsupported multiSigType');
    }
    auditEddsaPrivateKey(prv, publicKey ?? '');
  }

  /** @inheritDoc */
  setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
    if (params.txRequestId) {
      intent.txRequestId = params.txRequestId;
    }
    if (params.transferOfferId) {
      intent.transferOfferId = params.transferOfferId;
    }
    if (params.unspents) {
      intent.unspents = params.unspents;
    }
    if (params.cantonCommandParams) {
      intent.cantonCommandParams = params.cantonCommandParams;
    }
  }
}
