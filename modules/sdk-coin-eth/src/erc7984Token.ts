/**
 * @prettier
 */
import {
  BitGoBase,
  CoinConstructor,
  checkKrsProvider,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  MPCAlgorithm,
  NamedCoinConstructor,
  Util,
} from '@bitgo/sdk-core';
import { coins, Erc7984TokenConfig, EthereumNetwork, tokens } from '@bitgo/statics';
import {
  CoinNames,
  DecryptionDelegationBuilder,
  decodeTokenAddressesFromDelegationCalldata,
  decodeConfidentialTransferData,
  decodeDirectConfidentialTransferCalldata,
  decodeFlushERC7984ForwarderTokenCalldata,
  decodeSendMultiSigFlushERC7984Data,
  sendMultisigMethodId,
  confidentialTransferWithProofMethodId,
  buildConfidentialTransferByHandleCalldata,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  OfflineVaultTxInfo,
  VerifyEthTransactionOptions,
  aclMulticallMethodId,
  callFromParentMethodId,
} from '@bitgo/abstract-eth';
import { bip32 } from '@bitgo/secp256k1';
import * as _ from 'lodash';

import { Eth } from './eth';
import { TransactionBuilder } from './lib';

export { Erc7984TokenConfig };

export class Erc7984Token extends Eth {
  public readonly tokenConfig: Erc7984TokenConfig;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';
  static coinNames: CoinNames = {
    Mainnet: 'eth',
    Testnet: 'hteth',
  };

  constructor(bitgo: BitGoBase, tokenConfig: Erc7984TokenConfig) {
    const staticsCoin = coins.get(tokenConfig.coin);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
    // ERC7984 confidential transfers use sendMultiSig (not sendMultiSigToken) because
    // the calldata parameter is required to carry confidentialTransfer(recipient, encryptedHandle, inputProof).
    // sendMultiSigToken has no data parameter and cannot carry inner calldata.
    this.sendMethodName = 'sendMultiSig';
  }

