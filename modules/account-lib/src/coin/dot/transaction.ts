import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  ParseTransactionError,
  SigningError,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { construct, decode } from '@substrate/txwrapper-polkadot';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import Keyring, { decodeAddress } from '@polkadot/keyring';
import { KeyPair } from './keyPair';
import {
  AddAnonymousProxyArgs,
  AddProxyArgs,
  BatchArgs,
  DecodedTx,
  StakeArgs,
  StakeArgsPayeeRaw,
  TransactionExplanation,
  HexString,
  TxData,
  UnstakeArgs,
  WithdrawUnstakedArgs,
  ClaimArgs,
} from './iface';
import utils from './utils';
import { u8aToBuffer } from '@polkadot/util';

export class Transaction extends BaseTransaction {
  protected _dotTransaction: UnsignedTransaction;
  private _signedTransaction?: string;
  private _registry: TypeRegistry;
  private _chainName: string;
  private _sender: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    const kp = new KeyPair({ prv: key });
    const addr = kp.getAddress();
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
      this._registry,
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
      tip: decodedTx.tip,
    };

    if (this.type === TransactionType.Send) {
      const txMethod = decodedTx.method.args;
      if (utils.isProxyTransfer(txMethod)) {
        const keypairReal = new KeyPair({
          pub: Buffer.from(decodeAddress(txMethod.real)).toString('hex'),
        });
        result.owner = keypairReal.getAddress();
        result.forceProxyType = txMethod.forceProxyType;
        const decodedCall = utils.decodeCallMethod(this._dotTransaction, {
          metadataRpc: this._dotTransaction.metadataRpc,
          registry: this._registry,
        });
        const keypairDest = new KeyPair({
          pub: Buffer.from(decodeAddress(decodedCall.dest.id)).toString('hex'),
        });
        result.to = keypairDest.getAddress();
        result.amount = decodedCall.value;
      } else if (utils.isTransfer(txMethod)) {
        const keypairDest = new KeyPair({
          pub: Buffer.from(decodeAddress(txMethod.dest.id)).toString('hex'),
        });
        result.to = keypairDest.getAddress();
        result.amount = txMethod.value;
      } else {
        throw new ParseTransactionError(`Serializing unknown Transfer type parameters`);
      }
    }

    if (this.type === TransactionType.StakingActivate) {
      const txMethod = decodedTx.method.args as StakeArgs;
      const keypair = new KeyPair({
        pub: Buffer.from(decodeAddress(txMethod.controller.id, false, this._registry.chainSS58)).toString('hex'),
      });

      result.controller = keypair.getAddress();
      result.amount = txMethod.value;

      const payee = txMethod.payee as StakeArgsPayeeRaw;
      if (payee.account) {
        const keypair = new KeyPair({
          pub: Buffer.from(decodeAddress(payee.account, false, this._registry.chainSS58)).toString('hex'),
        });
        result.payee = keypair.getAddress();
      } else {
        const payeeType = utils.capitalizeFirstLetter(Object.keys(payee)[0]) as string;
        result.payee = payeeType;
      }
    }

    if (this.type === TransactionType.AddressInitialization) {
      let txMethod: AddAnonymousProxyArgs | AddProxyArgs;
      if ((decodedTx.method?.args as AddProxyArgs).delegate) {
        txMethod = decodedTx.method.args as AddProxyArgs;
        const keypair = new KeyPair({
          pub: Buffer.from(decodeAddress(txMethod.delegate, false, this._registry.chainSS58)).toString('hex'),
        });
        result.owner = keypair.getAddress();
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
    explanationResult: TransactionExplanation,
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
          pub: Buffer.from(decodeAddress(txMethod.real)).toString('hex'),
        });
        to = keypairDest.getAddress();
        value = `${decodedCall.value}`;
        from = keypairFrom.getAddress();
      } else if (utils.isTransfer(txMethod)) {
        const keypairDest = new KeyPair({
          pub: Buffer.from(decodeAddress(txMethod.dest.id)).toString('hex'),
        });
        to = keypairDest.getAddress();
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
