import { Transaction as SubstrateTransaction, Interface, utils, KeyPair } from '@bitgo/abstract-substrate';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { construct, decode } from '@substrate/txwrapper-polkadot';
import { decodeAddress } from '@polkadot/keyring';
import { DecodedTx, RegisterDidWithCDDArgs } from './iface';

export class Transaction extends SubstrateTransaction {
  /** @inheritdoc */
  toJson(): Interface.TxData {
    console.log('Transaction toJson called in polyx Transaction class');
    if (!this._substrateTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }

    const decodedTx = decode(this._substrateTransaction, {
      metadataRpc: this._substrateTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._substrateTransaction.era),
    }) as unknown as DecodedTx;

    const result: Interface.TxData = {
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

    const txMethod = decodedTx.method.args;
    if (this.type === TransactionType.WalletInitialization) {
      const { targetAccount } = txMethod as RegisterDidWithCDDArgs;
      const keypairDest = new KeyPair({
        pub: Buffer.from(decodeAddress(targetAccount)).toString('hex'),
      });
      result.to = keypairDest.getAddress(this.getAddressFormat());
    } else {
      super.toJson();
    }

    return result;
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    super.loadInputsAndOutputs();

    const decodedTx = decode(this._substrateTransaction, {
      metadataRpc: this._substrateTransaction.metadataRpc,
      registry: this._registry,
      isImmortalEra: utils.isZeroHex(this._substrateTransaction.era),
    }) as unknown as DecodedTx;

    if (this.type === TransactionType.WalletInitialization) {
      this.decodeInputsAndOutputsForRegisterDidWithCDD(decodedTx);
    }
  }

  private decodeInputsAndOutputsForRegisterDidWithCDD(decodedTx: DecodedTx) {
    const txMethod = decodedTx.method.args as RegisterDidWithCDDArgs;
    const keypairDest = new KeyPair({
      pub: Buffer.from(decodeAddress(txMethod.targetAccount)).toString('hex'),
    });
    const to = keypairDest.getAddress(this.getAddressFormat());
    const value = '0';
    const from = decodedTx.address;

    this._inputs.push({
      address: from,
      value,
      coin: this._coinConfig.name,
    });

    this._outputs.push({
      address: to,
      value,
      coin: this._coinConfig.name,
    });
  }
}
