import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { Credential, Address, utils as FlareUtils } from '@flarenetwork/flarejs';
import { DecodedUtxoObj } from './iface';
import { FlrpFeeState } from '@bitgo/public-types';
import utils from './utils';

export abstract class AtomicTransactionBuilder extends TransactionBuilder {
  protected _externalChainId: Buffer;
  protected recoverSigner = false;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
    this.transaction._fee.fee = this.fixedFee;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    await this.buildFlareTransaction();
    this.setTransactionType(this.transactionType);
    if (this.hasSigner()) {
      for (const keyPair of this._signer) {
        await this.transaction.sign(keyPair);
      }
    }
    return this.transaction;
  }

  /**
   * Builds the Flare transaction. Transaction field is changed.
   */
  protected abstract buildFlareTransaction(): void | Promise<void>;

  protected abstract get transactionType(): TransactionType;

  /**
   * Fee is fix for AVM atomic tx.
   *
   * @returns network.txFee
   * @protected
   */
  protected get fixedFee(): string {
    return this.transaction._network.txFee;
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this.transaction._type = transactionType;
  }

  /**
   * The internal chain is the one set for the coin in coinConfig.network. The external chain is the other chain involved.
   * The external chain id is the source on import and the destination on export.
   *
   * @param {string} chainId - id of the external chain
   */
  externalChainId(chainId: string | Buffer): this {
    const newTargetChainId = typeof chainId === 'string' ? utils.cb58Decode(chainId) : Buffer.from(chainId);
    this.validateChainId(newTargetChainId);
    this._externalChainId = newTargetChainId;
    return this;
  }

  /**
   * Set the transaction fee
   *
   * @param {string | bigint} feeValue - the fee value
   */
  fee(feeValue: string | bigint): this {
    const fee = typeof feeValue === 'string' ? feeValue : feeValue.toString();
    (this.transaction as Transaction)._fee.fee = fee;
    return this;
  }

  /**
   * Set the fee state for dynamic fee calculation (P-chain transactions)
   *
   * @param {FlrpFeeState} state - the fee state from the network
   */
  feeState(state: FlrpFeeState): this {
    this.transaction._feeState = state;
    return this;
  }

  /**
   * Set the amount for the transaction
   *
   * @param {bigint | string} value - the amount to transfer
   */
  amount(value: bigint | string): this {
    const valueBigInt = typeof value === 'string' ? BigInt(value) : value;
    this.validateAmount(valueBigInt);
    this.transaction._amount = valueBigInt;
    return this;
  }

  /**
   * Create credential with dynamic ordering based on addressesIndex from UTXO
   * Matches avaxp behavior: signature order depends on UTXO address positions
   * @param utxo - The UTXO to create credential for
   * @param threshold - Number of signatures required
   * @returns Credential with empty signatures ordered based on UTXO positions
   * @protected
   */
  protected createCredentialForUtxo(utxo: DecodedUtxoObj, threshold: number): Credential {
    const sender = (this.transaction as Transaction)._fromAddresses;
    const hasAddresses = sender && sender.length >= threshold;

    // If we have pre-computed addressesIndex (from parsing a transaction), use it directly
    // This is the authoritative source for signature ordering from parsed transactions
    if (utxo.addressesIndex && utxo.addressesIndex.length >= threshold) {
      // Create credentials matching the sigIndicies order from the parsed transaction
      const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];
      for (let i = 0; i < threshold; i++) {
        emptySignatures.push(utils.createNewSig(''));
      }
      return new Credential(emptySignatures);
    }

    if (!hasAddresses || !utxo.addresses || utxo.addresses.length === 0) {
      // Fallback: use all zeros if no addresses available
      const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];
      for (let i = 0; i < threshold; i++) {
        emptySignatures.push(utils.createNewSig(''));
      }
      return new Credential(emptySignatures);
    }

    // Compute addressesIndex: position of each _fromAddresses in UTXO's address list
    const utxoAddresses = utxo.addresses.map((a) => utils.parseAddress(a));
    const addressesIndex = sender.map((a) =>
      utxoAddresses.findIndex((u) => Buffer.compare(Buffer.from(u), Buffer.from(a)) === 0)
    );

    // either user (0) or recovery (2)
    const firstIndex = this.recoverSigner ? 2 : 0;
    const bitgoIndex = 1;

    // Dynamic ordering based on addressesIndex
    let emptySignatures: ReturnType<typeof utils.createNewSig>[];
    if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
      // Bitgo comes first in signature order: [zeros, userAddress]
      emptySignatures = [
        utils.createNewSig(''),
        utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')),
      ];
    } else {
      // User comes first in signature order: [userAddress, zeros]
      emptySignatures = [
        utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')),
        utils.createNewSig(''),
      ];
    }
    return new Credential(emptySignatures);
  }

  /**
   * Create AddressMap based on signature slot order (matching credential order), not sorted addresses
   * This matches the approach used in credentials: addressesIndex determines signature order
   * AddressMaps should map addresses to signature slots in the same order as credentials
   * @param utxo - The UTXO to create AddressMap for
   * @param threshold - Number of signatures required
   * @returns AddressMap that maps addresses to signature slots based on UTXO order
   * @protected
   */
  protected createAddressMapForUtxo(utxo: DecodedUtxoObj, threshold: number): FlareUtils.AddressMap {
    const addressMap = new FlareUtils.AddressMap();
    const sender = (this.transaction as Transaction)._fromAddresses;

    // If we have pre-computed addressesIndex (from parsing a transaction), use it directly
    // addressesIndex from sigIndicies() tells us: addressesIndex[slotIdx] = utxoAddressIdx
    // This means slot 'slotIdx' expects signature from UTXO address at index 'utxoAddressIdx'
    // Assuming sender[i] corresponds to utxoAddress[i], we map sender[addressesIndex[slotIdx]] to slotIdx
    if (utxo.addressesIndex && utxo.addressesIndex.length >= threshold && sender && sender.length >= threshold) {
      for (let slotIdx = 0; slotIdx < threshold; slotIdx++) {
        const utxoAddrIdx = utxo.addressesIndex[slotIdx];
        // Map the sender that corresponds to this UTXO address index to this slot
        if (utxoAddrIdx < sender.length) {
          addressMap.set(new Address(sender[utxoAddrIdx]), slotIdx);
        }
      }
      return addressMap;
    }

    // If UTXO has addresses, compute addressesIndex to determine signature order
    if (utxo && utxo.addresses && utxo.addresses.length > 0 && sender && sender.length >= threshold) {
      const utxoAddresses = utxo.addresses.map((a) => utils.parseAddress(a));
      const addressesIndex = sender.map((a) =>
        utxoAddresses.findIndex((u) => Buffer.compare(Buffer.from(u), Buffer.from(a)) === 0)
      );

      const firstIndex = this.recoverSigner ? 2 : 0;
      const bitgoIndex = 1;

      // Determine signature slot order based on addressesIndex (same logic as credentials)
      if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
        // Bitgo comes first: slot 0 = bitgo, slot 1 = firstIndex
        addressMap.set(new Address(sender[bitgoIndex]), 0);
        addressMap.set(new Address(sender[firstIndex]), 1);
      } else {
        // User/recovery comes first: slot 0 = firstIndex, slot 1 = bitgo
        addressMap.set(new Address(sender[firstIndex]), 0);
        addressMap.set(new Address(sender[bitgoIndex]), 1);
      }
    } else {
      // Fallback: map addresses sequentially if no UTXO addresses available
      if (sender && sender.length >= threshold) {
        sender.slice(0, threshold).forEach((addr, i) => {
          addressMap.set(new Address(addr), i);
        });
      }
    }

    return addressMap;
  }
}
