import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AtomicInCTransactionBuilder } from './atomicInCTransactionBuilder';
import {
  evmSerial,
  UnsignedTx,
  Credential,
  BigIntPr,
  Int,
  Id,
  TransferableOutput,
  Address,
  TransferOutput,
  OutputOwners,
  utils as FlareUtils,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, Tx, FlareTransactionType } from './iface';

export class ExportInCTxBuilder extends AtomicInCTransactionBuilder {
  private _amount: bigint;
  private _nonce: bigint;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Utxos are not required in Export Tx in C-Chain.
   * Override utxos to prevent used by throwing a error.
   *
   * @param {DecodedUtxoObj[]} value ignored
   */
  utxos(value: DecodedUtxoObj[]): this {
    throw new BuildTransactionError('utxos are not required in Export Tx in C-Chain');
  }

  /**
   * Amount is a bigint that specifies the quantity of the asset that this output owns. Must be positive.
   * The transaction output amount add a fixed fee that will be paid upon import.
   *
   * @param {bigint | string} amount The withdrawal amount
   */
  amount(amount: bigint | string): this {
    const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
    this.validateAmount(amountBigInt);
    this._amount = amountBigInt;
    return this;
  }

  /**
   * Set the nonce of C-Chain sender address
   *
   * @param {number | string} nonce - number that can be only used once
   */
  nonce(nonce: number | string): this {
    const nonceBigInt = BigInt(nonce);
    this.validateNonce(nonceBigInt);
    this._nonce = nonceBigInt;
    return this;
  }

  /**
   * Export tx target P wallet.
   *
   * @param pAddresses
   */
  to(pAddresses: string | string[]): this {
    const pubKeys = Array.isArray(pAddresses) ? pAddresses : pAddresses.split('~');
    this.transaction._to = pubKeys.map((addr) => utils.parseAddress(addr));
    return this;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  initBuilder(tx: Tx, rawBytes?: Buffer, parsedCredentials?: Credential[]): this {
    const baseTx = tx as evmSerial.ExportTx;
    if (!this.verifyTxType(baseTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // The outputs is a multisign P-Chain address result.
    // It's expected to have only one output to the destination P-Chain address.
    const outputs = baseTx.exportedOutputs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one output');
    }
    const output = outputs[0];

    if (Buffer.from(output.assetId.toBytes()).toString('hex') !== this.transaction._assetId) {
      throw new BuildTransactionError('AssetID mismatch');
    }

    // The inputs is not an utxo.
    // It's expected to have only one input from C-Chain address.
    const inputs = baseTx.ins;
    if (inputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one input');
    }
    const input = inputs[0];

    const transferOutput = output.output as TransferOutput;
    const owners = transferOutput.getOwners();
    this.transaction._to = owners;
    const inputAmount = input.amount.value();
    const outputAmount = transferOutput.amount();
    const fee = inputAmount - outputAmount;
    this._amount = outputAmount;
    // Subtract fixedFee from total fee to get the gas-based feeRate
    // buildFlareTransaction will add fixedFee back when building the transaction
    this.transaction._fee.feeRate = Number(fee) - Number(this.fixedFee);
    this.transaction._fee.fee = fee.toString();
    this.transaction._fee.size = 1;
    this.transaction._fromAddresses = [Buffer.from(input.address.toBytes())];
    this.transaction._locktime = transferOutput.getLocktime();

    this._nonce = input.nonce.value();

    // Use credentials passed from TransactionBuilderFactory (properly extracted using codec)
    const credentials = parsedCredentials || [];
    const hasCredentials = credentials.length > 0;

    // If it's a signed transaction, store the original raw bytes to preserve exact format
    if (hasCredentials && rawBytes) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    // Create proper UnsignedTx wrapper with credentials
    const fromAddress = new Address(this.transaction._fromAddresses[0]);
    const addressMap = new FlareUtils.AddressMap([
      [fromAddress, 0],
      [fromAddress, 1],
    ]);
    const addressMaps = new FlareUtils.AddressMaps([addressMap]);

    const unsignedTx = new UnsignedTx(
      baseTx,
      [],
      addressMaps,
      credentials.length > 0 ? credentials : [new Credential([utils.createNewSig('')])]
    );

    this.transaction.setTransaction(unsignedTx);
    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.EvmExportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ExportInCTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the export in C-chain transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    if (this.transaction.hasCredentials) return;
    if (this._amount === undefined) {
      throw new Error('amount is required');
    }
    if (this.transaction._fromAddresses.length !== 1) {
      throw new Error('sender is one and required');
    }
    if (this.transaction._to.length === 0) {
      throw new Error('to is required');
    }
    if (!this.transaction._fee.feeRate) {
      throw new Error('fee rate is required');
    }
    if (this._nonce === undefined) {
      throw new Error('nonce is required');
    }

    // For EVM exports, total fee = feeRate (gas-based fee) + fixedFee (P-chain import fee)
    // This matches the AVAX implementation where fixedFee covers the import cost
    const txFee = BigInt(this.fixedFee);
    const fee = BigInt(this.transaction._fee.feeRate) + txFee;
    this.transaction._fee.fee = fee.toString();
    this.transaction._fee.size = 1;

    const fromAddressBytes = this.transaction._fromAddresses[0];
    const fromAddress = new Address(fromAddressBytes);
    const assetId = utils.flareIdString(this.transaction._assetId);
    const amount = new BigIntPr(this._amount + fee);
    const nonce = new BigIntPr(this._nonce);
    const input = new evmSerial.Input(fromAddress, amount, assetId, nonce);
    // Map all destination P-chain addresses for multisig support
    // Sort addresses alphabetically by hex representation (required by Avalanche/Flare protocol)
    const sortedToAddresses = [...this.transaction._to].sort((a, b) => {
      const aHex = Buffer.from(a).toString('hex');
      const bHex = Buffer.from(b).toString('hex');
      return aHex.localeCompare(bHex);
    });
    const toAddresses = sortedToAddresses.map((addr) => new Address(addr));

    const exportTx = new evmSerial.ExportTx(
      new Int(this.transaction._networkID),
      utils.flareIdString(this.transaction._blockchainID),
      new Id(new Uint8Array(this._externalChainId)),
      [input],
      [
        new TransferableOutput(
          assetId,
          new TransferOutput(
            new BigIntPr(this._amount),
            new OutputOwners(
              new BigIntPr(this.transaction._locktime),
              new Int(this.transaction._threshold),
              toAddresses
            )
          )
        ),
      ]
    );

    // Create address maps with proper EVM address format
    const addressMap = new FlareUtils.AddressMap([
      [fromAddress, 0],
      [fromAddress, 1], // Map the same address to both indices since it's used in both places
    ]);
    const addressMaps = new FlareUtils.AddressMaps([addressMap]); // Single map is sufficient

    // Create unsigned transaction with proper address mapping
    const unsignedTx = new UnsignedTx(
      exportTx,
      [], // Empty UTXOs array, will be filled during processing
      addressMaps,
      [new Credential([utils.createNewSig('')])] // Empty credential for signing
    );

    this.transaction.setTransaction(unsignedTx);
  }

  /**
   * Check the nonce is non-negative.
   * @param nonce
   */
  validateNonce(nonce: bigint): void {
    if (nonce < BigInt(0)) {
      throw new BuildTransactionError('Nonce must be greater or equal than 0');
    }
  }
}
