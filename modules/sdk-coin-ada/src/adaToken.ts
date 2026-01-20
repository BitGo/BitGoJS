import { Ada } from './ada';
import {
  BitGoBase,
  CoinConstructor,
  NamedCoinConstructor,
  VerifyTransactionOptions,
  NodeEnvironmentError,
} from '@bitgo/sdk-core';
import { coins, tokens, AdaTokenConfig } from '@bitgo/statics';
import { Transaction } from './lib';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import assert from 'assert';

export class AdaToken extends Ada {
  public readonly tokenConfig: AdaTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: AdaTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('ada') : coins.get('tada');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: AdaTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new AdaToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: AdaTokenConfig[] = [...tokens.bitcoin.ada.tokens, ...tokens.testnet.ada.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = AdaToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get name() {
    return this.tokenConfig.name;
  }

  get coin() {
    return this.tokenConfig.coin;
  }

  get network() {
    return this.tokenConfig.network;
  }

  get policyId() {
    return this.tokenConfig.policyId;
  }

  get assetName() {
    return this.tokenConfig.assetName;
  }

  get decimalPlaces() {
    return this.tokenConfig.decimalPlaces;
  }

  getChain() {
    return this.tokenConfig.type;
  }

  getBaseChain() {
    return this.coin;
  }

  getFullName() {
    return 'Cardano Token';
  }

  getBaseFactor() {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (CELO), false otherwise
   */
  transactionDataAllowed() {
    return false;
  }

  get contractAddress() {
    return this.tokenConfig.contractAddress;
  }

  /**
   * Verify that a token transaction prebuild complies with the original intention.
   * For token transfers, we need to verify the token amount in multiAssets, not the ADA amount.
   * For token consolidation, we verify all outputs go to the base address.
   *
   * @param params.txPrebuild prebuild transaction
   * @param params.txParams transaction parameters
   * @param params.verification verification options (includes consolidationToBaseAddress flag)
   * @param params.wallet wallet object for getting base address
   * @return true if verification success
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    try {
      const coinConfig = coins.get(this.getBaseChain());
      const { txPrebuild, txParams, verification, wallet } = params;
      const transaction = new Transaction(coinConfig);
      assert(txPrebuild.txHex, new Error('missing required tx prebuild property txHex'));

      transaction.fromRawTransaction(txPrebuild.txHex);
      const txJson = transaction.toJson();

      if (txParams.recipients !== undefined) {
        // assetName in tokenConfig is ASCII (e.g. 'WATER'), convert to hex for comparison
        const asciiEncodedAssetName = Buffer.from(this.tokenConfig.assetName).toString('hex');

        // ASCII encoded asset name may be appended to the policy ID (consistent with crypto compare)
        // But cardano sdk requires only the policy ID (28 bytes = 56 hex chars) for ScriptHash
        let policyId = this.tokenConfig.policyId;
        if (policyId.endsWith(asciiEncodedAssetName)) {
          policyId = policyId.substring(0, policyId.length - asciiEncodedAssetName.length);
        }

        const policyScriptHash = CardanoWasm.ScriptHash.from_hex(policyId);
        const assetName = CardanoWasm.AssetName.new(Buffer.from(asciiEncodedAssetName, 'hex'));

        for (const recipient of txParams.recipients) {
          const found = txJson.outputs.some((output) => {
            if (recipient.address !== output.address || !output.multiAssets) {
              return false;
            }
            const multiAssets = output.multiAssets as CardanoWasm.MultiAsset;
            const tokenQty = multiAssets.get_asset(policyScriptHash, assetName);
            return tokenQty && tokenQty.to_str() === recipient.amount;
          });

          if (!found) {
            throw new Error('cannot find recipient in expected output');
          }
        }
      } else if (verification?.consolidationToBaseAddress) {
        // For token consolidation, verify all outputs go to the base address
        const baseAddress = wallet?.coinSpecific()?.baseAddress || wallet?.coinSpecific()?.rootAddress;

        for (const output of txJson.outputs) {
          if (output.address !== baseAddress) {
            throw new Error('tx outputs does not match with expected address');
          }
        }
      }
    } catch (e) {
      if (e instanceof NodeEnvironmentError) {
        return true;
      }
      throw e;
    }
    return true;
  }
}
