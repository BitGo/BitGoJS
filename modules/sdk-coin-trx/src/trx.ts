/**
 * @prettier
 */
import * as secp256k1 from 'secp256k1';
import { randomBytes } from 'crypto';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import { bip32, networks } from '@bitgo/utxo-lib';
import * as request from 'superagent';
import {
  BaseCoin,
  BitGoBase,
  common,
  getBip32Keys,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  TransactionExplanation,
  TransactionFee,
  TransactionPrebuild as BaseTransactionPrebuild,
  TransactionRecipient as Recipient,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { Interface, Utils, WrappedBuilder } from './lib';
import { getBuilder } from './lib/builder';
import { TransactionReceipt } from './lib/iface';

export const MINIMUM_TRON_MSIG_TRANSACTION_FEE = 1e6;

export interface TronSignTransactionOptions extends SignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TxInfo {
  recipients: Recipient[];
  from: string;
  txid: string;
}

export interface AddressInfo {
  address: string;
  chain: number;
  index: number;
}

export interface TronTransactionExplanation extends TransactionExplanation {
  expiration: number;
  timestamp: number;
}

export interface TransactionPrebuild extends BaseTransactionPrebuild {
  txHex: string;
  txInfo: TxInfo;
  addressInfo?: AddressInfo;
  feeInfo: TransactionFee;
}

export interface ExplainTransactionOptions {
  txHex?: string; // txHex is poorly named here; it is just a wrapped JSON object
  halfSigned?: {
    txHex: string; // txHex is poorly named here; it is just a wrapped JSON object
  };
  feeInfo: TransactionFee;
}

export interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey: string; // Box C - this is bitgo's xpub and will be used to derive their root address
  recoveryDestination: string; // base58 address
  krsProvider?: string;
  walletPassphrase?: string;
}

export interface RecoveryTransaction {
  tx?: TransactionPrebuild;
  recoveryAmount?: number;
  tokenTxs?: TransactionReceipt[];
}

export enum NodeTypes {
  Full,
  Solidity,
}

/**
 * This structure is not a complete model of the AccountResponse from a node.
 */
export interface AccountResponse {
  data: [Interface.AccountInfo];
}

