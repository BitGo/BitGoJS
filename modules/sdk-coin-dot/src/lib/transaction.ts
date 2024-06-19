import {
  BaseKey,
  BaseTransaction,
  DotAssetTypes,
  InvalidTransactionError,
  ParseTransactionError,
  SigningError,
  toUint8Array,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import Keyring, { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { u8aToBuffer } from '@polkadot/util';
import { construct, decode } from '@substrate/txwrapper-polkadot';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { KeyPair } from './keyPair';
import {
  AddAnonymousProxyArgs,
  AddProxyArgs,
  AddProxyBatchCallArgs,
  BatchArgs,
  BatchCallObject,
  ClaimArgs,
  DecodedTx,
  HexString,
  MethodNames,
  SectionNames,
  StakeArgsPayeeRaw,
  StakeBatchCallArgs,
  StakeMoreArgs,
  StakeMoreCallArgs,
  TransactionExplanation,
  TxData,
  UnstakeArgs,
  WithdrawUnstakedArgs,
} from './iface';
import { getAddress, getDelegateAddress } from './iface_utils';
import utils from './utils';
import BigNumber from 'bignumber.js';
import { Vec } from '@polkadot/types';
import { PalletConstantMetadataV14 } from '@polkadot/types/interfaces';

/**
 * Use a dummy address as the destination of a bond or bondExtra because our inputs and outputs model
 * doesn't seem to handle the concept of locking funds within a wallet as a method of transferring coins.
 */
export const STAKING_DESTINATION = encodeAddress('0x0000000000000000000000000000000000000000000000000000000000000000');

export class Transaction extends BaseTransaction {
  protected _dotTransaction: UnsignedTransaction;
  private _signedTransaction?: string;
  private _registry: TypeRegistry;
  private _chainName: string;
  private _sender: string;

  private static FAKE_SIGNATURE = `0x${Buffer.from(new Uint8Array(256).fill(1)).toString('hex')}`;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    const kp = new KeyPair({ prv: key });
    const addr = kp.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
    return addr === this._sender;
  }

  /**
   * Sign a polkadot transaction and update the transaction hex
   *
   * @param {KeyPair} keyPair - ed signature
   */
  sign(keyPair: KeyPair): void {
    if (!this._dotTransaction) {
      throw new InvalidTransactionError('No transaction data to sign');
    }
    const { prv, pub } = keyPair.getKeys();
    if (!prv) {
      throw new SigningError('Missing private key');
    }
    const signingPayload = construct.signingPayload(this._dotTransaction, {
      registry: this._registry,
    });
    // Sign a payload. This operation should be performed on an offline device.
    const keyring = new Keyring({ type: 'ed25519' });
    const secretKey = new Uint8Array(Buffer.from(prv, 'hex'));
    const publicKey = new Uint8Array(Buffer.from(pub, 'hex'));
    const signingKeyPair = keyring.addFromPair({ secretKey, publicKey });
    const txHex = utils.createSignedTx(signingKeyPair, signingPayload, this._dotTransaction, {
      metadataRpc: this._dotTransaction.metadataRpc,
      registry: this._registry,
    });

    // get signature from signed txHex generated above
    this._signatures = [utils.recoverSignatureFromRawTx(txHex, { registry: this._registry })];
    this._signedTransaction = txHex;
  }

  /**
   * Adds the signature to the DOT Transaction
   * @param {string} signature
   */
  addSignature(signature: string): void {
    this._signedTransaction = utils.serializeSignedTransaction(
      this._dotTransaction,
      signature,
      this._dotTransaction.metadataRpc,
      this._registry
    );
  }

  /**
   * Returns a serialized representation of this transaction with a fake signature attached which
   * can be used to estimate transaction fees.
   */
  fakeSign(): string {
    return utils.serializeSignedTransaction(
      this._dotTransaction,
      Transaction.FAKE_SIGNATURE,
      this._dotTransaction.metadataRpc,
      this._registry
    );
  }

  registry(registry: TypeRegistry): void {
    this._registry = registry;
  }

  chainName(chainName: string): void {
    this._chainName = chainName;
  }

  sender(sender: string): void {
    this._sender = sender;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._dotTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    if (this._signedTransaction && this._signedTransaction.length > 0) {
      return this._signedTransaction;
    } else {
      return construct.signingPayload(this._dotTransaction, {
        registry: this._registry,
      });
    }
  }

  transactionSize(): number {
    return this.toBroadcastFormat().length / 2;
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._dotTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const decodedTx = decode(this._dotTransaction, {
      metadataRpc: this._dotTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._dotTransaction.era),
    }) as unknown as DecodedTx;

    const result: TxData = {
      id: construct.txHash(this.toBroadcastFormat()),
      sender: decodedTx.address,
      referenceBlock: decodedTx.blockHash,
      blockNumber: decodedTx.blockNumber,
      genesisHash: decodedTx.genesisHash,
      nonce: decodedTx.nonce,
      specVersion: decodedTx.specVersion,
      transactionVersion: decodedTx.transactionVersion,
      eraPeriod: decodedTx.eraPeriod,
      chainName: this._chainName,
      tip: decodedTx.tip ? Number(decodedTx.tip) : 0,
    };

    if (this.type === TransactionType.Send) {
      const txMethod = decodedTx.method.args;
      if (utils.isProxyTransfer(txMethod)) {
        const keypairReal = new KeyPair({
          pub: Buffer.from(decodeAddress(getAddress(txMethod))).toString('hex'),
        });
        result.owner = keypairReal.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
        result.forceProxyType = txMethod.forceProxyType;
        const decodedCall = utils.decodeCallMethod(this._dotTransaction, {
          metadataRpc: this._dotTransaction.metadataRpc,
          registry: this._registry,
        });
        const keypairDest = new KeyPair({
          pub: Buffer.from(decodeAddress(decodedCall.dest.id)).toString('hex'),
        });
        result.to = keypairDest.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
        result.amount = decodedCall.value;
      } else if (utils.isTransfer(txMethod)) {
        const keypairDest = new KeyPair({
          pub: Buffer.from(decodeAddress(txMethod.dest.id)).toString('hex'),
        });
        result.to = keypairDest.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
        result.amount = txMethod.value;
      } else if (utils.isTransferAll(txMethod)) {
        const keypairDest = new KeyPair({
          pub: Buffer.from(decodeAddress(txMethod.dest.id)).toString('hex'),
        });
        result.to = keypairDest.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
        result.keepAlive = txMethod.keepAlive;
      } else {
        throw new ParseTransactionError(`Serializing unknown Transfer type parameters`);
      }
    }

    if (this.type === TransactionType.StakingActivate) {
      const txMethod = decodedTx.method.args;
      if (utils.isBond(txMethod)) {
        const keypair = new KeyPair({
          pub: Buffer.from(decodeAddress(this._sender, false, this._registry.chainSS58)).toString('hex'),
        });

        result.controller = keypair.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
        result.amount = txMethod.value;

        const payee = txMethod.payee as StakeArgsPayeeRaw;
        if (payee.account) {
          const keypair = new KeyPair({
            pub: Buffer.from(decodeAddress(payee.account, false, this._registry.chainSS58)).toString('hex'),
          });
          result.payee = keypair.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
        } else {
          const payeeType = utils.capitalizeFirstLetter(Object.keys(payee)[0]) as string;
          result.payee = payeeType;
        }
      } else if (utils.isBondExtra(decodedTx.method.args)) {
        result.amount = decodedTx.method.args.maxAdditional;
      }
    }

    if (this.type === TransactionType.AddressInitialization) {
      let txMethod: AddAnonymousProxyArgs | AddProxyArgs;
      if ((decodedTx.method?.args as AddProxyArgs).delegate) {
        txMethod = decodedTx.method.args as AddProxyArgs;
        const delegateAddress = getDelegateAddress(txMethod);
        const decodedAddress = decodeAddress(delegateAddress, false, this._registry.chainSS58);
        const keypair = new KeyPair({ pub: Buffer.from(decodedAddress).toString('hex') });
        result.owner = keypair.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
      } else {
        txMethod = decodedTx.method.args as AddAnonymousProxyArgs;
        result.index = txMethod.index;
      }
      result.method = this._dotTransaction.method;
      result.proxyType = txMethod.proxyType;
      result.delay = txMethod.delay;
    }

    if (this.type === TransactionType.StakingUnlock) {
      const txMethod = decodedTx.method.args as UnstakeArgs;
      result.amount = txMethod.value;
    }

    if (this.type === TransactionType.StakingWithdraw) {
      const txMethod = decodedTx.method.args as WithdrawUnstakedArgs;
      result.numSlashingSpans = txMethod.numSlashingSpans;
    }

    if (this.type === TransactionType.StakingClaim) {
      const txMethod = decodedTx.method.args as ClaimArgs;
      result.validatorStash = txMethod.validatorStash;
      result.claimEra = txMethod.era;
    }

    if (this.type === TransactionType.Batch) {
      const txMethod = decodedTx.method.args as BatchArgs;
      result.batchCalls = txMethod.calls;
    }

    return result;
  }

  explainTransferTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    explanationResult.displayOrder.push('owner', 'forceProxyType');
    return {
      ...explanationResult,
      outputs: [
        {
          address: json.to?.toString() || '',
          amount: json.amount?.toString() || '',
        },
      ],
      owner: json.owner,
      forceProxyType: json.forceProxyType,
    };
  }

  explainStakingActivateTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    explanationResult.displayOrder.push('payee', 'forceProxyType');
    return {
      ...explanationResult,
      outputs: [
        {
          address: json.controller?.toString() || '',
          amount: json.amount || '',
        },
      ],
      payee: json.payee,
      forceProxyType: json.forceProxyType,
    };
  }

  explainAddressInitializationTransaction(
    json: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation {
    explanationResult.displayOrder.push('owner', 'proxyType', 'delay');
    return {
      ...explanationResult,
      owner: json.owner,
      proxyType: json.proxyType,
      delay: json.delay,
    };
  }

  explainStakingUnlockTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    return {
      ...explanationResult,
      outputs: [
        {
          address: json.sender.toString(),
          amount: json.amount || '',
        },
      ],
    };
  }

  /** @inheritdoc */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type'];
    const outputs: TransactionRecipient[] = [];
    const explanationResult: TransactionExplanation = {
      // txhash used to identify the transactions
      id: result.id,
      displayOrder,
      outputAmount: result.amount?.toString() || '0',
      changeAmount: '0',
      changeOutputs: [],
      outputs,
      fee: {
        fee: result.tip?.toString() || '',
        type: 'tip',
      },
      type: this.type,
    };
    switch (this.type) {
      case TransactionType.Send:
        return this.explainTransferTransaction(result, explanationResult);
      case TransactionType.StakingActivate:
        return this.explainStakingActivateTransaction(result, explanationResult);
      case TransactionType.AddressInitialization:
        return this.explainAddressInitializationTransaction(result, explanationResult);
      case TransactionType.StakingUnlock:
        return this.explainStakingUnlockTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this._dotTransaction) {
      return;
    }
    const decodedTx = decode(this._dotTransaction, {
      metadataRpc: this._dotTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._dotTransaction.era),
    }) as unknown as DecodedTx;

    if (this.type === TransactionType.Send) {
      this.decodeInputsAndOutputsForSend(decodedTx);
    } else if (this.type === TransactionType.Batch) {
      this.decodeInputsAndOutputsForBatch(decodedTx);
    } else if (this.type === TransactionType.StakingActivate) {
      this.decodeInputsAndOutputsForBond(decodedTx);
    } else if (this.type === TransactionType.StakingUnlock) {
      this.decodeInputsAndOutputsForUnbond(decodedTx);
    } else if (this.type === TransactionType.StakingWithdraw) {
      this.decodeInputsAndOutputsForWithdrawUnbond(decodedTx);
    }
  }

  private decodeInputsAndOutputsForSend(decodedTx: DecodedTx) {
    const txMethod = decodedTx.method.args;
    let to: string;
    let value: string;
    let from: string;
    if (utils.isProxyTransfer(txMethod)) {
      const decodedCall = utils.decodeCallMethod(this._dotTransaction, {
        metadataRpc: this._dotTransaction.metadataRpc,
        registry: this._registry,
      });
      const keypairDest = new KeyPair({
        pub: Buffer.from(decodeAddress(decodedCall.dest.id)).toString('hex'),
      });
      const keypairFrom = new KeyPair({
        pub: Buffer.from(decodeAddress(getAddress(txMethod))).toString('hex'),
      });
      to = keypairDest.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
      value = `${decodedCall.value}`;
      from = keypairFrom.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
    } else if (utils.isTransferAll(txMethod)) {
      const keypairDest = new KeyPair({
        pub: Buffer.from(decodeAddress(txMethod.dest.id)).toString('hex'),
      });
      to = keypairDest.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
      value = '0'; // DOT transferAll's do not deserialize amounts
      from = decodedTx.address;
    } else if (utils.isTransfer(txMethod)) {
      const keypairDest = new KeyPair({
        pub: Buffer.from(decodeAddress(txMethod.dest.id)).toString('hex'),
      });
      to = keypairDest.getAddress(utils.getAddressFormat(this._coinConfig.name as DotAssetTypes));
      value = txMethod.value;
      from = decodedTx.address;
    } else {
      throw new ParseTransactionError(`Loading inputs of unknown Transfer type parameters`);
    }
    this._outputs = [
      {
        address: to,
        value,
        coin: this._coinConfig.name,
      },
    ];

    this._inputs = [
      {
        address: from,
        value,
        coin: this._coinConfig.name,
      },
    ];
  }

  private decodeInputsAndOutputsForBatch(decodedTx: DecodedTx) {
    const sender = decodedTx.address;
    this._inputs = [];
    this._outputs = [];

    const txMethod = decodedTx.method.args;
    if (utils.isStakingBatch(txMethod)) {
      if (!txMethod.calls) {
        throw new InvalidTransactionError('failed to decode calls from batch transaction');
      }

      const bondMethod = (txMethod.calls[0] as BatchCallObject).callIndex;
      const decodedBondCall = this._registry.findMetaCall(toUint8Array(utils.stripHexPrefix(bondMethod)));
      if (
        decodedBondCall.section !== SectionNames.Staking ||
        (decodedBondCall.method !== MethodNames.Bond && decodedBondCall.method !== MethodNames.BondExtra)
      ) {
        throw new InvalidTransactionError(
          'Invalid batch transaction, only staking batch calls are supported, expected first call to be bond or bond exta.'
        );
      }
      const addProxyMethod = (txMethod.calls[1] as BatchCallObject).callIndex;
      const decodedAddProxyCall = this._registry.findMetaCall(toUint8Array(utils.stripHexPrefix(addProxyMethod)));
      if (decodedAddProxyCall.section !== SectionNames.Proxy || decodedAddProxyCall.method !== MethodNames.AddProxy) {
        throw new InvalidTransactionError(
          'Invalid batch transaction, only staking batch calls are supported, expected second call to be addProxy.'
        );
      }

      let bondValue;
      if (decodedBondCall.method === MethodNames.BondExtra && utils.isBondBatchExtra(txMethod.calls[0].args)) {
        bondValue = `${(txMethod.calls[0].args as StakeMoreCallArgs).max_additional}`;
      } else if (decodedBondCall.method === MethodNames.BondExtra && utils.isBondExtra(txMethod.calls[0].args)) {
        bondValue = `${(txMethod.calls[0].args as StakeMoreArgs).maxAdditional}`;
      } else {
        bondValue = `${(txMethod.calls[0].args as StakeBatchCallArgs).value}`;
      }
      const addProxyArgs = txMethod.calls[1].args as AddProxyBatchCallArgs;
      const proxyAddress = getDelegateAddress(addProxyArgs);

      this._inputs.push({
        address: sender,
        value: bondValue,
        coin: this._coinConfig.name,
      });
      this._outputs.push({
        address: STAKING_DESTINATION,
        value: bondValue,
        coin: this._coinConfig.name,
      });

      const addProxyCost = this.getAddProxyCost().toString(10);
      this._inputs.push({
        address: sender,
        value: addProxyCost,
        coin: this._coinConfig.name,
      });
      this._outputs.push({
        address: proxyAddress,
        value: addProxyCost,
        coin: this._coinConfig.name,
      });
    } else if (utils.isUnstakingBatch(txMethod)) {
      if (!txMethod.calls) {
        throw new InvalidTransactionError('failed to decode calls from batch transaction');
      }

      const removeProxyMethod = (txMethod.calls[0] as BatchCallObject).callIndex;
      const decodedRemoveProxyCall = this._registry.findMetaCall(toUint8Array(utils.stripHexPrefix(removeProxyMethod)));
      if (
        decodedRemoveProxyCall.section !== SectionNames.Proxy ||
        decodedRemoveProxyCall.method !== MethodNames.RemoveProxy
      ) {
        throw new InvalidTransactionError(
          'Invalid batch transaction, only staking batch calls are supported, expected first call to be removeProxy.'
        );
      }
      const chillMethod = (txMethod.calls[1] as BatchCallObject).callIndex;
      const decodedChillCall = this._registry.findMetaCall(toUint8Array(utils.stripHexPrefix(chillMethod)));
      if (decodedChillCall.section !== SectionNames.Staking || decodedChillCall.method !== MethodNames.Chill) {
        throw new InvalidTransactionError(
          'Invalid batch transaction, only staking batch calls are supported, expected second call to be chill.'
        );
      }
      const unstakeMethod = (txMethod.calls[2] as BatchCallObject).callIndex;
      const decodedUnstakeCall = this._registry.findMetaCall(toUint8Array(utils.stripHexPrefix(unstakeMethod)));
      if (decodedUnstakeCall.section !== SectionNames.Staking || decodedUnstakeCall.method !== MethodNames.Unbond) {
        throw new InvalidTransactionError(
          'Invalid batch transaction, only staking batch calls are supported, expected third call to be unbond.'
        );
      }

      const removeProxyArgs = txMethod.calls[0].args as AddProxyBatchCallArgs;
      const proxyAddress = getDelegateAddress(removeProxyArgs);

      const removeProxyCost = this.getRemoveProxyCost().toString(10);
      this._inputs.push({
        address: proxyAddress,
        value: removeProxyCost,
        coin: this._coinConfig.name,
      });
      this._outputs.push({
        address: sender,
        value: removeProxyCost,
        coin: this._coinConfig.name,
      });
    }
  }

  private getRemoveProxyCost(): BigNumber {
    return this.getAddProxyCost();
  }

  private getAddProxyCost(): BigNumber {
    const proxyPallet = this._registry.metadata.pallets.find(
      (p) => p.name.toString().toLowerCase() === SectionNames.Proxy
    );
    if (proxyPallet) {
      const proxyDepositBase = this.getConstant('ProxyDepositBase', proxyPallet.constants);
      const proxyDepositFactor = this.getConstant('ProxyDepositFactor', proxyPallet.constants);
      return proxyDepositBase.plus(proxyDepositFactor);
    } else {
      const palletNames = this._registry.metadata.pallets.map((p) => p.name.toString().toLowerCase());
      throw new Error(`Could not find ${SectionNames.Proxy} pallet in [${palletNames}]`);
    }
  }

  private getConstant(name: string, constants: Vec<PalletConstantMetadataV14>): BigNumber {
    const constant = constants.find((c) => c.name.toString() === name);
    if (constant === undefined) {
      const constantNames = constants.map((p) => p.name.toString());
      throw new Error(`Could not find constant ${name} in [${constantNames}]`);
    } else {
      // Convert from Little-Endian to Big-Endian
      const valueBe = Buffer.from(constant.value.toU8a(true).reverse()).toString('hex');
      return BigNumber(valueBe, 16);
    }
  }

  private decodeInputsAndOutputsForBond(decodedTx: DecodedTx) {
    const sender = decodedTx.address;
    this._inputs = [];
    this._outputs = [];

    const txMethod = decodedTx.method.args;
    if (decodedTx.method.pallet === SectionNames.Staking) {
      let bondValue = '0';
      if (decodedTx.method.name === MethodNames.Bond && utils.isBond(txMethod)) {
        bondValue = txMethod.value;
      } else if (decodedTx.method.name === MethodNames.BondExtra && utils.isBondExtra(txMethod)) {
        bondValue = txMethod.maxAdditional;
      } else {
        throw new ParseTransactionError(`Loading inputs of unknown StakingActivate type parameters`);
      }
      this._inputs.push({
        address: sender,
        value: bondValue,
        coin: this._coinConfig.name,
      });
      this._outputs.push({
        address: STAKING_DESTINATION,
        value: bondValue,
        coin: this._coinConfig.name,
      });
    }
  }

  private decodeInputsAndOutputsForUnbond(decodedTx: DecodedTx) {
    this._inputs = [];
    this._outputs = [];
  }

  private decodeInputsAndOutputsForWithdrawUnbond(decodedTx: DecodedTx) {
    this._inputs = [];
    this._outputs = [];
  }

  /**
   * Constructs a signed payload using construct.signTx
   * This method will be called during the build step if a TSS signature
   * is added and will set the signTransaction which is the txHex that will be broadcasted
   * As well as add the signature used to sign to the signature array in hex format
   *
   * @param {Buffer} signature The signature to be added to a dot transaction
   */
  constructSignedPayload(signature: Buffer): void {
    // 0x00 means its an ED25519 signature
    const edSignature = `0x00${signature.toString('hex')}` as HexString;

    try {
      this._signedTransaction = construct.signedTx(this._dotTransaction, edSignature, {
        registry: this._registry,
        metadataRpc: this._dotTransaction.metadataRpc,
      });
    } catch (e) {
      throw new SigningError(`Unable to sign dot transaction with signature ${edSignature} ` + e);
    }

    this._signatures = [signature.toString('hex')];
  }

  setTransaction(tx: UnsignedTransaction): void {
    this._dotTransaction = tx;
  }

  /** @inheritdoc **/
  get signablePayload(): Buffer {
    const extrinsicPayload = this._registry.createType('ExtrinsicPayload', this._dotTransaction, {
      version: this._dotTransaction.version,
    });
    return u8aToBuffer(extrinsicPayload.toU8a({ method: true }));
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  transactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }
}
