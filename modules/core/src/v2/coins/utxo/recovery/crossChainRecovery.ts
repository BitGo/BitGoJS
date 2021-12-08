/**
 * @prettier
 */
import * as _ from 'lodash';
import * as request from 'superagent';

import * as utxolib from '@bitgo/utxo-lib';
import { VirtualSizes } from '@bitgo/unspents';

import { BitGo } from '../../../../bitgo';
import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { Ltc } from '../../ltc';
import { Wallet } from '../../../wallet';

import { PublicUnspent } from '../unspent';
import { BaseCoin } from '../../../baseCoin';
import { Keychain } from '../../../keychains';
import { Triple } from '../../../triple';

export interface ExplorerTxInfo {
  input: { address: string }[];
  outputs: { address: string }[];
}

class BitgoPublicApi {
  constructor(public coin: BaseCoin) {}

  async getTransactionInfo(txid: string): Promise<ExplorerTxInfo> {
    const url = this.coin.url(`/public/tx/${txid}`);
    return ((await request.get(url)) as { body: ExplorerTxInfo }).body;
  }

  /**
   * Fetch unspent transaction outputs using IMS unspents API
   * @param addresses
   * @returns {*}
   */
  async getUnspentInfo(addresses: string[]): Promise<PublicUnspent[]> {
    const url = this.coin.url(`/public/addressUnspents/${_.uniq(addresses).join(',')}`);
    return (await request.get(url)).body as PublicUnspent[];
  }
}

interface CrossChainRecoveryToolOptions {
  bitgo: BitGo;
  sourceCoin?: AbstractUtxoCoin;
  recoveryCoin?: AbstractUtxoCoin;
  logging: boolean;
}

export interface SignRecoveryTransactionOptions {
  prv?: string;
  passphrase?: string;
}

export interface BuildRecoveryTransactionOptions {
  wallet: string;
  faultyTxId: string;
  recoveryAddress: string;
}

export interface RecoveryTxInfo {
  inputAmount: number;
  outputAmount: number;
  spendAmount: number;
  inputs: any[];
  outputs: any[];
  externalOutputs: any[];
  changeOutputs: any[];
  minerFee: number;
  payGoFee: number;
  unspents: any[];
}

export interface HalfSignedRecoveryTx {
  txHex: string;
  tx?: string;
}

export interface CrossChainRecoveryUnsigned {
  txHex: string;
  txInfo?: RecoveryTxInfo;
  walletId: string;
  feeInfo: unknown;
  address: string;
  coin: string;
}

export interface CrossChainRecoverySigned {
  version: 1 | 2;
  txHex?: string;
  txInfo?: RecoveryTxInfo;
  walletId: string;
  sourceCoin: string;
  recoveryCoin: string;
  recoveryAddress?: string;
  recoveryAmount?: number;
}

/**
 * An instance of the recovery tool, which encapsulates the recovery functions
 * Instantiated with parameters:
 *   - bitgo: an instance of the bitgo SDK
 *   - sourceCoin: the coin that needs to be recovered
 *   - recoveryCoin: the type of address the faulty transaction was sent to
 */
export class CrossChainRecoveryTool {
  bitgo: BitGo;
  bitgoPublicApi: BitgoPublicApi;
  sourceCoin: AbstractUtxoCoin;
  recoveryCoin: AbstractUtxoCoin;
  logging: boolean;
  supportedCoins: string[];
  wallet: any; // This can be either a v1 or v2 wallet
  feeRates: { [key: string]: number };
  recoveryTx: any;
  logger: any;
  private unspents?: any;
  txInfo?: RecoveryTxInfo;
  recoveryAddress?: string;
  recoveryAmount?: number;
  halfSignedRecoveryTx?: HalfSignedRecoveryTx;

