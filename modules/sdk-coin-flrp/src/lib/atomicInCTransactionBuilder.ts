import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { evmSerial, UnsignedTx, utils as FlareUtils, avmSerial, Address } from '@flarenetwork/flarejs';
import utils from './utils';
import { Transaction } from './transaction';

export abstract class AtomicInCTransactionBuilder extends AtomicTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // external chain id is P
    this._externalChainId = utils.cb58Decode(this.transaction._network.blockchainID);
    // chain id is C
    this.transaction._blockchainID = Buffer.from(
      utils.cb58Decode(this.transaction._network.cChainBlockchainID)
    ).toString('hex');
  }

  /**
   * C-Chain base fee with decimal places converted from 18 to 9.
   *
   * @param {string | number} baseFee
   */
  feeRate(baseFee: string | number): this {
    const fee = BigInt(baseFee);
    this.validateFee(fee);
    this.transaction._fee.feeRate = Number(fee);
    return this;
  }

  /** @inheritdoc */
  fromImplementation(rawTransaction: string): Transaction {
    const txBytes = new Uint8Array(Buffer.from(rawTransaction, 'hex'));
    const codec = avmSerial.getAVMManager().getDefaultCodec();
    const [tx] = evmSerial.ImportTx.fromBytes(txBytes, codec);

    const addressMaps = this.transaction._fromAddresses.map((a) => new FlareUtils.AddressMap([[new Address(a), 0]]));

    const unsignedTx = new UnsignedTx(tx, [], new FlareUtils.AddressMaps(addressMaps), []);
    this.initBuilder(unsignedTx);
    return this.transaction;
  }

  /**
   * Check that fee is greater than 0.
   * @param {bigint} fee
   */
  validateFee(fee: bigint): void {
    if (fee <= BigInt(0)) {
      throw new BuildTransactionError('Fee must be greater than 0');
    }
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {UnsignedTx} tx the transaction data
   * @returns itself
   */
  initBuilder(tx: UnsignedTx): this {
    // Validate network and blockchain IDs
    const baseTx = tx.getTx();
    if (baseTx.getBlockchainId() !== this.transaction._blockchainID) {
      throw new Error('blockchain ID mismatch');
    }
    this.transaction.setTransaction(tx);
    return this;
  }
}
