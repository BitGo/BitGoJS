import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicInCTransactionBuilder } from './atomicInCTransactionBuilder';
import {
  evmSerial,
  UnsignedTx,
  Credential,
  TransferableInput,
  TransferInput,
  TransferOutput,
  Address,
  utils as FlareUtils,
  evm,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, FlareTransactionType, SECP256K1_Transfer_Output, Tx } from './iface';

export class ImportInCTxBuilder extends AtomicInCTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * C-chain address who is target of the import.
   * Address format is eth like
   * @param {string} cAddress
   */
  to(cAddress: string): this {
    this.transaction._to = [utils.parseAddress(cAddress)];
    return this;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  initBuilder(tx: Tx, rawBytes?: Buffer, parsedCredentials?: Credential[]): this {
    const baseTx = tx as evmSerial.ImportTx;
    if (!this.verifyTxType(baseTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    const outputs = baseTx.Outs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one output');
    }
    const output = outputs[0];

    if (Buffer.from(output.assetId.toBytes()).toString('hex') !== this.transaction._assetId) {
      throw new Error('AssetID are not equals');
    }
    this.transaction._to = [Buffer.from(output.address.toBytes())];

    const inputs = baseTx.importedInputs;
    this.transaction._utxos = this.recoverUtxos(inputs);

    const totalInputAmount = inputs.reduce((t, i) => t + i.amount(), BigInt(0));
    const totalOutputAmount = output.amount.value();

    const fee = totalInputAmount - totalOutputAmount;

    const credentials = parsedCredentials || [];
    const hasCredentials = credentials.length > 0;

    if (hasCredentials && rawBytes) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    const firstInput = inputs[0];
    const inputThreshold = firstInput.sigIndicies().length || this.transaction._threshold;
    this.transaction._threshold = inputThreshold;

    this.transaction._fee = {
      fee: fee.toString(),
    };

    const firstUtxo = this.transaction._utxos[0];
    let addressMap: FlareUtils.AddressMap;
    if (
      firstUtxo &&
      firstUtxo.addresses &&
      firstUtxo.addresses.length > 0 &&
      this.transaction._fromAddresses &&
      this.transaction._fromAddresses.length >= this.transaction._threshold
    ) {
      addressMap = this.createAddressMapForUtxo(firstUtxo, this.transaction._threshold);
    } else {
      addressMap = new FlareUtils.AddressMap();
      if (this.transaction._fromAddresses && this.transaction._fromAddresses.length >= this.transaction._threshold) {
        this.transaction._fromAddresses.slice(0, this.transaction._threshold).forEach((addr, i) => {
          addressMap.set(new Address(addr), i);
        });
      } else {
        const toAddress = new Address(output.address.toBytes());
        addressMap.set(toAddress, 0);
      }
    }

    const addressMaps = new FlareUtils.AddressMaps([addressMap]);

    let txCredentials: Credential[];
    if (credentials.length > 0) {
      txCredentials = credentials;
    } else {
      const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];
      for (let i = 0; i < inputThreshold; i++) {
        emptySignatures.push(utils.createNewSig(''));
      }
      txCredentials = [new Credential(emptySignatures)];
    }

    const unsignedTx = new UnsignedTx(baseTx, [], addressMaps, txCredentials);

    this.transaction.setTransaction(unsignedTx);
    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.EvmImportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ImportInCTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the import in C-chain transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    if (this.transaction.hasCredentials) return;
    if (this.transaction._to.length !== 1) {
      throw new BuildTransactionError('to is required');
    }
    if (!this.transaction._fee.fee) {
      throw new BuildTransactionError('fee is required');
    }
    if (!this.transaction._context) {
      throw new BuildTransactionError('context is required');
    }
    if (!this.transaction._fromAddresses || this.transaction._fromAddresses.length === 0) {
      throw new BuildTransactionError('fromAddresses are required');
    }
    if (!this.transaction._utxos || this.transaction._utxos.length === 0) {
      throw new BuildTransactionError('UTXOs are required');
    }
    if (!this.transaction._threshold) {
      throw new BuildTransactionError('threshold is required');
    }

    const actualFeeNFlr = BigInt(this.transaction._fee.fee);
    const sourceChain = 'P';

    // Convert decoded UTXOs to native FlareJS Utxo objects
    const assetId = utils.cb58Encode(Buffer.from(this.transaction._assetId, 'hex'));
    const nativeUtxos = utils.decodedToUtxos(this.transaction._utxos, assetId);

    // Validate UTXO balance is sufficient to cover the import fee
    const totalUtxoAmount = nativeUtxos.reduce((sum, utxo) => {
      const output = utxo.output as TransferOutput;
      return sum + output.amount();
    }, BigInt(0));

    if (totalUtxoAmount <= actualFeeNFlr) {
      throw new BuildTransactionError(
        `Insufficient UTXO balance: have ${totalUtxoAmount.toString()} nFLR, need more than ${actualFeeNFlr.toString()} nFLR to cover import fee`
      );
    }
    const importTx = evm.newImportTx(
      this.transaction._context,
      this.transaction._to[0],
      this.transaction._fromAddresses.map((addr) => Buffer.from(addr)),
      nativeUtxos,
      sourceChain,
      actualFeeNFlr
    );

    this.transaction.setTransaction(importTx);
  }

  /**
   * Recover UTXOs from imported inputs
   * @param importedInputs Array of transferable inputs
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(importedInputs: TransferableInput[]): DecodedUtxoObj[] {
    return importedInputs.map((input) => {
      const txid = input.utxoID.toString();
      const outputidx = input.utxoID.outputIdx.toString();
      const transferInput = input.input as TransferInput;
      const addressesIndex = transferInput.sigIndicies();

      return {
        outputID: SECP256K1_Transfer_Output,
        amount: input.amount().toString(),
        txid: utils.cb58Encode(Buffer.from(txid, 'hex')),
        outputidx: outputidx,
        threshold: addressesIndex.length || this.transaction._threshold,
        addresses: [],
        addressesIndex,
      };
    });
  }
}