  constructor(opts: CrossChainRecoveryToolOptions) {
    this.bitgo = opts.bitgo;
    this.logging = opts.logging;

    if (_.isUndefined(this.bitgo)) {
      throw new Error('Please instantiate the recovery tool with a bitgo instance.');
    }

    // List of coins we support. Add modifiers (e.g. segwit) after the dash
    this.supportedCoins = ['btc', 'bch', 'ltc', 'btc-segwit', 'bsv'];

    if (_.isUndefined(opts.sourceCoin) || !this.supportedCoins.includes(opts.sourceCoin.getFamily())) {
      throw new Error('Please set a valid source coin');
    }
    this.sourceCoin = opts.sourceCoin;
    this.bitgoPublicApi = new BitgoPublicApi(this.sourceCoin);

    if (_.isUndefined(opts.recoveryCoin) || !this.supportedCoins.includes(opts.recoveryCoin.getFamily())) {
      throw new Error('Please set a valid recovery type');
    }
    this.recoveryCoin = opts.recoveryCoin;

    this.wallet = null;

    this.feeRates = {
      bch: 20,
      tbch: 20,
      bsv: 20,
      tbsv: 20,
      btc: 80,
      tbtc: 80,
      ltc: 100,
      tltc: 100,
    };

    this.recoveryTx = utxolib.bitgo.createTransactionBuilderForNetwork(this.sourceCoin.network);
  }

  /**
   * Internal logging function (either uses provided logger or console.log, can be turned off)
   * @param args - the arguments to pass to the logger
   * @private
   */
  _log(...args) {
    if (!this.logging) {
      return;
    }

    this.logger ? this.logger(...args) : console.log(...args);
  }

  /**
   * Sets the wallet ID of the recoveryCoin wallet. This is needed to find the private key to sign the transaction.
   * @param walletId {String} wallet ID
   */
  protected async setWallet(walletId?: string): Promise<void> {
    const coinType = this.recoveryCoin.getChain();
    if (_.isUndefined(walletId)) {
      throw new Error('Please provide wallet id');
    }

    this._log(`Fetching ${coinType} wallet...`);

    if (this.sourceCoin.type !== coinType && this.recoveryCoin.type !== coinType) {
      throw new Error('Cannot set a wallet for this coin type - this is not a coin involved in the recovery tx.');
    }

    let wallet: Wallet | undefined;
    try {
      wallet = await this.bitgo.coin(coinType).wallets().get({ id: walletId });
    } catch (e) {
      if (e.status !== 404 && e.status !== 400) {
        throw e;
      }

      wallet = undefined;
    }

    if (_.isUndefined(wallet) && coinType.endsWith('btc')) {
      try {
        this._log('Could not find v2 wallet. Falling back to v1...');
        wallet = await this.bitgo.wallets().get({ id: walletId });
        (wallet as any).isV1 = true;
      } catch (e) {
        if (e.status !== 404) {
          throw e;
        }
      }
    }

    if (_.isUndefined(wallet)) {
      throw new Error(`Cannot find ${coinType} wallet.`);
    }

    this.wallet = wallet;
  }

  /**
   * Retrieves and stores the unspents from the faulty transaction
   * @param faultyTxId {String} the txid of the faulty transaction
   */
  protected async findUnspents(faultyTxId?: string): Promise<any> {
    if (_.isUndefined(faultyTxId)) {
      throw new Error('Please provide a faultyTxId');
    }

    this._log('Grabbing info for faulty tx...');

    // calling source coin's method of exploring transactions
    const faultyTxInfo = (await this.bitgoPublicApi.getTransactionInfo(faultyTxId)) as unknown as ExplorerTxInfo;

    this._log('Getting unspents on output addresses..');
    // Get output addresses that do not belong to wallet
    // These are where the 'lost coins' live
    const txOutputAddresses = faultyTxInfo.outputs.map((input) => input.address);

    let outputAddresses: string[] = [];
    for (let address of txOutputAddresses) {
      if (this.sourceCoin.getFamily() === 'ltc') {
        try {
          address = (this.sourceCoin as Ltc).canonicalAddress(address, 1);
        } catch (e) {
          continue;
        }
      }

      if (this.recoveryCoin.getFamily() === 'ltc') {
        try {
          address = (this.recoveryCoin as Ltc).canonicalAddress(address, 2);
        } catch (e) {
          continue;
        }
      }

      try {
        const methodName = this.wallet.isV1 ? 'address' : 'getAddress';
        const walletAddress = (await this.wallet[methodName]({ address: address })) as any;
        outputAddresses.push(walletAddress.address);
      } catch (e) {
        this._log(`Address ${address} not found on wallet`);
      }
    }

    if (outputAddresses.length === 0) {
      throw new Error(
        'Could not find tx outputs belonging to the specified wallet. Please check the given parameters.'
      );
    }

    if (this.recoveryCoin.getFamily() === 'ltc') {
      outputAddresses = outputAddresses.map((address) => (this.recoveryCoin as Ltc).canonicalAddress(address, 1));
    }

    if (this.sourceCoin.getFamily() === 'ltc') {
      outputAddresses = outputAddresses.map((address) => (this.sourceCoin as Ltc).canonicalAddress(address, 2));
    }

    this._log(`Finding unspents for these output addresses: ${outputAddresses.join(', ')}`);

    // Get unspents for addresses. Calling source coin's method of fetching unspents
    const unspents = (await this.bitgoPublicApi.getUnspentInfo(outputAddresses)) as any;

    this.unspents = unspents;
    return unspents;
  }

