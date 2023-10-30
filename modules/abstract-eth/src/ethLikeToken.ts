/**
 * @prettier
 */
import { bip32 } from '@bitgo/utxo-lib';
import { coins, EthLikeTokenConfig, tokens, EthereumNetwork as EthLikeNetwork } from '@bitgo/statics';

import {
  BitGoBase,
  CoinConstructor,
  NamedCoinConstructor,
  Recipient,
  Util,
  Wallet,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  checkKrsProvider,
} from '@bitgo/sdk-core';
import {
  AbstractEthLikeNewCoins,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  TransactionPrebuild,
} from './abstractEthLikeNewCoins';
import { TransactionBuilder as EthTransactionBuilder } from '@bitgo/sdk-coin-eth';

export type CoinNames = {
  [network: string]: string;
};

interface RecoverTokenOptions {
  tokenContractAddress: string;
  wallet: Wallet;
  recipient: string;
  broadcast?: boolean;
  walletPassphrase?: string;
  prv?: string;
}

interface RecoverTokenTransaction {
  halfSigned: {
    recipient: Recipient;
    expireTime: number;
    contractSequenceId: number;
    operationHash: string;
    signature: string;
    gasLimit: number;
    gasPrice: number;
    tokenContractAddress: string;
    walletId: string;
  };
}

