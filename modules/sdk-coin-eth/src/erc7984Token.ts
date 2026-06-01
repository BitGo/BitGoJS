/**
 * @prettier
 */
import { BitGoBase, CoinConstructor, MPCAlgorithm, NamedCoinConstructor } from '@bitgo/sdk-core';

import { coins, Erc7984TokenConfig, EthereumNetwork, tokens } from '@bitgo/statics';
import {
  CoinNames,
  DecryptionDelegationBuilder,
  decodeTokenAddressesFromDelegationCalldata,
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
    this.sendMethodName = 'sendMultiSigToken';
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
    return super.verifyTransaction(params);
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