  /**
   * Constructs transaction inputs from a set of unspents.
   * @param unspents {Object[]} array of unspents from the faulty transaction
   * @returns {Object} partial txInfo object with transaction inputs
   */
  protected async buildInputs(unspents?: any): Promise<any> {
    this._log('Building inputs for recovery transaction...');

    unspents = unspents || this.unspents;

    if (_.isUndefined(unspents) || unspents.length === 0) {
      throw new Error('Could not find unspents. Either supply an argument or call findUnspents');
    }

    const txInfo: any = {
      inputAmount: 0,
      outputAmount: 0,
      spendAmount: 0,
      inputs: [],
      outputs: [],
      unspents: [],
      externalOutputs: [],
      changeOutputs: [],
      minerFee: 0,
      payGoFee: 0,
    };

    let totalFound = 0;
    const noSegwit = this.recoveryCoin.getFamily() === 'btc' && this.sourceCoin.getFamily() === 'bch';
    for (const unspent of unspents) {
      if (unspent.witnessScript && noSegwit) {
        throw new Error(
          'Warning! It appears one of the unspents is on a Segwit address. The tool only recovers BCH from non-Segwit BTC addresses. Aborting.'
        );
      }

      let searchAddress = unspent.address;

      if (this.sourceCoin.type.endsWith('ltc')) {
        searchAddress = (this.sourceCoin as Ltc).canonicalAddress(searchAddress, 1);
      }

      if (this.recoveryCoin.type.endsWith('ltc')) {
        searchAddress = (this.recoveryCoin as Ltc).canonicalAddress(searchAddress, 2);
      }

      let unspentAddress;
      try {
        const methodName = this.wallet.isV1 ? 'address' : 'getAddress';
        unspentAddress = await this.wallet[methodName]({ address: searchAddress });
      } catch (e) {
        this._log(`Could not find address on wallet for ${searchAddress}`);
        continue;
      }

      this._log(`Found ${unspent.value * 1e-8} ${this.sourceCoin.type} at address ${unspent.address}`);

      const [txHash, index] = unspent.id.split(':');
      const inputIndex = parseInt(index, 10);
      let hash = Buffer.from(txHash, 'hex');
      hash = Buffer.from(Array.prototype.reverse.call(hash));

      try {
        this.recoveryTx.addInput(hash, inputIndex);
      } catch (e) {
        throw new Error(`Error adding unspent ${unspent.id}`);
      }

      let inputData = {};

      // Add v1 specific input fields
      if (this.wallet.isV1) {
        const addressInfo = (await this.wallet.address({ address: unspentAddress.address })) as any;

        unspentAddress.path = unspentAddress.path || `/${unspentAddress.chain}/${unspentAddress.index}`;
        const [txid, nOut] = unspent.id.split(':');

        inputData = {
          redeemScript: addressInfo.redeemScript,
          witnessScript: addressInfo.witnessScript,
          path: '/0/0' + unspentAddress.path,
          chainPath: unspentAddress.path,
          index: unspentAddress.index,
          chain: unspentAddress.chain,
          txHash: txid,
          txOutputN: parseInt(nOut, 10),
          txValue: unspent.value,
          value: parseInt(unspent.value, 10),
        };
      } else {
        inputData = {
          redeemScript: unspentAddress.coinSpecific.redeemScript,
          witnessScript: unspentAddress.coinSpecific.witnessScript,
          index: unspentAddress.index,
          chain: unspentAddress.chain,
          wallet: this.wallet.id(),
          fromWallet: this.wallet.id(),
        };
      }

      txInfo.inputs.push(Object.assign({}, unspent, inputData));

      txInfo.inputAmount += parseInt(unspent.value, 10);
      totalFound += parseInt(unspent.value, 10);
    }

    txInfo.unspents = _.clone(txInfo.inputs);

    // Normalize total found to base unit before we print it out
    this._log(`Found lost ${totalFound * 1e-8} ${this.sourceCoin.type}.`);

    this.txInfo = txInfo;
    return txInfo;
  }

