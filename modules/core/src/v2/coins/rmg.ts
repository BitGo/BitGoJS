import { hdPath } from '../../bitcoin';
import { BitGo } from '../../bitgo';
import { MethodNotImplementedError } from '../../errors';
import { BaseCoin } from '../baseCoin';
import {
  AbstractUtxoCoin, AddressInfo,
  ExplainTransactionOptions,
  TransactionExplanation, UnspentInfo,
  GenerateAddressOptions, AddressDetails,
  SignTransactionOptions, VerifyAddressOptions,
} from './abstractUtxoCoin';
import { NodeCallback } from '../types';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
const co = Bluebird.coroutine;
const prova = require('../../prova');

export class Rmg extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?) {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    prova.networks.rmg.coin = 'rmg';
    super(bitgo, network || prova.networks.rmg);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Rmg(bitgo);
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor(): number {
    return 1e6;
  }

  getChain(): string {
    return 'rmg';
  }

  getFamily(): string {
    return 'rmg';
  }

  getFullName(): string {
    return 'Royal Mint Gold';
  }

  isValidAddress(address: string): boolean {
    return prova.Address.validateBase58(address, this.network);
  }

  /**
   * Make sure an address is valid and throw an error if it's not.
   * @param address The address string on the network
   * @param keychains Keychain objects with xpubs
   * @param chain Derivation chain
   * @param index Derivation index
   */
  verifyAddress(params: VerifyAddressOptions) {
    if (!params.keychains) {
      throw new Error('missing required param keychains');
    }

    if (!this.isValidAddress(params.address)) {
      throw new Error(`invalid address: ${params.address}`);
    }

    const expectedAddress: any = this.generateAddress({
      keychains: params.keychains,
      threshold: 2,
      chain: params.chain,
      index: params.index,
    });

    if (expectedAddress.address !== params.address) {
      throw new Error(`address validation failure: expected ${expectedAddress.address} but got ${params.address}`);
    }

    return true;
  }

  /**
   * Generate an address for a wallet based on a set of configurations
   * @param keychains Array of objects with xpubs
   * @param threshold Minimum number of signatures
   * @param chain Derivation chain
   * @param index Derivation index
   * @returns {{chain: number, index: number, coin: number, coinSpecific: {outputScript}}}
   */
  generateAddress(params: GenerateAddressOptions): AddressDetails {
    let signatureThreshold = 2;
    if (_.isInteger(params.threshold)) {
      signatureThreshold = params.threshold;
      if (signatureThreshold <= 0) {
        throw new Error('threshold has to be positive');
      }
      if (signatureThreshold > params.keychains.length) {
        throw new Error('threshold cannot exceed number of keys');
      }
    }

    let derivationChain = 0;
    if (_.isNumber(params.chain) && _.isInteger(params.chain) && params.chain > 0) {
      derivationChain = params.chain;
    }

    let derivationIndex = 0;
    if (_.isInteger(params.index) && params.index > 0) {
      derivationIndex = params.index;
    }

    const path = 'm/0/0/' + derivationChain + '/' + derivationIndex;
    // do not modify the original argument
    const keychainCopy = _.cloneDeep(params.keychains);
    const userKey = keychainCopy.shift();

    if (!userKey) {
      throw new Error('invalid required param keychains - missing user key');
    }
    const aspKeyIds = keychainCopy.map((key) => key.aspKeyId);
    const userKeyNode = prova.HDNode.fromBase58(userKey.pub);
    const derivedUserKey = hdPath(userKeyNode).deriveKey(path).getPublicKeyBuffer();

    const provaAddress = new prova.Address(derivedUserKey, aspKeyIds, this.network);
    provaAddress.signatureCount = signatureThreshold;

    const addressDetails: any = {
      chain: derivationChain,
      index: derivationIndex,
      coin: this.getChain(),
      coinSpecific: {
        outputScript: provaAddress.toScript().toString('hex')
      },
    };

    try {
      addressDetails.address = provaAddress.toString();
    } catch (e) {
      // non-(n-1)/n signature count
      addressDetails.address = null;
    }

    return addressDetails;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @returns {{txHex}}
   */
  signTransaction(params: SignTransactionOptions): { txHex: string } {
    const txPrebuild = params.txPrebuild;
    const userPrv = params.prv;

    if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
      if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
        throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
      }
      throw new Error('missing txPrebuild parameter');
    }

    let transaction = prova.Transaction.fromHex(txPrebuild.txHex);

