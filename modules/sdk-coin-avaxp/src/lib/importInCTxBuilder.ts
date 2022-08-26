import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import {
  EVMConstants,
  Tx as EMVTx,
  ImportTx,
  UnsignedTx,
  SECPTransferInput,
  SelectCredentialClass,
  TransferableInput,
  EVMOutput,
  AmountInput,
} from 'avalanche/dist/apis/evm';
import { costImportTx } from 'avalanche/dist/utils';
import utils from './utils';
import { BN, Buffer as BufferAvax } from 'avalanche';
import { Transaction } from './transaction';
import { Credential } from 'avalanche/dist/common';
import { Tx, BaseTx } from './iface';
import { TransactionBuilder } from './transactionBuilder';

export class ImportInCTxBuilder extends TransactionBuilder {
  private static _targetChainId: BufferAvax = utils.cb58Decode('yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp');

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  fee(value: string | number): this {
    const bnValue = new BN(value);
    this.validateFee(bnValue);
    this.transaction._fee = bnValue;
    return this;
  }

  to(cAddress: string): this {
    const toAddress = BufferAvax.from(cAddress.slice(2), 'hex');
    this.transaction._to = toAddress;
    return this;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  initBuilder(tx: Tx): this {
    const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    if (
      baseTx.getNetworkID() !== this.transaction._networkID // || !baseTx.getBlockchainID().equals(this._transaction._blockchainID)
    ) {
      throw new Error('Network or blockchain is not equals');
    }

    if (!this.verifyTxType(baseTx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // good assumption: addresses that unlock the outputs, will also be used to sign the transaction
    // so pick the first utxo as the from address
    const output = baseTx.getOuts()[0];

    if (!output.getAssetID().equals(this.transaction._assetId)) {
      throw new Error('AssetID are not equals');
    }
    this.transaction._to = output.getAddress();

    const input = baseTx.getImportInputs();

    this.transaction._utxos = this.recoverUtxos(input);
    this.transaction._feeCost = costImportTx(tx.getUnsignedTx() as UnsignedTx);
    const totalInputAmount = input.reduce((t, i) => t.add((i.getInput() as AmountInput).getAmount()), new BN(0));
    this.transaction._fee = totalInputAmount.sub(new BN((output as any).amount)).divn(this.transaction._feeCost);
    this.transaction.setTransaction(tx);
    return this;
  }

  static get txType(): number {
    return EVMConstants.IMPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ImportTx {
    return baseTx.getTypeID() === ImportInCTxBuilder.txType;
  }

  /**
   *
   * @protected
   */
  protected buildAvaxpTransaction(): void {
    const { inputs, amount, credentials } = this.createInput();
    this.transaction._feeCost = costImportTx(
      new UnsignedTx(
        new ImportTx(
          this.transaction._networkID,
          ImportInCTxBuilder._targetChainId,
          this.transaction._blockchainID,
          inputs,
          [new EVMOutput(this.transaction._to, amount, this.transaction._assetId)]
        )
      )
    );
    this.transaction.setTransaction(
      new EMVTx(
        new UnsignedTx(
          new ImportTx(
            this.transaction._networkID,
            ImportInCTxBuilder._targetChainId,
            this.transaction._blockchainID,
            inputs,
            [
              new EVMOutput(
                this.transaction._to,
                amount.sub(this.transaction._fee.muln(this.transaction._feeCost)),
                this.transaction._assetId
              ),
            ]
          )
        ),
        credentials
      )
    );
  }

  get hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildAvaxpTransaction();
    this.transaction.setTransactionType(this.transactionType);
    if (this.hasSigner) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new EMVTx();
    tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
    this.initBuilder(tx);
    return this.transaction;
  }

  /**
   * Threshold must be 2 and since output always get reordered we want to make sure we can always add signatures in the correct location
   * To find the correct location for the signature, we use the ouput's addresses to create the signatureIdx in the order that we desire
   * 0: user key, 1: hsm key, 2: recovery key
   * @param {BN} totalTarget required amount to get from utxo and excedent remain in change output.
   * @protected
   *
   */
  protected createInput(): {
    inputs: TransferableInput[];
    credentials: Credential[];
    amount: BN;
  } {
    const inputs: TransferableInput[] = [];

    // amount spent so far
    let currentTotal: BN = new BN(0);

    const credentials: Credential[] = [];

    // convert fromAddresses to string
    // fromAddresses = bitgo order if we are in WP
    // fromAddresses = onchain order if we are in from
    const bitgoAddresses = this.transaction._fromAddresses.map((b) =>
      utils.addressToString(this.transaction._network.hrp, 'C', b)
    );

    /*
    A = user key
    B = hsm key
    C = backup key
    bitgoAddresses = bitgo addresses [ A, B, C ]
    utxo.addresses = IMS addresses [ B, C, A ]
    utxo.addressesIndex = [ 2, 0, 1 ]
    we pick 0, 1 for non-recovery
    we pick 1, 2 for recovery
    */
    this.transaction._utxos.forEach((utxo) => {
      // in WP, output.addressesIndex is empty, so fill it
      if (!utxo.addressesIndex || utxo.addressesIndex.length === 0) {
        utxo.addressesIndex = bitgoAddresses.map((a) => utxo.addresses.indexOf(a));
      }
      // in OVC, output.addressesIndex is defined correctly from the previous iteration
    });

    // validate the utxos
    this.transaction._utxos.forEach((utxo) => {
      if (!utxo) {
        throw new BuildTransactionError('Utxo is undefined');
      }
      // addressesIndex should neve have a mismatch
      if (utxo.addressesIndex?.includes(-1)) {
        throw new BuildTransactionError('Addresses are inconsistent: ' + utxo.txid);
      }
      if (utxo.threshold !== this.transaction._threshold) {
        throw new BuildTransactionError('Threshold is inconsistent');
      }
    });

    // if we are in OVC, none of the utxos will have addresses since they come from
    // deserialized inputs (which don't have addresses), not the IMS
    const buildOutputs = this.transaction._utxos[0].addresses.length !== 0;

    this.transaction._utxos.forEach((utxo, i) => {
      if (utxo.outputID === 7) {
        const txidBuf = utils.cb58Decode(utxo.txid);
        const amt: BN = new BN(utxo.amount);
        const outputidx = utils.cb58Decode(utxo.outputidx);
        const addressesIndex = utxo.addressesIndex ?? [];

        // either user (0) or recovery (2)
        const firstIndex = this.recoverSigner ? 2 : 0;
        const bitgoIndex = 1;
        currentTotal = currentTotal.add(amt);

        const secpTransferInput = new SECPTransferInput(amt);

        if (!buildOutputs) {
          addressesIndex.forEach((i) => secpTransferInput.addSignatureIdx(i, this.transaction._fromAddresses[i]));
        } else {
          // if user/backup > bitgo
          if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
            secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._fromAddresses[bitgoIndex]);
            secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._fromAddresses[firstIndex]);
            credentials.push(
              SelectCredentialClass(
                secpTransferInput.getCredentialID(), // 9
                ['', this.transaction._fromAddresses[firstIndex].toString('hex')].map(utils.createSig)
              )
            );
          } else {
            secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._fromAddresses[firstIndex]);
            secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._fromAddresses[bitgoIndex]);
            credentials.push(
              SelectCredentialClass(
                secpTransferInput.getCredentialID(),
                [this.transaction._fromAddresses[firstIndex].toString('hex'), ''].map(utils.createSig)
              )
            );
          }
        }

        const input: TransferableInput = new TransferableInput(
          txidBuf,
          outputidx,
          this.transaction._assetId,
          secpTransferInput
        );
        inputs.push(input);
      }
    });

    // get outputs and credentials from the deserialized transaction if we are in OVC
    return {
      inputs,
      amount: currentTotal,
      credentials: credentials.length === 0 ? this.transaction.credentials : credentials,
    };
  }

  /**
   *
   * @param amount
   */
  validateFee(fee: BN): void {
    if (fee.lten(0)) {
      throw new BuildTransactionError('Fee must be greater than 0');
    }
  }
}
