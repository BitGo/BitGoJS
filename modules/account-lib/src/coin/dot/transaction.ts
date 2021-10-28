import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError, SigningError } from '../baseCoin/errors';
import { construct, decode } from '@substrate/txwrapper-polkadot';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import { TypeRegistry } from '@substrate/txwrapper-core/lib/types';
import { decodeAddress } from '@polkadot/keyring';
import { KeyPair } from './keyPair';
import { TxData, DecodedTx, TransferArgs } from './iface';
import utils from './utils';

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
    if (addr === this._sender) {
      return true;
    }
    return false;
  }

  async sign(keyPair: KeyPair): Promise<void> {
    if (!this._dotTransaction) {
      throw new InvalidTransactionError('No transaction data to sign');
    }
    if (!keyPair.getKeys().prv) {
      throw new SigningError('Missing private key');
    }
    const signingPayload = construct.signingPayload(this._dotTransaction, {
      registry: this._registry,
    });
    // Sign a payload. This operation should be performed on an offline device.
    const signingKeyPair = keyPair.getSigningKeyPair();
    const txHex = utils.createSignedTx(signingKeyPair, signingPayload, this._dotTransaction, {
      metadataRpc: this._dotTransaction.metadataRpc,
      registry: this._registry,
    });

    this._signedTransaction = txHex;
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

  signedTransaction(signedTransaction: string): void {
    this._signedTransaction = signedTransaction;
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

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._dotTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    const decodedTx = decode(this._dotTransaction, {
      metadataRpc: this._dotTransaction.metadataRpc,
      registry: this._registry,
    }) as unknown as DecodedTx;

    const result: TxData = {
      sender: decodedTx.address,
      blockHash: decodedTx.blockHash,
      blockNumber: decodedTx.blockNumber,
      genesisHash: decodedTx.genesisHash,
      metadataRpc: decodedTx.metadataRpc,
      nonce: decodedTx.nonce,
      specVersion: decodedTx.specVersion,
      transactionVersion: decodedTx.transactionVersion,
      eraPeriod: decodedTx.eraPeriod,
      chainName: this._chainName,
      tip: decodedTx.tip,
    };

    if (this.type === TransactionType.Send) {
      const txMethod = decodedTx.method.args as TransferArgs;
      const keypair = new KeyPair({
        pub: Buffer.from(decodeAddress(txMethod.dest.id, false, this._registry.chainSS58)).toString('hex'),
      });
      result.dest = keypair.getAddress();
      result.amount = txMethod.value;
    }

    return result;
  }

  setDotTransaction(tx: UnsignedTransaction): void {
    this._dotTransaction = tx;
  }

  getDotTransaction(): UnsignedTransaction | undefined {
    return this._dotTransaction;
  }

  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  getTransactionType(): TransactionType | undefined {
    return this._type;
  }
}
