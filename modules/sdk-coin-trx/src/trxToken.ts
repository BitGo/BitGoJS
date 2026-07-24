import { Trx } from './trx';
import { BitGoBase, CoinConstructor, NamedCoinConstructor, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { TrxTokenConfig, coins, tokens } from '@bitgo/statics';
import { getBuilder } from './lib/builder';
import { Recipient } from '../../sdk-core/src/bitgo/baseCoin/iBaseCoin';
import assert from 'assert';
import { Enum, Utils, Interface } from './lib';

export { TrxTokenConfig };

export type TronTxInfo = {
  recipients?: Recipient[];
  from?: string;
  txid?: string;
};

export class TrxToken extends Trx {
  public readonly tokenConfig: TrxTokenConfig;

  constructor(bitgo: BitGoBase, tokenConfig: TrxTokenConfig) {
    const staticsCoin = tokenConfig.network === 'Mainnet' ? coins.get('trx') : coins.get('ttrx');
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: TrxTokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new TrxToken(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: TrxTokenConfig[] = [...tokens.bitcoin.trx.tokens, ...tokens.testnet.trx.tokens]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = TrxToken.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get type() {
    return this.tokenConfig.type;
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

  get tokenContractAddress() {
    return this.tokenConfig.tokenContractAddress;
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
    return 'Tron Token';
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
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed() {
    return false;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txPrebuild, txParams, walletType } = params;
    assert(txPrebuild.txHex, new Error('missing required tx prebuild property txHex'));

    if (walletType === 'tss') {
      // For TSS wallets, TRC20 token transfers are TriggerSmartContract transactions.
      // Always verify structure and ABI decodability. Intent validation (address + amount
      // comparison) is performed only when recipients are present — absent recipients
      // indicates a server-determined transfer (e.g. consolidation) where the server
      // owns the intent.
      const rawDataHex = this.extractRawDataHex(txPrebuild.txHex);
      const decodedTx = Utils.decodeTransaction(rawDataHex);

      if (decodedTx.contractType !== Enum.ContractType.TriggerSmartContract) {
        throw new Error(
          `Expected TriggerSmartContract for TRC20 token transfer, got contract type: ${decodedTx.contractType}`
        );
      }
      if (!Array.isArray(decodedTx.contract) || decodedTx.contract.length !== 1) {
        throw new Error('Invalid TriggerSmartContract structure');
      }

      const triggerContract = decodedTx.contract[0] as Interface.TriggerSmartContract;
      // data is base64-encoded from protobuf decoding; convert to hex for decodeDataParams
      const contractData = Buffer.from(triggerContract.parameter.value.data, 'base64').toString('hex');

      let recipientHex: string;
      let transferAmount: { toString(): string };
      try {
        [recipientHex, transferAmount] = Utils.decodeDataParams(['address', 'uint256'], contractData) as [
          string,
          { toString(): string }
        ];
      } catch (e) {
        throw new Error(`Failed to decode TRC20 transfer ABI data: ${e instanceof Error ? e.message : String(e)}`);
      }

      const recipients = txParams.recipients || (txPrebuild.txInfo as TronTxInfo | undefined)?.recipients;
      if (!recipients || recipients.length === 0) {
        // No recipients — server-determined transfer (e.g. consolidation); structural check above is sufficient.
        return true;
      }
      if (recipients.length !== 1) {
        throw new Error('invalid required property recipients');
      }

      // recipientHex has '41' hex prefix; convert to base58 for comparison
      const actualDestination = Utils.getBase58AddressFromHex(recipientHex);
      const actualAmount = transferAmount.toString();
      const expectedDestination = recipients[0].address;
      const expectedAmount = recipients[0].amount.toString();

      if (actualAmount !== expectedAmount) {
        throw new Error('transaction amount in txPrebuild does not match the value given by client');
      }

      if (expectedDestination.toLowerCase() !== actualDestination.toLowerCase()) {
        throw new Error('destination address does not match with the recipient address');
      }

      return true;
    }

    const rawTx = txPrebuild.txHex;

    const txBuilder = getBuilder(this.getChain()).from(rawTx);
    const tx = await txBuilder.build();

    const recipients = txParams.recipients || (txPrebuild.txInfo as TronTxInfo).recipients;
    if (!recipients) {
      throw new Error('missing required property recipients');
    }

    if (recipients[0].address === tx.outputs[0].address && recipients[0].amount === tx.outputs[0].value) {
      return true;
    } else {
      throw new Error('Tx outputs does not match with expected txParams recipients');
    }
  }
}
