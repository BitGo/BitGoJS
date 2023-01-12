import { AVAXPCoin, BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseKey,
  BaseTransaction,
  Entry,
  InvalidTransactionError,
  NotSupported,
  SigningError,
  TransactionFee,
  TransactionType,
} from '@bitgo/sdk-core';
import * as evm from 'avalanche/dist/apis/evm';
import * as pvm from 'avalanche/dist/apis/platformvm';
import { KeyPair } from './keyPair';
import { ADDRESS_SEPARATOR, BaseTx, INPUT_SEPARATOR, TransactionExplanation, Tx, TxData, UnsignedTx } from './iface';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { Credential } from 'avalanche/dist/common';
import { costImportTx } from 'avalanche/dist/utils';
import { Buffer } from 'buffer';
import { pubToAddress } from 'ethereumjs-util';

// region utils to sign
interface signatureSerialized {
  bytes: string;
}
interface CheckSignature {
  (sigature: signatureSerialized, addressHex: string): boolean;
}

function isEmptySignature(s: string): boolean {
  return !!s && s.startsWith(''.padStart(90, '0'));
}

/**
 * Signatures are prestore as empty buffer for hsm and address of signar for first signature.
 * When sign is required, this method return the function that identify a signature to be replaced.
 * @param signatures any signatures as samples to identify which signature required replace.
 */
