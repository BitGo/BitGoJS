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

  /*
   * Key naming:
   *   A = user key, B = hsm key (BitGo), C = backup key
   *
   * _fromAddresses (BitGo convention) = [ A, B, C ] at indices [0, 1, 2]
   *
   * Signing key selection (which keys from _fromAddresses to use):
   *   - non-recovery: _fromAddresses[0] + _fromAddresses[1] (user + bitgo)
   *   - recovery: _fromAddresses[1] + _fromAddresses[2] (bitgo + backup)
   *
   * sigIndices in transaction (positions in sorted UTXO address list):
   *   - UTXO addresses are sorted by hex value on-chain
   *   - sigIndices = positions of the 2 signing keys in this sorted list
   *   - Example: if user sorts to position 2 and bitgo to position 0,
   *     then sigIndices = [0, 2] (even though we picked _fromAddresses[0, 1])
   */

  /**
   * Get the 2 signing addresses for FlareJS transaction building.
   *
   * FlareJS's matchOwners() selects signers in sorted UTXO address order,
   * not based on which keys should actually sign. By passing only 2 addresses,
   * we ensure the correct signers are selected.
   *
   * This mirrors AVAXP's approach in createInputOutput() where:
   * - For non-recovery: use user (index 0) and bitgo (index 1)
   * - For recovery: use bitgo (index 1) and recovery (index 2)
   *
   * @returns Array of 2 signing address buffers
   * @protected
   */
  protected getSigningAddresses(): Buffer[] {
    const firstIndex = this.recoverSigner ? 2 : 0;
    const bitgoIndex = 1;

    if (this.transaction._fromAddresses.length < Math.max(firstIndex, bitgoIndex) + 1) {
      throw new BuildTransactionError(
        `Insufficient fromAddresses: need at least ${Math.max(firstIndex, bitgoIndex) + 1} addresses`
      );
    }

    const signingAddresses = [
      Buffer.from(this.transaction._fromAddresses[firstIndex]),
      Buffer.from(this.transaction._fromAddresses[bitgoIndex]),
    ];

    const invalidAddr = signingAddresses.find((addr) => addr.length !== 20);
    if (invalidAddr) {
      throw new BuildTransactionError(`Invalid signing address length: expected 20 bytes, got ${invalidAddr.length}`);
    }

    return signingAddresses;
  }

  /**
   * Compute addressesIndex for UTXOs.
   * addressesIndex[senderIdx] = position of sender[senderIdx] in UTXO's sorted address list.
   *
   * UTXO addresses are sorted lexicographically by byte value to match on-chain storage order.
   * @param forceRecompute - If true, recompute even if addressesIndex already exists
   * @protected
   */
  protected computeAddressesIndex(forceRecompute = false): void {
    const sender = this.transaction._fromAddresses;
    if (!sender || sender.length === 0) return;

    this.transaction._utxos.forEach((utxo) => {
      if (!forceRecompute && utxo.addressesIndex && utxo.addressesIndex.length > 0) {
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
   * Validate UTXOs have consistent addresses.
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
    });
  }

  /**
   * Create credential for a UTXO following AVAX P approach.
   * Embed user/recovery address, leave BitGo slot empty.
   * Signing order is guaranteed: user signs first (address match), BitGo signs second (empty slot).
   *
   * @param utxo - The UTXO to create credential for
   * @param threshold - Number of signatures required
   * @param sigIndices - Optional sigIndices from FlareJS (if not provided, derived from addressesIndex)
   * @protected
   */
  protected createCredentialForUtxo(utxo: DecodedUtxoObj, threshold: number, sigIndices?: number[]): Credential {
    const sender = this.transaction._fromAddresses;
    const addressesIndex = utxo.addressesIndex ?? [];
    const firstIndex = this.recoverSigner ? 2 : 0;
    const bitgoIndex = 1;

    if (threshold === 1) {
      if (sender && sender.length > firstIndex) {
        return new Credential([utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex'))]);
      }
      return new Credential([utils.createNewSig('')]);
    }

    if (addressesIndex.length >= 2 && sender && sender.length >= threshold) {
      const effectiveSigIndices =
        sigIndices && sigIndices.length >= 2
          ? sigIndices
          : [addressesIndex[firstIndex], addressesIndex[bitgoIndex]].sort((a, b) => a - b);

      const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];
      for (const sigIdx of effectiveSigIndices) {
        const senderIdx = addressesIndex.findIndex((utxoPos) => utxoPos === sigIdx);
        if (senderIdx === firstIndex) {
          emptySignatures.push(utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')));
        } else {
          emptySignatures.push(utils.createNewSig(''));
        }
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
   * Create AddressMap for a UTXO following AVAX P approach.
   *
   * @param utxo - The UTXO to create AddressMap for
   * @param threshold - Number of signatures required
   * @param sigIndices - Optional sigIndices from FlareJS (if not provided, derived from addressesIndex)
   * @protected
   */
  protected createAddressMapForUtxo(
    utxo: DecodedUtxoObj,
    threshold: number,
    sigIndices?: number[]
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

    if (addressesIndex.length >= 2 && sender && sender.length >= threshold) {
      const effectiveSigIndices =
        sigIndices && sigIndices.length >= 2
          ? sigIndices
          : [addressesIndex[firstIndex], addressesIndex[bitgoIndex]].sort((a, b) => a - b);

      effectiveSigIndices.forEach((sigIdx, slotIdx) => {
        const senderIdx = addressesIndex.findIndex((utxoPos) => utxoPos === sigIdx);
        if (senderIdx === bitgoIndex || senderIdx === firstIndex) {
          addressMap.set(new Address(sender[senderIdx]), slotIdx);
        }
      });
      return addressMap;
    }

    if (sender && sender.length >= threshold) {
      sender.slice(0, threshold).forEach((addr, i) => {
        addressMap.set(new Address(addr), i);
      });
    }
    return addressMap;
  }
}