  /**
   * Sets the txInfo.minerFee field by calculating the size of the transaction and multiplying it by the fee rate for
   * the source coin.
   * @param recoveryTx {Object} recovery transaction containing inputs
   * @returns {Number} recovery fee for the transaction
   */
  protected setFees(recoveryTx?: any): number {
    recoveryTx = recoveryTx || this.recoveryTx;

    // Determine fee with default fee rate
    const feeRate = this.feeRates[this.sourceCoin.type];

    // Note that we assume one output here (all funds should be recovered to a single address)
    const txSize =
      VirtualSizes.txP2shInputSize * recoveryTx.tx.ins.length +
      VirtualSizes.txP2pkhOutputSize +
      VirtualSizes.txOverheadSize;
    const recoveryFee = feeRate * txSize;

    if (this.txInfo) {
      this.txInfo.minerFee = recoveryFee;
    }

    return recoveryFee;
  }

  /**
   * Constructs a single output to the recovery address.
   * @param recoveryAddress {String} address to recover funds to
   * @param outputAmount {Number} amount to send to the recovery address
   * @param recoveryFee {Number} miner fee for the transaction
   */
  protected buildOutputs(recoveryAddress: string, outputAmount?: number, recoveryFee?: number): void {
    if (_.isUndefined(outputAmount) && _.isUndefined(this.txInfo)) {
      throw new Error('Could not find transaction info. Please provide an output amount, or call buildInputs.');
    }

    this._log(`Building outputs for recovery transaction. Funds will be sent to ${recoveryAddress}...`);

    const txInputAmount = outputAmount || (this.txInfo && this.txInfo.inputAmount);
    const txFeeAmount = recoveryFee || (this.txInfo && this.txInfo.minerFee);

    if (!txInputAmount) {
      throw new Error('could not determine transaction input amount');
    }
    if (!txFeeAmount) {
      throw new Error('could not determine transaction fee amount');
    }
    const txOutputAmount = txInputAmount - txFeeAmount;

    if (txOutputAmount <= 0) {
      throw new Error('This recovery transaction cannot pay its own fees. Aborting.');
    }

    if (!_.isUndefined(this.txInfo)) {
      this.txInfo.outputAmount = txOutputAmount;
      this.txInfo.spendAmount = txOutputAmount;
    }

    this.recoveryAddress = recoveryAddress;
    this.recoveryAmount = txOutputAmount;

    this.recoveryTx.addOutput(recoveryAddress, txOutputAmount);

    const outputData = {
      address: recoveryAddress,
      value: outputAmount,
      valueString: txOutputAmount.toString(),
      wallet: this.wallet.id(),
      change: false,
    };

    if (this.txInfo) {
      this.txInfo.outputs.push(outputData);
      this.txInfo.externalOutputs.push(outputData);
    }
  }

  /**
   * Half-signs the built transaction with the user's private key or keychain
   * @param params
   * @param params.prv {String} private key
   * @param params.passphrase {String} wallet passphrase
   * @returns {Object} half-signed transaction
   */
  async signTransaction(params: SignRecoveryTransactionOptions): Promise<any> {
    if (_.isUndefined(this.txInfo)) {
      throw new Error('Could not find txInfo. Please build a transaction');
    }

    this._log('Signing the transaction...');

    const transactionHex = this.recoveryTx.buildIncomplete().toHex();

    const prv = params.prv ? params.prv : params.passphrase ? await this.getXprv(params.passphrase) : undefined;
    if (!prv) {
      throw new Error(`must provide prv or passphrase`);
    }
    const pubs: Triple<string> = await this.getXpubs();

    const txPrebuild = { txHex: transactionHex, txInfo: this.txInfo };
    this.halfSignedRecoveryTx = (await this.sourceCoin.signTransaction({
      txPrebuild,
      prv,
      pubs,
      cosignerPub: pubs[2],
    })) as any;

    return this.halfSignedRecoveryTx;
  }