  static createTokenConstructor(config: Erc7984TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Erc7984Token(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: Erc7984TokenConfig[] = [
      ...tokens.bitcoin.eth.confidentialTokens,
      ...tokens.testnet.eth.confidentialTokens,
    ]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = Erc7984Token.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
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

  getFullName(): string {
    return 'ERC7984 Confidential Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0.
   * ERC-7984 confidential transfers always carry an encrypted amount; zero-value sends are not meaningful.
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Flag for sending data along with transactions via the standard token-send API.
   * Returns false because ERC-7984 sends use confidentialTransfer() calldata built
   * by WP, not an arbitrary data field on the send params.
   * Note: this does not prevent calldata-based flows like getDelegationBuilder(),
   * which bypass the token-send path entirely.
   */
  transactionDataAllowed(): boolean {
    return false;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  async verifyTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    if (params.txParams?.type === 'enabletoken') {
      return this.verifyEnableTokenTransaction(params);
    }
    if (this.isConsolidationTransaction(params)) {
      return this.verifyConfidentialConsolidation(params);
    }
    return this.verifyConfidentialTransfer(params);
  }

  private isConsolidationTransaction(params: VerifyEthTransactionOptions): boolean {
    const { txParams, txPrebuild, verification } = params;
    return !!(
      verification?.consolidationToBaseAddress ||
      txPrebuild?.consolidateId ||
      txParams?.type === 'consolidate' ||
      // TSS signing path: resolveEffectiveTxParams sets type from intent.intentType which is
      // 'consolidateToken' for ERC-7984 token consolidations. txPrebuild has only txHex
      // (no consolidateId) in this path.
      txParams?.type === 'consolidateToken' ||
      txParams?.prebuildTx?.consolidateId
    );
  }

  private getWalletBaseAddress(wallet: VerifyEthTransactionOptions['wallet']): string | undefined {
    if (!wallet) {
      return undefined;
    }
    const coinSpecific = typeof wallet.coinSpecific === 'function' ? wallet.coinSpecific() : wallet.coinSpecific;
    const ethCoinSpecific = coinSpecific as { baseAddress?: string; rootAddress?: string } | undefined;
    return ethCoinSpecific?.baseAddress ?? ethCoinSpecific?.rootAddress;
  }

  /**
   * Verifies ERC-7984 forwarder consolidation (flush) transactions.
   *
   * Multisig shape:
   *   tx.to   = wallet contract
   *   tx.data = sendMultiSig(forwarder, 0, callFromParent(token, 0, confidentialTransferNoProof(base, handle)), ...)
   *
   * TSS / direct shape:
   *   tx.to   = forwarder contract
   *   tx.data = callFromParent(token, 0, confidentialTransferNoProof(base, handle))
   */
  private async verifyConfidentialConsolidation(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;

    if (!txPrebuild?.txHex) {
      if (!txPrebuild?.consolidateId && !txParams?.prebuildTx?.consolidateId) {
        throw new Error('verifyConfidentialConsolidation: missing consolidateId');
      }
      return true;
    }

    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txPrebuild.txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    let tokenContractAddress: string;
    let parentAddress: string;
    let encryptedHandle: string;
    let forwarderAddress: string | undefined;

    try {
      if (txJson.data.startsWith(sendMultisigMethodId)) {
        const decoded = decodeSendMultiSigFlushERC7984Data(txJson.data);
        forwarderAddress = decoded.forwarderAddress;
        tokenContractAddress = decoded.tokenContractAddress;
        parentAddress = decoded.parentAddress;
        encryptedHandle = decoded.encryptedHandle;
      } else if (txJson.data.startsWith(callFromParentMethodId)) {
        const decoded = decodeFlushERC7984ForwarderTokenCalldata(txJson.data);
        tokenContractAddress = decoded.tokenContractAddress;
        parentAddress = decoded.parentAddress;
        encryptedHandle = decoded.encryptedHandle;
        forwarderAddress = txJson.to;
      } else {
        throw new Error(`unexpected method ID ${txJson.data.slice(0, 10)}`);
      }
    } catch (e) {
      throw new Error(
        `verifyConfidentialConsolidation: failed to decode consolidation calldata — ${(e as Error).message}`
      );
    }

    if (tokenContractAddress.toLowerCase() !== this.tokenContractAddress.toLowerCase()) {
      throw new Error(
        `verifyConfidentialConsolidation: token contract address mismatch — ` +
          `expected ${this.tokenContractAddress}, got ${tokenContractAddress}`
      );
    }

    const baseAddress = this.getWalletBaseAddress(wallet);
    if (!baseAddress) {
      throw new Error('verifyConfidentialConsolidation: unable to determine wallet base address');
    }
    if (parentAddress.toLowerCase() !== baseAddress.toLowerCase()) {
      throw new Error(
        `verifyConfidentialConsolidation: parent address mismatch — expected ${baseAddress}, got ${parentAddress}`
      );
    }

    if (!encryptedHandle || encryptedHandle === '0x') {
      throw new Error('verifyConfidentialConsolidation: encryptedHandle is missing or empty in transaction calldata');
    }

    const expectedForwarder =
      txPrebuild.recipients?.[0]?.address ??
      txPrebuild.txInfo?.recipients?.[0]?.address ??
      txParams?.recipients?.[0]?.address;
    if (forwarderAddress && expectedForwarder) {
      if (forwarderAddress.toLowerCase() !== expectedForwarder.toLowerCase()) {
        throw new Error(
          `verifyConfidentialConsolidation: forwarder address mismatch — ` +
            `expected ${expectedForwarder}, got ${forwarderAddress}`
        );
      }
    }

    return true;
  }

  /**
   * Verifies a confidential token transfer (SendERC7984) transaction.
   *
   * With txHex — two on-chain shapes are supported:
   *
   *   sendMultiSig-wrapped (multisig / smart-contract wallet):
   *     tx.to   = wallet contract
   *     tx.data = sendMultiSig(tokenAddr, 0, confidentialTransfer(recipient, handle, proof), ...)
   *     Token contract address is decoded from the sendMultiSig inner calldata.
   *
   *   Direct call (hot / TSS EOA wallet):
   *     tx.to   = token contract
   *     tx.data = confidentialTransfer(recipient, handle, proof)
   *     Token contract address is taken from tx.to.
   *
   *   For both shapes the verifier checks:
   *     1. Token contract address matches this coin's tokenContractAddress.
   *     2. Decoded recipient matches txParams.recipients[0].address or buildParams.recipients[0].address.
   *     3. encryptedHandle and inputProof are structurally present (non-empty).
   *     4. txParams.recipients[0].amount is a positive integer and matches buildParams when both present.
   *
   * Without txHex (first-signer / pre-signing path):
   *  1. Requires exactly one recipient in txParams.
   *  2. Validates txParams.recipients[0].address is a valid Ethereum address.
   *  3. Validates txParams.recipients[0].amount is a positive integer.
   *  4. Cross-checks address and amount against buildParams when the server has stored the intent.
   */
  private async verifyConfidentialTransfer(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild } = params;

    if (!txPrebuild?.txHex) {
      // No raw tx available (multisig first-signer path).
      // Validate ERC7984-specific invariants from txParams and buildParams.
      const recipients = txParams?.recipients;
      if (!recipients || recipients.length === 0) {
        throw new Error('verifyConfidentialTransfer: recipients must contain at least one entry');
      }
      if (recipients.length !== 1) {
        throw new Error(
          `verifyConfidentialTransfer: confidential transfers support exactly 1 recipient, got ${recipients.length}`
        );
      }
      const recipient = recipients[0];
      if (!recipient.address || !this.isValidAddress(recipient.address)) {
        throw new Error(`verifyConfidentialTransfer: recipient address is missing or invalid: ${recipient.address}`);
      }
      const amountStr = String(recipient.amount);
      if (!Erc7984Token.isPositiveIntegerString(amountStr)) {
        throw new Error(
          `verifyConfidentialTransfer: amount must be a positive integer string in base units, got '${amountStr}'`
        );
      }
      // Cross-check against buildParams when the server has already stored the intent
      const buildParamsRecipient = txPrebuild?.buildParams?.recipients?.[0];
      if (buildParamsRecipient?.address !== undefined) {
        if (recipient.address.toLowerCase() !== buildParamsRecipient.address.toLowerCase()) {
          throw new Error(
            `verifyConfidentialTransfer: recipient address mismatch — ` +
              `txParams has '${recipient.address}' but buildParams has '${buildParamsRecipient.address}'`
          );
        }
      }
      const buildParamsAmount = buildParamsRecipient?.amount;
      if (buildParamsAmount !== undefined && buildParamsAmount !== amountStr) {
        throw new Error(
          `verifyConfidentialTransfer: amount mismatch — txParams has '${amountStr}' but buildParams has '${buildParamsAmount}'`
        );
      }
      return true;
    }

    // Parse and decode the raw transaction
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txPrebuild.txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    let toAddress: string;
    let tokenContractAddress: string;
    let encryptedHandle: string;
    let inputProof: string;

    try {
      if (txJson.data.startsWith(sendMultisigMethodId)) {
        // sendMultiSig-wrapped path: smart-contract wallet relays the confidentialTransfer call.
        // Token contract address is encoded inside the sendMultiSig calldata.
        const decoded = decodeConfidentialTransferData(txJson.data);
        toAddress = decoded.toAddress;
        tokenContractAddress = decoded.tokenContractAddress;
        encryptedHandle = decoded.encryptedHandle;
        inputProof = decoded.inputProof;
      } else if (txJson.data.startsWith(confidentialTransferWithProofMethodId)) {
        // Direct call path: hot/TSS EOA wallet calls the token contract directly.
        // The transaction's `to` field is the token contract address.
        if (!txJson.to) {
          throw new Error('direct confidentialTransfer call is missing transaction to address');
        }
        const decoded = decodeDirectConfidentialTransferCalldata(txJson.data);
        toAddress = decoded.toAddress;
        tokenContractAddress = txJson.to;
        encryptedHandle = decoded.encryptedHandle;
        inputProof = decoded.inputProof;
      } else {
        throw new Error(`unexpected method ID ${txJson.data.slice(0, 10)}`);
      }
    } catch (e) {
      throw new Error(
        `verifyConfidentialTransfer: failed to decode confidential transfer calldata — ${(e as Error).message}`
      );
    }

    // 1. Token contract address must match this coin
    if (tokenContractAddress.toLowerCase() !== this.tokenContractAddress.toLowerCase()) {
      throw new Error(
        `verifyConfidentialTransfer: token contract address mismatch — ` +
          `expected ${this.tokenContractAddress}, got ${tokenContractAddress}`
      );
    }

    // 2. Recipient address must match txParams.recipients[0] or buildParams.recipients[0]
    const expectedRecipient = txParams?.recipients?.[0]?.address ?? txPrebuild.buildParams?.recipients?.[0]?.address;
    if (!expectedRecipient) {
      throw new Error(
        'verifyConfidentialTransfer: missing expected recipient (provide txParams.recipients or txPrebuild.buildParams.recipients)'
      );
    }
    if (toAddress.toLowerCase() !== expectedRecipient.toLowerCase()) {
      throw new Error(
        `verifyConfidentialTransfer: recipient address mismatch — ` + `expected ${expectedRecipient}, got ${toAddress}`
      );
    }

    // 3. encryptedHandle must be a non-trivial hex value (not bare '0x')
    if (!encryptedHandle || encryptedHandle === '0x') {
      throw new Error('verifyConfidentialTransfer: encryptedHandle is missing or empty in transaction calldata');
    }

    // 4. inputProof must be a non-trivial hex value
    if (!inputProof || inputProof === '0x') {
      throw new Error('verifyConfidentialTransfer: inputProof is missing or empty in transaction calldata');
    }

    // 5. Verify plaintext intent: txParams amount must be valid and consistent with buildParams
    const rawTxParamsAmount = txParams?.recipients?.[0]?.amount;
    if (rawTxParamsAmount !== undefined) {
      const txParamsAmount = String(rawTxParamsAmount);
      if (!Erc7984Token.isPositiveIntegerString(txParamsAmount)) {
        throw new Error(
          `verifyConfidentialTransfer: amount must be a positive integer string in base units, got '${txParamsAmount}'`
        );
      }
      const buildParamsAmount = txPrebuild.buildParams?.recipients?.[0]?.amount;
      if (buildParamsAmount !== undefined && txParamsAmount !== buildParamsAmount) {
        throw new Error(
          `verifyConfidentialTransfer: amount mismatch — txParams has '${txParamsAmount}' but buildParams has '${buildParamsAmount}'`
        );
      }
    }

    return true;
  }

  private static isPositiveIntegerString(value: string): boolean {
    return /^\d+$/.test(value) && BigInt(value) > 0n;
  }

  /**
   * Verifies a token enablement transaction for ERC-7984 decryption delegation.
   *
   * TSS path: decodes the raw tx and verifies it calls the ACL contract with
   * calldata that covers all requested token contract addresses.
   *
   * Multisig path: verifies the buildParams recipients carry the correct tokenNames
   * and zero amounts.
   */
  private async verifyEnableTokenTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, walletType } = params;

    if (walletType === 'tss') {
      // TSS path: full raw-tx decode
      const enableTokens = txParams.enableTokens;
      if (!enableTokens || enableTokens.length === 0) {
        throw new Error('verifyEnableTokenTransaction: enableTokens must be non-empty for TSS path');
      }
      if (!txPrebuild.txHex) {
        throw new Error('verifyEnableTokenTransaction: missing txHex in txPrebuild');
      }

      // Resolve requested token names → contract addresses
      const requestedAddresses = enableTokens.map((t) => {
        const tokenCoin = this.bitgo.coin(t.name) as Erc7984Token;
        return tokenCoin.tokenContractAddress.toLowerCase();
      });

      // Parse the raw transaction
      const txBuilder = this.getTransactionBuilder();
      txBuilder.from(txPrebuild.txHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Verify transaction targets the correct contract based on calldata shape
      const network = this.getNetwork() as EthereumNetwork;
      const aclContractAddress = network?.zamaAclContractAddress;
      if (!aclContractAddress) {
        throw new Error('verifyEnableTokenTransaction: zamaAclContractAddress not configured for this network');
      }
      if (!txJson.to) {
        throw new Error('verifyEnableTokenTransaction: transaction is missing recipient address');
      }

      // Inspect calldata method ID to distinguish root wallet from forwarder wallet:
      //   aclMulticallMethodId   → root wallet: to = ACL contract directly
      //   callFromParentMethodId → forwarder wallet: to = forwarder, ACL address is inside calldata
      const calldataMethodId = txJson.data.slice(0, 10);
      if (calldataMethodId === aclMulticallMethodId) {
        // Root wallet (base address): tx calls the ACL contract directly
        if (txJson.to.toLowerCase() !== aclContractAddress.toLowerCase()) {
          throw new Error(
            `verifyEnableTokenTransaction: transaction target ${txJson.to} does not match ACL contract ${aclContractAddress}`
          );
        }
      } else if (calldataMethodId === callFromParentMethodId) {
        // Forwarder wallet: tx calls the forwarder, which calls the ACL via callFromParent.
        // The forwarder address is wallet-specific and cannot be statically verified here;
        // token address correctness is still verified below via calldata decoding.
      } else {
        throw new Error(
          `verifyEnableTokenTransaction: unrecognised calldata method ID ${calldataMethodId}; expected multicall or callFromParent`
        );
      }

      // Verify value is 0
      if (txJson.value !== '0') {
        throw new Error(`verifyEnableTokenTransaction: expected transaction value 0 but got ${txJson.value}`);
      }

      // Decode token addresses from calldata and verify all requested tokens are present
      const decodedAddresses = decodeTokenAddressesFromDelegationCalldata(txJson.data);
      for (const requested of requestedAddresses) {
        if (!decodedAddresses.includes(requested)) {
          throw new Error(
            `verifyEnableTokenTransaction: requested token ${requested} not found in delegation calldata`
          );
        }
      }

      return true;
    } else {
      // Multisig path: buildParams-level check
      const recipients = txPrebuild.buildParams?.recipients as
        | Array<{ tokenName?: string; amount?: string }>
        | undefined;
      if (!recipients || recipients.length === 0) {
        throw new Error('verifyEnableTokenTransaction: missing buildParams.recipients for multisig path');
      }

      // Determine requested token names from txParams
      const requestedTokenNames: string[] = [];
      if (txParams.enableTokens && txParams.enableTokens.length > 0) {
        requestedTokenNames.push(...txParams.enableTokens.map((t) => t.name));
      } else if (txParams.recipients && txParams.recipients.length > 0) {
        requestedTokenNames.push(...txParams.recipients.map((r: any) => r.tokenName).filter(Boolean));
      }

      // Verify all recipients have tokenName and amount = '0'
      for (const recipient of recipients) {
        if (!recipient.tokenName) {
          throw new Error('verifyEnableTokenTransaction: recipient is missing tokenName in buildParams');
        }
        if (recipient.amount !== '0') {
          throw new Error(
            `verifyEnableTokenTransaction: expected amount 0 for token enablement but got ${recipient.amount}`
          );
        }
      }

      // Verify requested token names are present in recipients
      if (requestedTokenNames.length > 0) {
        const recipientTokenNames = recipients.map((r) => r.tokenName);
        for (const requested of requestedTokenNames) {
          if (!recipientTokenNames.includes(requested)) {
            throw new Error(
              `verifyEnableTokenTransaction: requested token ${requested} not found in buildParams recipients`
            );
          }
        }
      }

      return true;
    }
  }

  /**
   * Override gas limit for ERC-7984 confidential token recovery.
   * Actual on-chain usage is ~506-530k gas based on testnet results.
   * Default: 800,000 (comfortable buffer over observed usage).
   */
  setGasLimit(userGasLimit?: number): number {
    if (!userGasLimit) {
      return 800000;
    }
    return super.setGasLimit(userGasLimit);
  }

  /**
   * Queries the encrypted balance handle for a wallet address via eth_call to the
   * token contract's confidentialBalanceOf(address) function.
   *
   * @param walletAddress - the wallet contract address to query balance for
   * @param apiKey - optional Etherscan API key
   * @returns bytes32 encrypted handle (0x-prefixed, 66 chars).
   *   Note: handles are always non-zero even for zero balances (encrypted domain).
   */
  async queryConfidentialBalance(walletAddress: string, apiKey?: string): Promise<string> {
    const methodSignature = optionalDeps.ethAbi.methodID('confidentialBalanceOf', ['address']);
    const encodedArgs = optionalDeps.ethAbi.rawEncode(['address'], [walletAddress]);
    const calldata = Buffer.concat([methodSignature, encodedArgs]).toString('hex');

    const result = await this.recoveryBlockchainExplorerQuery(
      {
        chainid: this.getChainId().toString(),
        module: 'proxy',
        action: 'eth_call',
        to: this.tokenContractAddress,
        data: calldata,
        tag: 'latest',
      },
      apiKey
    );

    if (!result || !result.result) {
      throw new Error(
        `Could not obtain confidential balance for ${walletAddress} from token ${this.tokenContractAddress}`
      );
    }

    const handle = result.result as string;
    if (!handle.startsWith('0x') || handle.length !== 66) {
      throw new Error(`Unexpected confidentialBalanceOf response format: ${handle}`);
    }

    return handle;
  }

  /**
   * Builds a non-BitGo recovery transaction for ERC-7984 confidential tokens.
   *
   * Uses the no-proof handle sweep: confidentialTransfer(recipient, handle) with 2 args.
   * No FHE decryption or proof generation is needed — the wallet transfers its entire
   * encrypted balance handle without knowing the plaintext amount.
   *
   * The outer transaction shape is:
   *   tx.to   = walletContractAddress
   *   tx.data = sendMultiSig(tokenContractAddr, 0, confidentialTransfer(recoveryDest, handle), ...)
   */
  async recover(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    if (params.isTss === true) {
      throw new Error('ERC-7984 TSS recovery is not yet supported');
    }

    if (_.isUndefined(params.userKey)) {
      throw new Error('missing userKey');
    }

    if (_.isUndefined(params.backupKey)) {
      throw new Error('missing backupKey');
    }

    if (_.isUndefined(params.walletPassphrase) && !params.userKey.startsWith('xpub')) {
      throw new Error('missing wallet passphrase');
    }

    if (_.isUndefined(params.walletContractAddress) || !this.isValidAddress(params.walletContractAddress)) {
      throw new Error('invalid walletContractAddress');
    }

    if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider, { checkCoinFamilySupport: false });
    }

