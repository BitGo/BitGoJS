import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
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
   * Compute addressesIndex for UTXOs following AVAX P approach.
   * addressesIndex[senderIdx] = position of sender[senderIdx] in UTXO's address list
   *
   * IMPORTANT: UTXO addresses are sorted lexicographically by byte value to match
   * on-chain storage order. The API may return addresses in arbitrary order, but
   * on-chain UTXOs always store addresses in sorted order.
   *
   * Example:
   *   A = user key, B = hsm key, C = backup key
   *   sender (bitgoAddresses) = [ A, B, C ]
   *   utxo.addresses (from API) = [ B, C, A ]
   *   sorted utxo.addresses = [ A, B, C ] (sorted by hex value)
   *   addressesIndex = [ 0, 1, 2 ]
   *   (sender[0]=A is at position 0 in sorted UTXO, sender[1]=B is at position 1, etc.)
   *
   * @protected
   */
  protected computeAddressesIndex(): void {
    const sender = this.transaction._fromAddresses;

    this.transaction._utxos.forEach((utxo) => {
      if (utxo.addressesIndex && utxo.addressesIndex.length > 0) {
        return;
      }

      if (utxo.addresses && utxo.addresses.length > 0) {
        const sortedAddresses = utils.sortAddressesByHex(utxo.addresses);
        utxo.addresses = sortedAddresses;

        const utxoAddresses = sortedAddresses.map((a) => utils.parseAddress(a));
        utxo.addressesIndex = sender.map((a) =>
          utxoAddresses.findIndex((u) => Buffer.compare(Buffer.from(u), Buffer.from(a)) === 0)
        );
      }
    });
  }

  /**
   * Compute addressesIndex from parsed transaction data.
   * Similar to computeAddressesIndex() but used when parsing existing transactions
   * via initBuilder().
   *
   * IMPORTANT: UTXO addresses are sorted lexicographically by byte value to match
   * on-chain storage order, ensuring consistency with fresh builds.
   *
   * @protected
   */
  protected computeAddressesIndexFromParsed(): void {
    const sender = this.transaction._fromAddresses;
    if (!sender || sender.length === 0) return;

    this.transaction._utxos.forEach((utxo) => {
      if (utxo.addresses && utxo.addresses.length > 0) {
        const sortedAddresses = utils.sortAddressesByHex(utxo.addresses);
        utxo.addresses = sortedAddresses;

        const utxoAddresses = sortedAddresses.map((a) => utils.parseAddress(a));
        utxo.addressesIndex = sender.map((senderAddr) =>
          utxoAddresses.findIndex((utxoAddr) => Buffer.compare(Buffer.from(utxoAddr), Buffer.from(senderAddr)) === 0)
        );
      }
    });
  }

  /**
   * Validate UTXOs have consistent addresses.
   * Note: UTXO threshold can differ from transaction threshold - each UTXO has its own
   * signature requirement based on how it was created (e.g., change outputs may have threshold=1).
   * @protected
   */
  protected validateUtxoAddresses(): void {
    this.transaction._utxos.forEach((utxo) => {
      if (!utxo) {
        throw new BuildTransactionError('Utxo is undefined');
      }
      if (utxo.addressesIndex?.includes(-1)) {
        throw new BuildTransactionError('Addresses are inconsistent: ' + utxo.txid);
      }
      if (utxo.threshold !== undefined && utxo.threshold <= 0) {
        throw new BuildTransactionError('UTXO threshold must be positive: ' + utxo.txid);
      }
    });
  }

  /**
   * Create credential with dynamic ordering based on addressesIndex from UTXO.
   * Matches AVAX P behavior: signature order depends on UTXO address positions.
   *
   * addressesIndex[senderIdx] = utxoPosition tells us where each sender is in the UTXO.
   * We create signature slots ordered by utxoPosition (smaller position = earlier slot).
   *
   * @param utxo - The UTXO to create credential for
   * @param threshold - Number of signatures required for this specific UTXO
   * @returns Credential with empty signatures ordered based on UTXO positions
   * @protected
   */
  protected createCredentialForUtxo(utxo: DecodedUtxoObj, threshold: number): Credential {
    const sender = this.transaction._fromAddresses;
    const addressesIndex = utxo.addressesIndex ?? [];

    // either user (0) or recovery (2)
    const firstIndex = this.recoverSigner ? 2 : 0;
    const bitgoIndex = 1;

    if (threshold === 1) {
      if (sender && sender.length > firstIndex && addressesIndex[firstIndex] !== undefined) {
        return new Credential([utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex'))]);
      }
      return new Credential([utils.createNewSig('')]);
    }

    // If we have valid addressesIndex, use it to determine signature order
    // addressesIndex[senderIdx] = position in UTXO
    // Smaller position = earlier slot in signature array
    if (addressesIndex.length >= 2 && sender && sender.length >= threshold) {
      let emptySignatures: ReturnType<typeof utils.createNewSig>[];

      if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
        emptySignatures = [
          utils.createNewSig(''),
          utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')),
        ];
      } else {
        emptySignatures = [
          utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')),
          utils.createNewSig(''),
        ];
      }
      return new Credential(emptySignatures);
    }

    const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];
    for (let i = 0; i < threshold; i++) {
      emptySignatures.push(utils.createNewSig(''));
    }
    return new Credential(emptySignatures);
  }

  /**
   * Create AddressMap based on addressesIndex following AVAX P approach.
   * Maps each sender address to its signature slot based on UTXO position ordering.
   *
   * addressesIndex[senderIdx] = utxoPosition
   * Signature slots are ordered by utxoPosition (smaller = earlier slot).
   *
   * @param utxo - The UTXO to create AddressMap for
   * @param threshold - Number of signatures required for this specific UTXO
   * @returns AddressMap that maps addresses to signature slots based on UTXO order
   * @protected
   */
  protected createAddressMapForUtxo(utxo: DecodedUtxoObj, threshold: number): FlareUtils.AddressMap {
    const addressMap = new FlareUtils.AddressMap();
    const sender = this.transaction._fromAddresses;
    const addressesIndex = utxo.addressesIndex ?? [];

    const firstIndex = this.recoverSigner ? 2 : 0;
    const bitgoIndex = 1;

    if (threshold === 1) {
      if (sender && sender.length > firstIndex) {
        addressMap.set(new Address(sender[firstIndex]), 0);
      } else if (sender && sender.length > 0) {
        addressMap.set(new Address(sender[0]), 0);
      }
      return addressMap;
    }

    if (addressesIndex.length >= 2 && sender && sender.length >= threshold) {
      if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
        addressMap.set(new Address(sender[bitgoIndex]), 0);
        addressMap.set(new Address(sender[firstIndex]), 1);
      } else {
        addressMap.set(new Address(sender[firstIndex]), 0);
        addressMap.set(new Address(sender[bitgoIndex]), 1);
      }
      return addressMap;
    }

    if (sender && sender.length >= threshold) {
      sender.slice(0, threshold).forEach((addr, i) => {
        addressMap.set(new Address(addr), i);
      });
    }

    return addressMap;
  }

  /**
   * Create credential using the ACTUAL sigIndices from FlareJS.
   *
   * This method determines which sender addresses correspond to which sigIndex positions,
   * then creates the credential with signatures in the correct order matching the sigIndices.
   *
   * sigIndices tell us which positions in the UTXO's owner addresses need to sign.
   * We need to figure out which sender addresses are at those positions and create
   * signature slots in the same order as sigIndices.
   *
   * @param utxo - The UTXO to create credential for
   * @param threshold - Number of signatures required
   * @param actualSigIndices - The actual sigIndices from FlareJS's built input
   * @returns Credential with signatures ordered to match sigIndices
   * @protected
   */
  protected createCredentialForUtxoWithSigIndices(
    utxo: DecodedUtxoObj,
    threshold: number,
    actualSigIndices: number[]
  ): Credential {
    const sender = this.transaction._fromAddresses;
    const addressesIndex = utxo.addressesIndex ?? [];

    // either user (0) or recovery (2)
    const firstIndex = this.recoverSigner ? 2 : 0;

    if (threshold === 1) {
      if (sender && sender.length > firstIndex && addressesIndex[firstIndex] !== undefined) {
        return new Credential([utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex'))]);
      }
      return new Credential([utils.createNewSig('')]);
    }

    // For threshold >= 2, use the actual sigIndices order from FlareJS
    // sigIndices[i] = position in UTXO's owner addresses that needs to sign
    // addressesIndex[senderIdx] = position in UTXO's owner addresses for that sender
    //
    // We need to find which sender corresponds to each sigIndex and create signatures
    // in the sigIndices order.
    if (actualSigIndices.length >= 2 && addressesIndex.length >= 2 && sender && sender.length >= threshold) {
      const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];

      for (const sigIdx of actualSigIndices) {
        // Find which sender address is at this UTXO position
        // addressesIndex[senderIdx] tells us which UTXO position each sender is at
        const senderIdx = addressesIndex.findIndex((utxoPos) => utxoPos === sigIdx);

        if (senderIdx === firstIndex) {
          // This sigIndex slot is for user/recovery - embed their address
          emptySignatures.push(utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')));
        } else {
          // BitGo (HSM) or unknown sender - empty signature
          emptySignatures.push(utils.createNewSig(''));
        }
      }

      return new Credential(emptySignatures);
    }

    // Fallback: create threshold empty signatures
    const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];
    for (let i = 0; i < threshold; i++) {
      emptySignatures.push(utils.createNewSig(''));
    }
    return new Credential(emptySignatures);
  }

  /**
   * Create AddressMap using the ACTUAL sigIndices from FlareJS.
   *
   * Maps sender addresses to signature slots based on the actual sigIndices order.
   *
   * @param utxo - The UTXO to create AddressMap for
   * @param threshold - Number of signatures required
   * @param actualSigIndices - The actual sigIndices from FlareJS's built input
   * @returns AddressMap that maps addresses to signature slots
   * @protected
   */
  protected createAddressMapForUtxoWithSigIndices(
    utxo: DecodedUtxoObj,
    threshold: number,
    actualSigIndices: number[]
  ): FlareUtils.AddressMap {
    const addressMap = new FlareUtils.AddressMap();
    const sender = this.transaction._fromAddresses;
    const addressesIndex = utxo.addressesIndex ?? [];

    const firstIndex = this.recoverSigner ? 2 : 0;
    const bitgoIndex = 1;

    if (threshold === 1) {
      if (sender && sender.length > firstIndex) {
        addressMap.set(new Address(sender[firstIndex]), 0);
      } else if (sender && sender.length > 0) {
        addressMap.set(new Address(sender[0]), 0);
      }
      return addressMap;
    }

    // For threshold >= 2, map addresses based on actual sigIndices order
    if (actualSigIndices.length >= 2 && addressesIndex.length >= 2 && sender && sender.length >= threshold) {
      actualSigIndices.forEach((sigIdx, slotIdx) => {
        // Find which sender is at this UTXO position
        const senderIdx = addressesIndex.findIndex((utxoPos) => utxoPos === sigIdx);

        if (senderIdx === bitgoIndex || senderIdx === firstIndex) {
          addressMap.set(new Address(sender[senderIdx]), slotIdx);
        }
      });

      return addressMap;
    }

    // Fallback
    if (sender && sender.length >= threshold) {
      sender.slice(0, threshold).forEach((addr, i) => {
        addressMap.set(new Address(addr), i);
      });
    }

    return addressMap;
  }
}
