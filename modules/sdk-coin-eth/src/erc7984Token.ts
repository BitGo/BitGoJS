/**
 * @prettier
 */
import { BitGoBase, CoinConstructor, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';

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
  VerifyEthTransactionOptions,
  aclMulticallMethodId,
  callFromParentMethodId,
} from '@bitgo/abstract-eth';

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
    const staticsCoin = coins.get(Erc7984Token.coinNames[tokenConfig.network]);
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