    let userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    const gasPrice = params.eip1559
      ? new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas)
      : new optionalDeps.ethUtil.BN(this.setGasPrice(params.gasPrice));
    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit));

    let userPrv: string | undefined;
    if (!isUnsignedSweep) {
      if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
        try {
          userKey = await this.bitgo.decrypt({
            input: userKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting user keychain: ${(e as Error).message}`);
        }
      }
      userPrv = userKey;
    }

    let backupKeyAddress: string;
    let backupSigningKey: Buffer;

    if (isKrsRecovery || isUnsignedSweep) {
      const backupHDNode = bip32.fromBase58(backupKey);
      backupSigningKey = backupHDNode.publicKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
    } else {
      let backupPrv: string;
      try {
        backupPrv = await this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${(e as Error).message}`);
      }

      const backupHDNode = bip32.fromBase58(backupPrv);
      backupSigningKey = backupHDNode.privateKey as Buffer;
      backupKeyAddress = `0x${optionalDeps.ethUtil.privateToAddress(backupSigningKey).toString('hex')}`;
    }

    const backupKeyNonce = await this.getAddressNonce(backupKeyAddress, params.apiKey);

    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress, params.apiKey);
    const totalGasNeeded = gasPrice.mul(gasLimit);
    const weiToGwei = 10 ** 9;
    if (backupKeyBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${(backupKeyBalance / weiToGwei).toString()} Gwei.` +
          `This address must have a balance of at least ${(totalGasNeeded / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some ETH to this address then retry.`
      );
    }

    // Get the encrypted balance handle (auto-query or user-provided)
    let encryptedHandle: string;
    if (params.encryptedHandle) {
      encryptedHandle = params.encryptedHandle;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      encryptedHandle = await this.queryConfidentialBalance(params.walletContractAddress, params.apiKey);
    }

    // Note: encrypted handles are always non-zero even for zero balances (encrypted domain).
    // The transfer will execute but move 0 tokens if the wallet is empty.

    // Build the inner calldata: confidentialTransfer(recoveryDestination, handle)
    const innerCalldata = buildConfidentialTransferByHandleCalldata(params.recoveryDestination, encryptedHandle);

    // For sendMultiSig: recipient is the token contract, amount is 0, data carries the confidentialTransfer calldata
    const recipients = [
      {
        address: this.tokenContractAddress,
        amount: '0',
        data: optionalDeps.ethUtil.stripHexPrefix(innerCalldata),
      },
    ];

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(params.walletContractAddress, params.apiKey);

    let operationHash: string | undefined;
    let signature: string | undefined;
    if (!isUnsignedSweep) {
      operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
      signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv!));

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
      operationHash: operationHash,
      signature: signature ?? '',
      gasLimit: gasLimit.toString(10),
    };

    const sendMethodArgs = this.getSendMethodArgs(txInfo);
    const methodSignature = optionalDeps.ethAbi.methodID(this.sendMethodName, _.map(sendMethodArgs, 'type'));
    const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
    const sendData = Buffer.concat([methodSignature, encodedArgs]);

    let tx = Eth.buildTransaction({
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
      return this.formatForOfflineVault(
        txInfo,
        tx,
        userKey,
        backupKey,
        gasPrice,
        gasLimit,
        params.eip1559,
        params.replayProtectionOptions,
        params.apiKey
      ) as any;
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
      signedTx.coin = this.getChain();
    }

    return signedTx;
  }

  /**
   * Returns a DecryptionDelegationBuilder for constructing Zama ACL decryption
   * delegation transactions.
   *
   * The builder produces a DecryptionDelegationTxRequest {to, data, value} that is
   * wallet-type-agnostic — WP routes it to the correct signing path:
   * - MPC: submit as a raw TSS transaction
   * - Multisig: wrap in sendMultiSig(walletContract, to, 0, data, ...)
   *
   * Example:
   *   const req = coin.getDecryptionDelegationBuilder().build({
   *     aclContractAddress: '0xf0Ff...',
   *     delegateAddress:    enterpriseViewingKey,
   *     tokenContractAddresses: [tokenAddress],
   *     expiryTimestamp:    Math.floor(Date.now() / 1000) + 365 * 86400,
   *   });
   */
  getDecryptionDelegationBuilder(): DecryptionDelegationBuilder {
    return new DecryptionDelegationBuilder();
  }
}