function generateSelectorSignature(signatures: signatureSerialized[]): CheckSignature {
  if (signatures.length > 1 && signatures.every((sig) => isEmptySignature(sig.bytes))) {
    // Look for address.
    return function (sig, address): boolean {
      try {
        if (!isEmptySignature(sig.bytes)) {
          return false;
        }
        const pub = sig.bytes.substring(90);
        return pub === address;
      } catch (e) {
        return false;
      }
    };
  } else {
    // Look for empty string
    return function (sig, address): boolean {
      if (isEmptySignature(sig.bytes)) return true;
      return false;
    };
  }
}
// end region utils for sign
export class Transaction extends BaseTransaction {
  protected _coinConfig: Readonly<AVAXPCoin>;
  protected _avaxTransaction: Tx;
  protected _fee: TransactionFee;
  protected _type: TransactionType;
  protected _fromAddresses: string[];
  protected _rewardAddresses: string[];
  protected _changeOutputs: Entry[];
  protected _memo?: string;
  protected _uniqueDoubleSpendPreventionIds: string[];
  protected _destinationChain?: string;
  protected _sourceChain?: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig as Readonly<AVAXPCoin>);
    this._fromAddresses = [];
    this._rewardAddresses = [];
    this._changeOutputs = [];
    this._uniqueDoubleSpendPreventionIds = [];
    this._memo = undefined;
    this._destinationChain = undefined;
    this._sourceChain = undefined;
  }

  get avaxTransaction(): BaseTx {
    return this.unsignedTx?.getTransaction();
  }

  /**
   * @deprecated
   * @see{avaxTransaction}
   */
  get avaxPTransaction(): BaseTx {
    return this.avaxTransaction;
  }

  get unsignedTx(): UnsignedTx {
    return this.tx?.getUnsignedTx();
  }
  get tx(): Tx {
    return this._avaxTransaction;
  }
  set tx(tx: Tx) {
    this._avaxTransaction = tx;
    this.load();
  }

  get changeOutputs(): Entry[] {
    return this._changeOutputs;
  }
  get uniqueDoubleSpendPreventionIds(): string[] {
    return this._uniqueDoubleSpendPreventionIds;
  }
  get fee(): TransactionFee {
    return this._fee;
  }

  get rootAddress(): string {
    return this.fromAddresses.slice().sort().join(ADDRESS_SEPARATOR);
  }

  get signature(): string[] {
    if (!this.hasCredentials) {
      return [];
    }
    const obj: any = this.credentials[0].serialize();
    return obj.sigArray.map((s) => s.bytes).filter((s) => !isEmptySignature(s));
  }

  get credentials(): Credential[] {
    // it should be this.tx?.getCredentials(), but EVMTx doesn't have it
    return this.tx && this.tx['credentials'];
  }

  get hasCredentials(): boolean {
    return this.credentials?.length > 0;
  }

  /** @inheritdoc */
  canSign({ key }: BaseKey): boolean {
    // TODO(BG-56700):  Improve canSign by check in addresses in empty credentials match signer
    return true;
  }

  /**
   * Sign a avaxp transaction and update the transaction hex
   * validator, delegator, import, exports extend baseTx
   * unsignedTx: UnsignedTx = new UnsignedTx(baseTx)  (baseTx = addValidatorTx)
   * const tx: Tx = unsignedTx.sign(keychain) (tx is type standard signed tx)
   * get baseTx then create new unsignedTx then sign
   *
   * @param {KeyPair} keyPair
   */
  sign(keyPair: KeyPair): void {
    const prv = keyPair.getPrivateKey();
    const addressHex = keyPair.getAddressBuffer().toString('hex');
    if (!prv) {
      throw new SigningError('Missing private key');
    }
    if (!this.avaxTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }
    if (!this.hasCredentials) {
      throw new InvalidTransactionError('empty credentials to sign');
    }
    const signature = this.createSignature(prv);
    let checkSign: CheckSignature | undefined = undefined;
    this.credentials.forEach((c) => {
      const cs: any = c.serialize();
      if (checkSign === undefined) {
        checkSign = generateSelectorSignature(cs.sigArray);
      }
      let find = false;
      cs.sigArray.forEach((sig) => {
        if (checkSign && checkSign(sig, addressHex)) {
          sig.bytes = signature;
          find = true;
        }
      });
      if (!find) throw new SigningError('Private key cannot sign the transaction');
      c.deserialize(cs);
    });
  }

  /** @inheritdoc */
  /**
   * should be of signedTx doing this with baseTx
   */
  toBroadcastFormat(): string {
    if (!this.avaxTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }
    return this.tx.toStringHex();
  }

  // types - stakingTransaction, import, export
  toJson(): TxData {
    if (!this.avaxTransaction) {
      throw new InvalidTransactionError('Empty transaction data');
    }

    return {
      id: this.id,
      inputs: this.inputs,
      fromAddresses: this.fromAddresses,
      type: this.type,
      signatures: this.signature,
      outputs: this.outputs,
      changeOutputs: this.changeOutputs,
      sourceChain: this.sourceChain,
      destinationChain: this.destinationChain,
      memo: this._memo,
    };
  }

  /**
   * Returns the portion of the transaction that needs to be signed in Buffer format.
   * Only needed for coins that support adding signatures directly (e.g. TSS).
   */
  get signablePayload(): Buffer {
    return utils.sha256(this.unsignedTx.toBuffer());
  }

  get id(): string {
    return utils.binTools.cb58Encode(BufferAvax.from(utils.sha256(this.tx.toBuffer())));
  }

  get fromAddresses(): string[] {
    return this._fromAddresses;
  }

  set fromAddresses(addresses: string[]) {
    this._fromAddresses = addresses;
  }

  /**
   * Avax wrapper to create signature and return it for credentials
   * @param prv
   * @return hexstring
   */
  createSignature(prv: Buffer): string {
    const signval = utils.createSignatureAvaxBuffer(
      this._coinConfig.network,
      BufferAvax.from(this.signablePayload),
      BufferAvax.from(prv)
    );
    return signval.toString('hex');
  }

  /** @inheritdoc */
  explainTransaction(): TransactionExplanation {
    const txJson = this.toJson();
    const displayOrder = [
      'id',
      'inputs',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'fee',
      'type',
      'memo',
    ];

    const outputAmount = txJson.outputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0)).toString();
    const changeAmount = txJson.changeOutputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0)).toString();

    let rewardAddresses;
    if ([TransactionType.AddValidator, TransactionType.AddDelegator].includes(txJson.type)) {
      rewardAddresses = this._rewardAddresses;
      displayOrder.splice(6, 0, 'rewardAddresses');
    }

    return {
      displayOrder,
      id: txJson.id,
      inputs: txJson.inputs,
      outputs: txJson.outputs.map((o) => ({ address: o.address, amount: o.value })),
      outputAmount,
      changeOutputs: txJson.changeOutputs.map((o) => ({ address: o.address, amount: o.value })),
      changeAmount,
      rewardAddresses,
      fee: this.fee,
      type: txJson.type,
      memo: txJson.memo,
    };
  }

  /**
   * Check if this transaction is a P chain
   */
  get isTransactionForCChain(): boolean {
    return utils.isTransactionOf(this.tx, this._coinConfig.network.cChainBlockchainID);
  }

  /**
   * Check if this transaction is a P chain
   */
  get isTransactionForPChain(): boolean {
    return utils.isTransactionOf(this.tx, this._coinConfig.network.blockchainID);
  }

  /**
   * Load data on this transaction.
   */
  load(): void {
    const baseTx = this.avaxTransaction;
    if (!baseTx) {
      return;
    }
    switch (baseTx.getTxType()) {
      case pvm.PlatformVMConstants.ADDVALIDATORTX:
        this.loadAddValidatorTx(baseTx as pvm.AddValidatorTx);
        break;
      case pvm.PlatformVMConstants.ADDDELEGATORTX:
        this.loadAddDelegatorTx(baseTx as pvm.AddDelegatorTx);
        break;
      case pvm.PlatformVMConstants.EXPORTTX:
        this.loadPvmExportTx(baseTx as pvm.ExportTx);
        break;
      case pvm.PlatformVMConstants.IMPORTTX:
        this.loadPvmImportTx(baseTx as pvm.ImportTx);
        break;
      case evm.EVMConstants.IMPORTTX:
        this.loadEvmImportTx(baseTx as evm.ImportTx);
        break;
      case evm.EVMConstants.EXPORTTX:
        this.loadEvmExportTx(baseTx as evm.ExportTx);
        break;
      default:
        throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
  }

  private loadPvmBaseTx(avaxTransaction1: pvm.BaseTx) {
    this._changeOutputs = avaxTransaction1.getOuts().map(utils.mapOutputToEntry(this._coinConfig.network));
    this._inputs = avaxTransaction1.getIns().map(utils.mapInputToEntry(this.rootAddress));
    this._uniqueDoubleSpendPreventionIds = avaxTransaction1.getIns().map(utils.inputToId);
    this._memo = utils.binTools.bufferToString(avaxTransaction1.getMemo());
  }

  private loadAddDelegatorTx(avaxTransaction1: pvm.AddDelegatorTx) {
    this.loadPvmBaseTx(avaxTransaction1);
    this._type = TransactionType.AddDelegator;
    this._outputs = [
      {
        address: avaxTransaction1.getNodeIDString(),
        value: avaxTransaction1.getStakeAmount().toString(),
      },
    ];
    this._fee = { fee: '0', type: 'fixed' };
    this._rewardAddresses = avaxTransaction1
      .getStakeOuts()
      .map(utils.mapOutputToEntry(this._coinConfig.network))
      .map((e) => e.address);
  }

  private loadAddValidatorTx(avaxTransaction1: pvm.AddValidatorTx) {
    this.loadAddDelegatorTx(avaxTransaction1);
    this._type = TransactionType.AddValidator;
  }

  private loadPvmExportTx(avaxTransaction1: pvm.ExportTx) {
    this.loadPvmBaseTx(avaxTransaction1);
    this._type = TransactionType.Export;
    this._outputs = avaxTransaction1.getExportOutputs().map(utils.mapOutputToEntry(this._coinConfig.network));
    this._fee = { fee: this._coinConfig.network.txFee, type: 'fixed' };
    this._sourceChain = this.blockchainIDtoAlias(avaxTransaction1.getBlockchainID());
    this._destinationChain = this.blockchainIDtoAlias(avaxTransaction1.getDestinationChain());
  }

  private loadPvmImportTx(avaxTransaction1: pvm.ImportTx) {
    this._type = TransactionType.Import;
    this._changeOutputs = [];
    this._outputs = avaxTransaction1.getOuts().map(utils.mapOutputToEntry(this._coinConfig.network));
    this._inputs = avaxTransaction1.getImportInputs().map(utils.mapInputToEntry(this.rootAddress));
    this._uniqueDoubleSpendPreventionIds = avaxTransaction1.getImportInputs().map(utils.inputToId);
    this._fee = { fee: this._coinConfig.network.txFee, type: 'fixed' };
    this._memo = utils.binTools.bufferToString(avaxTransaction1.getMemo());
    this._sourceChain = this.blockchainIDtoAlias(avaxTransaction1.getSourceChain());
    this._destinationChain = this.blockchainIDtoAlias(avaxTransaction1.getBlockchainID());
  }

  private loadEvmImportTx(avaxTransaction1: evm.ImportTx) {
    this._type = TransactionType.Import;

    this._outputs = avaxTransaction1.getOuts().map(utils.mapEVMOutputToEntry);
    this._inputs = avaxTransaction1.getImportInputs().map(utils.mapInputToEntry(this.rootAddress));
    this._uniqueDoubleSpendPreventionIds = avaxTransaction1.getImportInputs().map(utils.inputToId);

    const inputAmount = this._inputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0));
    const outputAmount = this._outputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0));
    const feeSize = costImportTx(new evm.UnsignedTx(avaxTransaction1));
    const fee = inputAmount.sub(outputAmount);
    const feeRate = fee.divn(feeSize);

    this._fee = {
      fee: fee.toString(),
      feeRate: feeRate.toNumber(),
      size: feeSize,
      type: 'fixed+variable',
    };
    this._sourceChain = this.blockchainIDtoAlias(avaxTransaction1.getSourceChain());
    this._destinationChain = this.blockchainIDtoAlias(avaxTransaction1.getBlockchainID());
  }

  private loadEvmExportTx(avaxTransaction1: evm.ExportTx) {
    this._type = TransactionType.Export;
    this._outputs = avaxTransaction1
      .getExportedOutputs()
      .map(utils.mapTransferableOutputToEntry(this._coinConfig.network.hrp, this._coinConfig.network.alias));

    this._inputs = avaxTransaction1.getInputs().map((evmInput) => ({
      address: '0x' + evmInput.getAddressString(),
      value: new BN((evmInput as any).amount).toString(),
      nonce: evmInput.getNonce().toNumber(),
    }));

    this._uniqueDoubleSpendPreventionIds = avaxTransaction1
      .getInputs()
      .map((evmInput) => '0x' + evmInput.getAddressString() + INPUT_SEPARATOR + evmInput.getNonce().toNumber());

    const inputAmount = this._inputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0));
    const outputAmount = this._outputs.reduce((p, n) => p.add(new BN(n.value)), new BN(0));
    const fee = inputAmount.sub(outputAmount);
    const feeRate = fee.toNumber() - Number(this._coinConfig.network.txFee);

    this._fee = { fee: fee.toString(), size: 1, feeRate, type: 'fixed+variable' };

    this._sourceChain = this.blockchainIDtoAlias(avaxTransaction1.getBlockchainID());
    this._destinationChain = this.blockchainIDtoAlias(avaxTransaction1.getDestinationChain());
  }

  /**
   * get the source chain id or undefined if it's a cross chain transfer.
   */
  get sourceChain(): string | undefined {
    return this._sourceChain;
  }

  /**
   * get the destinationChain or undefined if it's a cross chain transfer.
   */
  get destinationChain(): string | undefined {
    return this._destinationChain;
  }

  /**
   * Convert a blockchainId buffer to string and return P or C alias if match of any of that chains.
   * @param {BufferAvax} blockchainIDBuffer
   * @return {string} blocchainID or alias if exists.
   * @private
   */
  private blockchainIDtoAlias(blockchainIDBuffer: BufferAvax): string {
    const blockchainId = utils.cb58Encode(blockchainIDBuffer);
    switch (blockchainId) {
      case this._coinConfig.network.cChainBlockchainID:
        return 'C';
      case this._coinConfig.network.blockchainID:
        return 'P';
      default:
        return blockchainId;
    }
  }

  /**
   * Verify signature by check that each signer is in FromAddress.
   * @return true if signature is from the input address
   */
  verifySignature(): boolean {
    const payload = this.signablePayload;
    const signatures = this.signature.map((s) => Buffer.from(s, 'hex'));
    const recoverPubky = signatures.map((s) => utils.recoverySignature(this._coinConfig.network, payload, s));
    const expectedSenders = recoverPubky.map((r) => pubToAddress(r, true));
    const senders = this.inputs.map((i) => utils.parseAddress(i.address));
    return expectedSenders.every((e) => senders.some((sender) => e.equals(sender)));
  }
}