    if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
      throw new Error('length of unspents array should equal to the number of transaction inputs');
    }

    if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
      if (!_.isUndefined(userPrv) && !_.isString(userPrv)) {
        throw new Error(`prv must be a string, got type ${typeof userPrv}`);
      }
      throw new Error('missing prv parameter to sign transaction');
    }

    const keychain = prova.HDNode.fromBase58(userPrv, this.network);

    const signatureIssues: any[] = [];
    const keychainHdPath = hdPath(keychain);

    for (let index = 0; index < transaction.ins.length; ++index) {
      const currentUnspent = txPrebuild.txInfo.unspents[index];
      const path = 'm/0/0/' + currentUnspent.chain + '/' + currentUnspent.index;
      const privKey = keychainHdPath.deriveKey(path);

      const currentSignatureIssue: any = {
        inputIndex: index,
        unspent: currentUnspent,
        path: path
      };

      const unspentAddress = prova.Address.fromBase58(currentUnspent.address);
      const subscript = unspentAddress.toScript();
      const txb = prova.TransactionBuilder.fromTransaction(transaction, this.network);
      try {
        txb.sign(index, privKey, subscript, currentUnspent.value);
      } catch (e) {
        currentSignatureIssue.error = e;
        signatureIssues.push(currentSignatureIssue);
        continue;
      }

      transaction = txb.buildIncomplete();
      const isValidSignature = this.verifySignature(transaction, index, currentUnspent.value);
      if (!isValidSignature) {
        currentSignatureIssue.error = new Error('invalid signature');
        signatureIssues.push(currentSignatureIssue);
      }
    }

    if (signatureIssues.length > 0) {
      const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex);
      const error: any = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
      error.code = 'input_signature_failure';
      error.signingErrors = signatureIssues;
      throw error;
    }

    return {
      txHex: transaction.toHex()
    };
  }

  /**
   * Verify the signature(s) on a (half-signed) transaction
   * @param transaction provajs-lib tx object
   * @param inputIndex The input whose signature is to be verified
   * @param amount The input amount needs to be known for signature verification
   * @param verificationSettings
   * @param verificationSettings.signatureIndex The index of the signature to verify (only iterates over non-empty signatures)
   * @param verificationSettings.publicKey The hex of the public key to verify (will verify all signatures)
   * @returns {boolean}
   */
  verifySignature(transaction: any, inputIndex: number, amount?: number, verificationSettings: { signatureIndex?: number; publicKey?: string; } = {}): boolean {
    if (!(transaction instanceof prova.Transaction)) {
      throw new Error('transaction has to be an instance of prova.Transaction');
    }

    const currentInput = transaction.ins[inputIndex];
    const signatureScript = currentInput.script;
    const decompiledSigScript = prova.script.decompile(signatureScript);
    // the public keys are all the even-indexed entries
    const publicKeys = _.filter(decompiledSigScript, (item, index: number) => index % 2 === 0);
    // convert the keys to their hex representations
    const publicKeyHexes = _.map(publicKeys, k => (k as any).toString('hex'));
    // the signatures are all the odd-indexed ones
    const signatures = _.filter(decompiledSigScript, (item, index: number) => index % 2 === 1);
    // we map them to each other
    const signaturesByKeys = _.zipObject(publicKeyHexes, signatures);

    let publicKeysToVerify = publicKeyHexes;
    const publicKeyHex = verificationSettings.publicKey;

    if (!_.isUndefined(verificationSettings.signatureIndex)) {
      publicKeysToVerify = [publicKeyHexes[verificationSettings.signatureIndex]];
    }

    let areAllSignaturesValid = true;
    for (const currentPublicKeyHex of publicKeysToVerify) {

      if (!_.isUndefined(publicKeyHex) && publicKeyHex !== currentPublicKeyHex) {
        areAllSignaturesValid = false;
        continue;
      }

      if (_.isEmpty(currentPublicKeyHex)) {
        areAllSignaturesValid = false;
        continue;
      }

      let isSignatureValid = false;
      const publicKeyBuffer = Buffer.from(currentPublicKeyHex, 'hex');
      const signatureBuffer = signaturesByKeys[currentPublicKeyHex];

      if (Buffer.isBuffer(publicKeyBuffer) && publicKeyBuffer.length > 0 && Buffer.isBuffer(signatureBuffer) && signatureBuffer.length > 0) {
        const publicKey = prova.ECPair.fromPublicKeyBuffer(publicKeyBuffer);
        const signatureHash = transaction.hashForWitnessV0(inputIndex, null, amount, prova.Transaction.SIGHASH_ALL);
        isSignatureValid = publicKey.verify(signatureHash, signatureBuffer);
      }

      if (!_.isUndefined(publicKeyHex) && isSignatureValid) {
        // We were trying to see if any of the signatures was valid for the given public key. Evidently yes.
        return true;
      }

      areAllSignaturesValid = isSignatureValid && areAllSignaturesValid;
    }

    return areAllSignaturesValid;
  }

  /**
   * Explain/parse transaction
   * @param params
   * @param callback
   */
  explainTransaction(params: ExplainTransactionOptions, callback?: NodeCallback<TransactionExplanation>): Bluebird<TransactionExplanation> {
    return co<TransactionExplanation>(function *() {
      const self = this;
      const transaction = prova.Transaction.fromHex(params.txHex);
      const id = transaction.getId();
      let changeAddresses: string[] = [];
      let spendAmount = 0;
      let changeAmount = 0;
      if (params.txInfo && params.txInfo.changeAddresses) {
        changeAddresses = params.txInfo.changeAddresses;
      }
      const explanation: any = {
        displayOrder: ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs'],
        id: id,
        outputs: [],
        changeOutputs: []
      };
      transaction.outs.forEach(function(currentOutput) {
        const currentAddress = prova.Address.fromScript(currentOutput.script, self.network).toString();
        const currentAmount = currentOutput.value;

        if (changeAddresses.indexOf(currentAddress) !== -1) {
          // this is change
          changeAmount += currentAmount;
          explanation.changeOutputs.push({
            address: currentAddress,
            amount: currentAmount
          });
          return;
        }

        spendAmount += currentAmount;
        explanation.outputs.push({
          address: currentAddress,
          amount: currentAmount
        });
      });
      explanation.outputAmount = spendAmount;
      explanation.changeAmount = changeAmount;

      // add fee info if available
      if (params.feeInfo) {
        explanation.displayOrder.push('fee');
        explanation.fee = params.feeInfo;
      }
      return explanation;
    }).call(this).asCallback(callback);
  }

  protected getAddressInfoFromExplorer(address: string): Bluebird<AddressInfo> {
    throw new MethodNotImplementedError();
  }

  protected getUnspentInfoFromExplorer(address: string): Bluebird<UnspentInfo[]> {
    throw new MethodNotImplementedError();
  }
}