export class Trx extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('9cf6d137-6c6b-4fc0-acc0-8e78a1599c15');

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Trx(bitgo);
  }

  getId(): string {
    return this._staticsCoin.id;
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritdoc */
  transactionDataAllowed() {
    return true;
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /** @inheritDoc */
  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    if (!address) {
      return false;
    }
    return this.isValidHexAddress(address) || Utils.isBase58Address(address);
  }

  /**
   * Checks if this is a valid hex address
   * @param address hex address
   */
  isValidHexAddress(address: string): boolean {
    return address.length === 42 && /^(0x)?([0-9a-f]{2})+$/i.test(address);
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    // TODO: move this and address creation logic to account-lib
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256 bit chain code, both of which must be
      // random. 512 bits is therefore the maximum entropy and gives us maximum security against cracking.
      seed = randomBytes(512 / 8);
    }
    const hd = bip32.fromSeed(seed);
    return {
      pub: hd.neutered().toBase58(),
      prv: hd.toBase58(),
    };
  }

  isValidXpub(xpub: string): boolean {
    try {
      return bip32.fromBase58(xpub).isNeutered();
    } catch (e) {
      return false;
    }
  }

  isValidPub(pub: string): boolean {
    if (this.isValidXpub(pub)) {
      // xpubs can be converted into regular pubs, so technically it is a valid pub
      return true;
    }
    return new RegExp('^04[a-zA-Z0-9]{128}$').test(pub);
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  /**
   * Derive a user key using the chain path of the address
   * @param key
   * @param path
   * @returns {string} derived private key
   */
  deriveKeyWithPath({ key, path }: { key: string; path: string }): string {
    const keychain = bip32.fromBase58(key);
    const derivedKeyNode = keychain.derivePath(path);
    return derivedKeyNode.toBase58();
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {Object} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param params.wallet.addressVersion {String} this is the version of the Algorand multisig address generation format
   * @returns Bluebird<SignedTransaction>
   */
  async signTransaction(params: TronSignTransactionOptions): Promise<SignedTransaction> {
    const txBuilder = getBuilder(this.getChain()).from(params.txPrebuild.txHex);

    let key;
    const { chain, index } = params.txPrebuild?.addressInfo ?? { chain: 0, index: 0 };
    if (chain === 0 && index === 0) {
      key = params.prv;
    } else {
      const derivationPath = `0/0/${chain}/${index}`;
      key = this.deriveKeyWithPath({ key: params.prv, path: derivationPath });
    }
    txBuilder.sign({ key });

    const transaction = await txBuilder.build();
    const response = {
      txHex: JSON.stringify(transaction.toJson()),
    };
    if (transaction.toJson().signature.length >= 2) {
      return response;
    }
    // Half signed transaction
    return {
      halfSigned: response,
    };
  }

  /**
   * Return boolean indicating whether input is valid seed for the coin
   *
   * @param prv - the prv to be checked
   */
  isValidXprv(prv: string): boolean {
    try {
      return !bip32.fromBase58(prv).isNeutered();
    } catch {
      return false;
    }
  }

  /**
   * Convert a message to string in hexadecimal format.
   *
   * @param message {Buffer|String} message to sign
   * @return the message as a hexadecimal string
   */
  toHexString(message: string | Buffer): string {
    if (typeof message === 'string') {
      return Buffer.from(message).toString('hex');
    } else if (Buffer.isBuffer(message)) {
      return message.toString('hex');
    } else {
      throw new Error('Invalid messaged passed to signMessage');
    }
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const toSign = this.toHexString(message);

    let prv: string | undefined = key.prv;
    if (this.isValidXprv(prv)) {
      prv = bip32.fromBase58(prv).privateKey?.toString('hex');
    }

    if (!prv) {
      throw new Error('no privateKey');
    }
    let sig = Utils.signString(toSign, prv, true);

    // remove the preceding 0x
    sig = sig.replace(/^0x/, '');

    return Buffer.from(sig, 'hex');
  }

  /**
   * Converts an xpub to a uncompressed pub
   * @param xpub
   */
  xpubToUncompressedPub(xpub: string): string {
    if (!this.isValidXpub(xpub)) {
      throw new Error('invalid xpub');
    }

    const publicKey = bip32.fromBase58(xpub, networks.bitcoin).publicKey;
    return Buffer.from(secp256k1.publicKeyConvert(publicKey, false /* compressed */)).toString('hex');
  }

  /**
   * Modify prebuild before sending it to the server.
   * @param buildParams The whitelisted parameters for this prebuild
   */
  async getExtraPrebuildParams(buildParams: any): Promise<any> {
    if (buildParams.recipients[0].data && buildParams.feeLimit) {
      buildParams.recipients[0].feeLimit = buildParams.feeLimit;
    }
  }

  pubToHexAddress(pub: string): string {
    const byteArrayAddr = Utils.getByteArrayFromHexAddress(pub);
    const rawAddress = Utils.getRawAddressFromPubKey(byteArrayAddr);
    return Utils.getHexAddressFromByteArray(rawAddress);
  }

  xprvToCompressedPrv(xprv: string): string {
    if (!this.isValidXprv(xprv)) {
      throw new Error('invalid xprv');
    }

    const hdNode = bip32.fromBase58(xprv, networks.bitcoin);
    if (!hdNode.privateKey) {
      throw new Error('no privateKey');
    }
    return hdNode.privateKey.toString('hex');
  }

  /**
   * Make a query to Trongrid for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @returns {Object} response from Trongrid
   */
  private async recoveryPost(query: { path: string; jsonObj: any; node: NodeTypes }): Promise<any> {
    let nodeUri = '';
    switch (query.node) {
      case NodeTypes.Full:
        nodeUri = common.Environments[this.bitgo.getEnv()].tronNodes.full;
        break;
      case NodeTypes.Solidity:
        nodeUri = common.Environments[this.bitgo.getEnv()].tronNodes.solidity;
        break;
      default:
        throw new Error('node type not found');
    }

    const response = await request
      .post(nodeUri + query.path)
      .type('json')
      .send(query.jsonObj);

    if (!response.ok) {
      throw new Error('could not reach Tron node');
    }

    // unfortunately, it doesn't look like most TRON nodes return valid json as body
    return JSON.parse(response.text);
  }

  /**
   * Make a query to Trongrid for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @returns {Object} response from Trongrid
   */
  private async recoveryGet(query: { path: string; jsonObj: any; node: NodeTypes }): Promise<any> {
    let nodeUri = '';
    switch (query.node) {
      case NodeTypes.Full:
        nodeUri = common.Environments[this.bitgo.getEnv()].tronNodes.full;
        break;
      case NodeTypes.Solidity:
        nodeUri = common.Environments[this.bitgo.getEnv()].tronNodes.solidity;
        break;
      default:
        throw new Error('node type not found');
    }

    const response = await request
      .get(nodeUri + query.path)
      .type('json')
      .send(query.jsonObj);

    if (!response.ok) {
      throw new Error('could not reach Tron node');
    }

    // unfortunately, it doesn't look like most TRON nodes return valid json as body
    return JSON.parse(response.text);
  }

  /**
   * Query our explorer for the balance of an address
   * @param address {String} the address encoded in hex
   * @returns {BigNumber} address balance
   */
  private async getAccountBalancesFromNode(address: string): Promise<AccountResponse> {
    return await this.recoveryGet({
      path: '/v1/accounts/' + address,
      jsonObj: {},
      node: NodeTypes.Full,
    });
  }

  /**
   * Retrieves our build transaction from a node.
   * @param toAddr hex-encoded address
   * @param fromAddr hex-encoded address
   * @param amount
   */
  private async getBuildTransaction(
    toAddr: string,
    fromAddr: string,
    amount: number
  ): Promise<Interface.TransactionReceipt> {
    // our addresses should be base58, we'll have to encode to hex
    return await this.recoveryPost({
      path: '/wallet/createtransaction',
      jsonObj: {
        to_address: toAddr,
        owner_address: fromAddr,
        amount,
      },
      node: NodeTypes.Full,
    });
  }

  /**
   * Retrieves our build transaction from a node.
   * @param toAddr hex-encoded address
   * @param fromAddr hex-encoded address
   * @param amount
   */
  private async getTriggerSmartContractTransaction(
    toAddr: string,
    fromAddr: string,
    amount: string,
    contractAddr: string
  ): Promise<{ transaction: Interface.TransactionReceipt }> {
    const functionSelector = 'transfer(address,uint256)';
    const types = ['address', 'uint256'];
    const values = [toAddr, amount];
    const parameter = Utils.encodeDataParams(types, values, '');
    return await this.recoveryPost({
      path: '/wallet/triggersmartcontract',
      jsonObj: {
        owner_address: fromAddr,
        contract_address: contractAddr,
        function_selector: functionSelector,
        parameter: parameter,
        fee_limit: 100000000,
      },
      node: NodeTypes.Full,
    });
  }

  /**
   * Throws an error if any keys in the ownerKeys collection don't match the keys array we pass
   * @param ownerKeys
   * @param keys
   */
  checkPermissions(ownerKeys: { address: string; weight: number }[], keys: string[]) {
    keys = keys.map((k) => k.toUpperCase());

    ownerKeys.map((key) => {
      const hexKey = key.address.toUpperCase();
      if (!keys.includes(hexKey)) {
        throw new Error(`pub address ${hexKey} not found in account`);
      }

      if (key.weight !== 1) {
        throw new Error('owner permission is invalid for this structure');
      }
    });
  }

  /**
   * Builds a funds recovery transaction without BitGo.
   * We need to do three queries during this:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param params
   */
  async recover(params: RecoveryOptions): Promise<RecoveryTransaction> {
    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    if (!this.isValidAddress(params.recoveryDestination)) {
      throw new Error('Invalid destination address!');
    }

    // get our user, backup keys
    const keys = getBip32Keys(this.bitgo, params, { requireBitGoXpub: false });

    // we need to decode our bitgoKey to a base58 address
    const bitgoHexAddr = this.pubToHexAddress(this.xpubToUncompressedPub(params.bitgoKey));
    const recoveryAddressHex = Utils.getHexAddressFromBase58Address(params.recoveryDestination);

    // call the node to get our account balance
    const account = await this.getAccountBalancesFromNode(Utils.getBase58AddressFromHex(bitgoHexAddr));
    const recoveryAmount = account.data[0].balance;

    const userXPub = keys[0].neutered().toBase58();
    const userXPrv = keys[0].toBase58();
    const backupXPub = keys[1].neutered().toBase58();

    // first construct token txns
    const tokenTxns: any = [];
    for (const token of account.data[0].trc20) {
      // mainnet tokens
      if (token.TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8) {
        const amount = token.TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8;
        const contractAddr = Utils.getHexAddressFromBase58Address('TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8');
        tokenTxns.push(
          (await this.getTriggerSmartContractTransaction(recoveryAddressHex, bitgoHexAddr, amount, contractAddr))
            .transaction
        );
      } else if (token.TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t) {
        const amount = token.TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t;
        const contractAddr = Utils.getHexAddressFromBase58Address('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
        tokenTxns.push(
          (await this.getTriggerSmartContractTransaction(recoveryAddressHex, bitgoHexAddr, amount, contractAddr))
            .transaction
        );

        // testnet tokens
      } else if (token.TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id) {
        const amount = token.TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id;
        const contractAddr = Utils.getHexAddressFromBase58Address('TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id');
        tokenTxns.push(
          (await this.getTriggerSmartContractTransaction(recoveryAddressHex, bitgoHexAddr, amount, contractAddr))
            .transaction
        );
      } else if (token.TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs) {
        const amount = token.TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs;
        const contractAddr = Utils.getHexAddressFromBase58Address('TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs');
        tokenTxns.push(
          (await this.getTriggerSmartContractTransaction(recoveryAddressHex, bitgoHexAddr, amount, contractAddr))
            .transaction
        );
      }
    }
    // construct the tx -
    // there's an assumption here being made about fees: for a wallet that hasn't been used in awhile, the implication is
    // it has maximum bandwidth. thus, a recovery should cost the minimum amount (1e6 sun or 1 Tron)
    if (MINIMUM_TRON_MSIG_TRANSACTION_FEE > recoveryAmount) {
      throw new Error('Amount of funds to recover wouldnt be able to fund a send');
    }

    const keyHexAddresses = [
      this.pubToHexAddress(this.xpubToUncompressedPub(userXPub)),
      this.pubToHexAddress(this.xpubToUncompressedPub(backupXPub)),
      bitgoHexAddr,
    ];

    // run checks to ensure this is a valid tx - permissions match our signer keys
    const ownerKeys: { address: string; weight: number }[] = [];
    for (const key of account.data[0].owner_permission.keys) {
      const address = Utils.getHexAddressFromBase58Address(key.address);
      const weight = key.weight;
      ownerKeys.push({ address, weight });
    }
    const activePermissionKeys: { address: string; weight: number }[] = [];
    for (const key of account.data[0].active_permission[0].keys) {
      const address = Utils.getHexAddressFromBase58Address(key.address);
      const weight = key.weight;
      activePermissionKeys.push({ address, weight });
    }
    this.checkPermissions(ownerKeys, keyHexAddresses);
    this.checkPermissions(activePermissionKeys, keyHexAddresses);

    // build and sign token txns
    const finalTokenTxs: any = [];
    for (const tokenTxn of tokenTxns) {
      const txBuilder = getBuilder(this.getChain()).from(tokenTxn);

      // this tx should be enough to drop into a node
      if (isUnsignedSweep) {
        finalTokenTxs.push((await txBuilder.build()).toJson());
        continue;
      }

      const userPrv = this.xprvToCompressedPrv(userXPrv);

      txBuilder.sign({ key: userPrv });

      // krs recoveries don't get signed
      if (!isKrsRecovery) {
        const backupXPrv = keys[1].toBase58();
        const backupPrv = this.xprvToCompressedPrv(backupXPrv);

        txBuilder.sign({ key: backupPrv });
      }
      finalTokenTxs.push((await txBuilder.build()).toJson());
    }

    // tokens must be recovered before the native asset, so that there is sufficient of the native asset to cover fees
    if (finalTokenTxs.length > 0) {
      return {
        tokenTxs: finalTokenTxs,
      };
    }

    const recoveryAmountMinusFees = recoveryAmount - MINIMUM_TRON_MSIG_TRANSACTION_FEE;
    const buildTx = await this.getBuildTransaction(recoveryAddressHex, bitgoHexAddr, recoveryAmountMinusFees);

    // construct our tx
    const txBuilder = (getBuilder(this.getChain()) as WrappedBuilder).from(buildTx);

    // this tx should be enough to drop into a node
    if (isUnsignedSweep) {
      return {
        tx: (await txBuilder.build()).toJson(),
        recoveryAmount: recoveryAmountMinusFees,
      };
    }

    const userPrv = this.xprvToCompressedPrv(userXPrv);

    txBuilder.sign({ key: userPrv });

    // krs recoveries don't get signed
    if (!isKrsRecovery) {
      const backupXPrv = keys[1].toBase58();
      const backupPrv = this.xprvToCompressedPrv(backupXPrv);

      txBuilder.sign({ key: backupPrv });
    }

    return {
      tx: (await txBuilder.build()).toJson(),
      recoveryAmount: recoveryAmountMinusFees,
    };
  }

  /**
   * Explain a Tron transaction from txHex
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TronTransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = getBuilder(this.getChain()).from(txHex);
    const tx = await txBuilder.build();
    const outputs = [
      {
        amount: tx.outputs[0].value.toString(),
        address: tx.outputs[0].address, // Should turn it into a readable format, aka base58
      },
    ];

    const displayOrder = [
      'id',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'fee',
      'timestamp',
      'expiration',
    ];

    return {
      displayOrder,
      id: tx.id,
      outputs,
      outputAmount: outputs[0].amount,
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: params.feeInfo,
      timestamp: tx.validFrom,
      expiration: tx.validTo,
    };
  }
}