export class EthLikeToken extends AbstractEthLikeNewCoins {
  public readonly tokenConfig: EthLikeTokenConfig;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGoBase, tokenConfig: EthLikeTokenConfig, coinNames: CoinNames) {
    const staticsCoin = coins.get(coinNames[tokenConfig.network]);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
    this.sendMethodName = 'sendMultiSigToken';
  }

  static createTokenConstructor(config: EthLikeTokenConfig, coinNames: CoinNames): CoinConstructor {
    return (bitgo: BitGoBase) => new this(bitgo, config, coinNames);
  }

  static createTokenConstructors(coinNames: CoinNames): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    const chain = coinNames.Mainnet;
    for (const token of [...tokens.bitcoin[chain].tokens, ...tokens.testnet[chain].tokens]) {
      const tokenConstructor = this.createTokenConstructor(token, coinNames);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  protected getTransactionBuilder(): EthTransactionBuilder {
    return new EthTransactionBuilder(coins.get(this.getBaseChain()));
  }

  get type(): string {
    return this.tokenConfig.type;
  }

  get name(): string {
    return this.tokenConfig.name;
  }

  get coin(): string {
    return this.tokenConfig.coin;
  }

  get network(): string {
    return this.tokenConfig.network;
  }

  get tokenContractAddress(): string {
    return this.tokenConfig.tokenContractAddress;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getBaseChain(): string {
    return this.coin;
  }

  getFullName(): string {
    return 'Eth Like Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed(): boolean {
    return false;
  }

  isToken(): boolean {
    return true;
  }

  verifyCoin(txPrebuild: TransactionPrebuild): boolean {
    return txPrebuild.coin === this.tokenConfig.coin && txPrebuild.token === this.tokenConfig.type;
  }

  /**
   * Recover an unsupported token from a BitGo multisig wallet
   * This builds a half-signed transaction, for which there will be an admin route to co-sign and broadcast. Optionally
   * the user can set params.broadcast = true and the half-signed tx will be sent to BitGo for cosigning and broadcasting
   * @param params
   * @param params.wallet the wallet to recover the token from
   * @param params.tokenContractAddress the contract address of the unsupported token
   * @param params.recipient the destination address recovered tokens should be sent to
   * @param params.walletPassphrase the wallet passphrase
   * @param params.prv the xprv
   * @param params.broadcast if true, we will automatically submit the half-signed tx to BitGo for cosigning and broadcasting
   */
  async recoverToken(params: RecoverTokenOptions): Promise<RecoverTokenTransaction> {
    if (!Array.isArray(params) && params instanceof Object === false) {
      throw new Error(`recoverToken must be passed a params object. Got ${params} (type ${typeof params})`);
    }

    if (params.tokenContractAddress === undefined || typeof params.tokenContractAddress !== 'string') {
      throw new Error(
        `tokenContractAddress must be a string, got ${
          params.tokenContractAddress
        } (type ${typeof params.tokenContractAddress})`
      );
    }

    if (!this.isValidAddress(params.tokenContractAddress)) {
      throw new Error('tokenContractAddress not a valid address');
    }

    if (params.wallet === undefined || !(params.wallet instanceof Wallet)) {
      throw new Error(`wallet must be a wallet instance, got ${params.wallet} (type ${typeof params.wallet})`);
    }

    if (params.recipient === undefined || typeof params.recipient !== 'string') {
      throw new Error(`recipient must be a string, got ${params.recipient} (type ${typeof params.recipient})`);
    }

    if (!this.isValidAddress(params.recipient)) {
      throw new Error('recipient not a valid address');
    }

    if (!optionalDeps.ethUtil.bufferToHex || !optionalDeps.ethAbi.soliditySHA3) {
      throw new Error('ethereum not fully supported in this environment');
    }

    // Get token balance from external API
    const coinSpecific = params.wallet.coinSpecific();
    if (!coinSpecific || typeof coinSpecific.baseAddress !== 'string') {
      throw new Error('missing required coin specific property baseAddress');
    }
    const recoveryAmount = await this.queryAddressTokenBalance(params.tokenContractAddress, coinSpecific.baseAddress);

    if (params.broadcast) {
      // We're going to create a normal ETH transaction that sends an amount of 0 ETH to the
      // tokenContractAddress and encode the unsupported-token-send data in the data field
      // #tricksy
      const sendMethodArgs = [
        {
          name: '_to',
          type: 'address',
          value: params.recipient,
        },
        {
          name: '_value',
          type: 'uint256',
          value: recoveryAmount.toString(10),
        },
      ];
      const methodSignature = optionalDeps.ethAbi.methodID(
        'transfer',
        sendMethodArgs.map((arg) => arg.type)
      );
      const encodedArgs = optionalDeps.ethAbi.rawEncode(
        sendMethodArgs.map((arg) => arg.type),
        sendMethodArgs.map((arg) => arg.value)
      );
      const sendData = Buffer.concat([methodSignature, encodedArgs]);

      const broadcastParams: any = {
        address: params.tokenContractAddress,
        amount: '0',
        data: sendData.toString('hex'),
      };

      if (params.walletPassphrase) {
        broadcastParams.walletPassphrase = params.walletPassphrase;
      } else if (params.prv) {
        broadcastParams.prv = params.prv;
      }

      return await params.wallet.send(broadcastParams);
    }

    const recipient = {
      address: params.recipient,
      amount: recoveryAmount.toString(10),
    };

    // This signature will be valid for one week
    const expireTime = Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7;

    // Get sequence ID. We do this by building a 'fake' eth transaction, so the platform will increment and return us the new sequence id
    // This _does_ require the user to have a non-zero wallet balance
    const { nextContractSequenceId, gasPrice, gasLimit } = (await params.wallet.prebuildTransaction({
      recipients: [
        {
          address: params.recipient,
          amount: '1',
        },
      ],
    })) as any;

    // these recoveries need to be processed by support, but if the customer sends any transactions before recovery is
    // complete the sequence ID will be invalid. artificially inflate the sequence ID to allow more time for processing
    const safeSequenceId = nextContractSequenceId + 1000;

    // Build sendData for ethereum tx
    const operationTypes = ['string', 'address', 'uint256', 'bytes', 'uint256', 'uint256'];
    const operationArgs = [
      // "ERC20" has been added here so that ether operation hashes, signatures cannot be re-used for tokenSending
      'ERC20',
      new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
      recipient.amount,
      new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(params.tokenContractAddress), 16),
      expireTime,
      safeSequenceId,
    ];

    const operationHash = optionalDeps.ethUtil.bufferToHex(
      optionalDeps.ethAbi.soliditySHA3(operationTypes, operationArgs)
    );

    const userPrv = await params.wallet.getPrv({
      prv: params.prv,
      walletPassphrase: params.walletPassphrase,
    });

    const signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

    return {
      halfSigned: {
        recipient: recipient,
        expireTime: expireTime,
        contractSequenceId: safeSequenceId,
        operationHash: operationHash,
        signature: signature,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        tokenContractAddress: params.tokenContractAddress,
        walletId: params.wallet.id(),
      },
    };
  }

  /**
   * Builds a token recovery transaction without BitGo
   * @param params
   * @param params.userKey {String} [encrypted] xprv
   * @param params.backupKey {String} [encrypted] xprv or xpub if the xprv is held by a KRS providers
   * @param params.walletPassphrase {String} used to decrypt userKey and backupKey
   * @param params.walletContractAddress {String} the ETH address of the wallet contract
   * @param params.recoveryDestination {String} target address to send recovered funds to
   * @param params.krsProvider {String} necessary if backup key is held by KRS
   */
  async recover(params: RecoverOptions): Promise<RecoveryInfo> {
    if (params.userKey === undefined) {
      throw new Error('missing userKey');
    }

    if (params.backupKey === undefined) {
      throw new Error('missing backupKey');
    }

    if (params.walletPassphrase === undefined && !params.userKey.startsWith('xpub')) {
      throw new Error('missing wallet passphrase');
    }

    if (params.walletContractAddress === undefined || !this.isValidAddress(params.walletContractAddress)) {
      throw new Error('invalid walletContractAddress');
    }

    if (params.recoveryDestination === undefined || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider, { checkCoinFamilySupport: false });
    }

    // Clean up whitespace from entered values
    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    // Set new eth tx fees (using default config values from platform)
    const gasPrice = this.getRecoveryGasPrice();
    const gasLimit = this.getRecoveryGasLimit();

    // Decrypt private keys from KeyCard values
    let userPrv;
    if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
      try {
        userPrv = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }
    }

    let backupKeyAddress;
    let backupSigningKey;

    if (isKrsRecovery || isUnsignedSweep) {
      const backupHDNode = bip32.fromBase58(backupKey);
      backupSigningKey = backupHDNode.publicKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
    } else {
      let backupPrv;

      try {
        backupPrv = this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${e.message}`);
      }

      const backupHDNode = bip32.fromBase58(backupPrv);
      backupSigningKey = backupHDNode.privateKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.privateToAddress(backupSigningKey).toString('hex')}`;
    }

    // Get nonce for backup key (should be 0)
    let backupKeyNonce = 0;

    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'txlist',
      address: backupKeyAddress,
    });
    const backupKeyTxList = result.result;
    if (backupKeyTxList.length > 0) {
      // Calculate last nonce used
      const outgoingTxs = backupKeyTxList.filter((tx) => tx.from === backupKeyAddress);
      backupKeyNonce = outgoingTxs.length;
    }

    // get balance of backup key and make sure we can afford gas
    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress);

    if (backupKeyBalance.lt(gasPrice.mul(gasLimit))) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${backupKeyBalance.toString(
          10
        )}. This address must have a balance of at least 0.01 ETH to perform recoveries`
      );
    }

    // get token balance of wallet
    const txAmount = await this.queryAddressTokenBalance(this.tokenContractAddress, params.walletContractAddress);

    // build recipients object
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    // Get sequence ID using contract call
    const sequenceId = await this.querySequenceId(params.walletContractAddress);

    let operationHash, signature;
    if (!isUnsignedSweep) {
      // Get operation hash and sign it
      operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
      signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

      try {
        Util.ecRecoverEthAddress(operationHash, signature);
      } catch (e) {
        throw new Error('Invalid signature');
      }
    }

    const txInfo = {
      recipient: recipients[0],
      expireTime: this.getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      signature: signature,
      gasLimit: gasLimit.toString(10),
      tokenContractAddress: this.tokenContractAddress,
    };

    // calculate send data
    const sendMethodArgs = this.getSendMethodArgs(txInfo);
    const methodSignature = optionalDeps.ethAbi.methodID(
      this.sendMethodName,
      sendMethodArgs.map((arg) => arg.type)
    );
    const encodedArgs = optionalDeps.ethAbi.rawEncode(
      sendMethodArgs.map((arg) => arg.type),
      sendMethodArgs.map((arg) => arg.value)
    );
    const sendData = Buffer.concat([methodSignature, encodedArgs]);

    let tx = AbstractEthLikeNewCoins.buildTransaction({
      to: params.walletContractAddress,
      nonce: backupKeyNonce,
      value: 0,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      data: sendData,
      eip1559: params.eip1559,
      replayProtectionOptions: params.replayProtectionOptions,
    });

    if (isUnsignedSweep) {
      return this.formatForOfflineVault(txInfo, tx, userKey, backupKey, gasPrice, gasLimit) as any;
    }

    if (!isKrsRecovery) {
      tx = tx.sign(backupSigningKey);
    }

    const signedTx: RecoveryInfo = {
      id: optionalDeps.ethUtil.bufferToHex(tx.hash()),
      tx: tx.serialize().toString('hex'),
    };

    if (isKrsRecovery) {
      signedTx.backupKey = backupKey;
      signedTx.coin = 'erc20';
    }

    return signedTx;
  }

  getOperation(recipient, expireTime, contractSequenceId) {
    const network = this.getNetwork() as EthLikeNetwork;
    return [
      ['string', 'address', 'uint256', 'bytes', 'uint256', 'uint256'],
      [
        network.networkIdForTokenTransfer,
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(this.tokenContractAddress), 16),
        expireTime,
        contractSequenceId,
      ],
    ];
  }
}