  async getXpubs(): Promise<Triple<string>> {
    if (this.wallet.isV1) {
      return this.wallet.keychains.map((k) => k.xpub);
    }
    const keychains = (await this.recoveryCoin
      .keychains()
      .getKeysForSigning({ wallet: this.wallet })) as unknown as Keychain[];
    if (keychains.length !== 3) {
      throw new Error(`expected triple got ${keychains.length}`);
    }
    return keychains.map((k) => k.pub) as Triple<string>;
  }

  /**
   * Gets the wallet's encrypted keychain, then decrypts it with the wallet passphrase
   * @param passphrase {String} wallet passphrase
   * @returns {String} decrypted wallet private key
   */
  async getXprv(passphrase: string): Promise<string> {
    let prv;

    let keychain;
    try {
      keychain = await this.wallet.getEncryptedUserKeychain();
    } catch (e) {
      if (e.status !== 404) {
        throw e;
      }
    }

    if (_.isUndefined(passphrase)) {
      throw new Error('You have an encrypted user keychain - please provide the passphrase to decrypt it');
    }

    if (this.wallet.isV1) {
      if (_.isUndefined(keychain)) {
        throw new Error('V1 wallets need a user keychain - could not find the proper keychain. Aborting');
      }
    }

    if (keychain) {
      try {
        const encryptedPrv = this.wallet.isV1 ? keychain.encryptedXprv : keychain.encryptedPrv;
        prv = this.bitgo.decrypt({ input: encryptedPrv, password: passphrase });
      } catch (e) {
        throw new Error('Error reading private key. Please check that you have the correct wallet passphrase');
      }
    }

    return prv;
  }

  async buildTransaction(params: BuildRecoveryTransactionOptions): Promise<any> {
    await this.setWallet(params.wallet);

    await this.findUnspents(params.faultyTxId);
    await this.buildInputs();
    this.setFees();
    this.buildOutputs(params.recoveryAddress);

    return this.recoveryTx;
  }

  async buildUnsigned(): Promise<CrossChainRecoveryUnsigned> {
    if (_.isUndefined(this.txInfo)) {
      throw new Error('Could not find txInfo. Please build a transaction');
    }
    const incomplete = this.recoveryTx.buildIncomplete();

    const txInfo: any = {
      nP2SHInputs: 0,
      nSegwitInputs: 0,
    };

    for (const input of this.txInfo.inputs) {
      if (input.chain === 10 || input.chain === 11) {
        txInfo.nSegwitInputs++;
      } else {
        txInfo.nP2SHInputs++;
      }
    }

    txInfo.nOutputs = 1;
    txInfo.unspents = _.map(
      this.txInfo.inputs,
      _.partialRight(_.pick, ['chain', 'index', 'redeemScript', 'id', 'address', 'value'])
    );
    txInfo.changeAddresses = [];
    txInfo.walletAddressDetails = {};

    const feeInfo: any = {};

    feeInfo.size =
      VirtualSizes.txOverheadSize +
      VirtualSizes.txP2shInputSize * this.txInfo.inputs.length +
      VirtualSizes.txP2pkhOutputSize;

    feeInfo.feeRate = this.feeRates[this.sourceCoin.type];
    feeInfo.fee = Math.round((feeInfo.size / 1000) * feeInfo.feeRate);
    feeInfo.payGoFee = 0;
    feeInfo.payGoFeeString = '0';

    return {
      txHex: incomplete.toHex(),
      txInfo: txInfo,
      feeInfo: feeInfo,
      walletId: this.wallet.id(),
      amount: this.recoveryAmount,
      address: this.recoveryAddress,
      coin: this.sourceCoin.type,
    } as any;
  }

  export(): CrossChainRecoverySigned {
    return {
      version: this.wallet.isV1 ? 1 : 2,
      sourceCoin: this.sourceCoin.type,
      recoveryCoin: this.recoveryCoin.type,
      walletId: this.wallet.id(),
      recoveryAddress: this.recoveryAddress,
      recoveryAmount: this.recoveryAmount,
      txHex: this.halfSignedRecoveryTx && (this.halfSignedRecoveryTx.txHex || this.halfSignedRecoveryTx.tx),
      txInfo: this.txInfo,
    };
  }
}
