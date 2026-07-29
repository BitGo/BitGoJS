import { BaseCoin as CoinConfig, NetworkType, StacksNetwork as BitgoStacksNetwork } from '@bitgo/statics';
import BigNum from 'bn.js';
import {
  AddressHashMode,
  addressToString,
  AddressVersion,
  bufferCV,
  ClarityType,
  createAssetInfo,
  FungibleConditionCode,
  makeStandardFungiblePostCondition,
  PostCondition,
  PostConditionMode,
  tupleCV,
  uintCV,
} from '@stacks/transactions';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { getSTXAddressFromPubKeys, isValidAmount } from './utils';
import { SbtcWithdrawParams } from './iface';
import { CONTRACT_NAME_SBTC_WITHDRAWAL, FUNCTION_NAME_INITIATE_WITHDRAWAL } from './constants';
import { ContractCallPayload } from '@stacks/transactions/dist/payload';
import { AbstractContractBuilder } from './abstractContractBuilder';
import { decodeBtcAddress, isValidBtcAddress } from './btcAddressUtils';

const SBTC_TOKEN_CONTRACT_NAME = 'sbtc-token';
const SBTC_TOKEN_ASSET_NAME = 'sbtc-token';

export class SbtcWithdrawBuilder extends AbstractContractBuilder {
  private _withdrawParams: SbtcWithdrawParams | undefined;
  private _isDeserialized = false;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Check whether a deserialized contract-call payload matches the sBTC withdrawal contract.
   */
  public static isValidContractCall(coinConfig: Readonly<CoinConfig>, payload: ContractCallPayload): boolean {
    return (
      (coinConfig.network as BitgoStacksNetwork).sbtcWithdrawalContractAddress ===
        addressToString(payload.contractAddress) &&
      CONTRACT_NAME_SBTC_WITHDRAWAL === payload.contractName.content &&
      FUNCTION_NAME_INITIATE_WITHDRAWAL === payload.functionName.content
    );
  }

  /**
   * Set withdrawal parameters.
   *
   * @param {SbtcWithdrawParams} params - amount (satoshis), btcAddress, maxFee
   * @returns {this}
   */
  withdraw(params: SbtcWithdrawParams): this {
    if (!params.amount || !isValidAmount(params.amount) || params.amount === '0') {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + params.amount);
    }
    if (!params.btcAddress || !isValidBtcAddress(params.btcAddress)) {
      throw new BuildTransactionError('Invalid or missing btcAddress, got: ' + params.btcAddress);
    }
    if (!params.maxFee || !isValidAmount(params.maxFee) || params.maxFee === '0') {
      throw new BuildTransactionError('Invalid or missing maxFee, got: ' + params.maxFee);
    }
    this._withdrawParams = params;
    return this;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const payload = tx.stxTransaction.payload as ContractCallPayload;
    const args = payload.functionArgs;

    if (args.length !== 3) {
      throw new BuildTransactionError('Invalid number of function args for sBTC withdrawal');
    }

    // args[0] = uint (amount)
    if (args[0].type !== ClarityType.UInt) {
      throw new BuildTransactionError('Expected uint for amount argument');
    }
    const amount = args[0].value.toString();

    // args[1] = tuple { version: (buff 1), hashbytes: (buff 32) }
    if (args[1].type !== ClarityType.Tuple) {
      throw new BuildTransactionError('Expected tuple for recipient argument');
    }
    const versionBuf = args[1].data['version'];
    const hashbytesBuf = args[1].data['hashbytes'];
    if (versionBuf?.type !== ClarityType.Buffer || hashbytesBuf?.type !== ClarityType.Buffer) {
      throw new BuildTransactionError('Expected buffer fields in recipient tuple');
    }

    // args[2] = uint (max-fee)
    if (args[2].type !== ClarityType.UInt) {
      throw new BuildTransactionError('Expected uint for max-fee argument');
    }
    const maxFee = args[2].value.toString();

    this._withdrawParams = {
      amount,
      btcAddress: '', // not needed for rebuild; function args are preserved from the original tx
      maxFee,
    };
    this._isDeserialized = true;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._withdrawParams) {
      throw new BuildTransactionError('Withdrawal params are not set. Use withdraw() to set them.');
    }

    const network = this._coinConfig.network as BitgoStacksNetwork;
    this._contractAddress = network.sbtcWithdrawalContractAddress;
    this._contractName = CONTRACT_NAME_SBTC_WITHDRAWAL;
    this._functionName = FUNCTION_NAME_INITIATE_WITHDRAWAL;

    // For deserialized transactions, function args are already preserved from the original tx.
    // For fresh builds, construct them from the withdraw params.
    if (!this._isDeserialized) {
      this._functionArgs = this.withdrawParamsToFunctionArgs(this._withdrawParams);
    }

    this._postConditionMode = PostConditionMode.Deny;
    this._postConditions = this.withdrawParamsToPostCondition(this._withdrawParams);
    return await super.buildImplementation();
  }

  private withdrawParamsToFunctionArgs(params: SbtcWithdrawParams) {
    const decoded = decodeBtcAddress(params.btcAddress);
    return [
      uintCV(params.amount),
      tupleCV({
        version: bufferCV(Buffer.from([decoded.version])),
        hashbytes: bufferCV(decoded.hashBytes),
      }),
      uintCV(params.maxFee),
    ];
  }

  private withdrawParamsToPostCondition(params: SbtcWithdrawParams): PostCondition[] {
    const amount = new BigNum(params.amount).add(new BigNum(params.maxFee));
    const network = this._coinConfig.network as BitgoStacksNetwork;
    const sbtcContractAddress = network.sbtcWithdrawalContractAddress;

    return [
      makeStandardFungiblePostCondition(
        getSTXAddressFromPubKeys(
          this._fromPubKeys,
          this._coinConfig.network.type === NetworkType.MAINNET
            ? AddressVersion.MainnetMultiSig
            : AddressVersion.TestnetMultiSig,
          this._fromPubKeys.length > 1 ? AddressHashMode.SerializeP2SH : AddressHashMode.SerializeP2PKH,
          this._numberSignatures
        ).address,
        FungibleConditionCode.Equal,
        amount,
        createAssetInfo(sbtcContractAddress, SBTC_TOKEN_CONTRACT_NAME, SBTC_TOKEN_ASSET_NAME)
      ),
    ];
  }
}
