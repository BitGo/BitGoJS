import { BaseCoin as CoinConfig, NetworkType, StacksNetwork as BitgoStacksNetwork } from '@bitgo/statics';
import BigNum from 'bn.js';
import {
  AddressHashMode,
  addressToString,
  AddressVersion,
  bufferCVFromString,
  ClarityValue,
  FungibleConditionCode,
  listCV,
  makeStandardSTXPostCondition,
  PostCondition,
  PostConditionMode,
  standardPrincipalCV,
  tupleCV,
  uintCV,
} from '@stacks/transactions';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import {
  functionArgsToSendParams,
  getSTXAddressFromPubKeys,
  isValidAddress,
  isValidAmount,
  isValidMemo,
} from './utils';
import { SendParams } from './iface';
import { CONTRACT_NAME_SENDMANY, FUNCTION_NAME_SENDMANY } from './constants';
import { ContractCallPayload } from '@stacks/transactions/dist/payload';
import { AbstractContractBuilder } from './abstractContractBuilder';

export class SendmanyBuilder extends AbstractContractBuilder {
  private _sendParams: SendParams[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  public static isValidContractCall(coinConfig: Readonly<CoinConfig>, payload: ContractCallPayload): boolean {
    return (
      (coinConfig.network as BitgoStacksNetwork).sendmanymemoContractAddress ===
        addressToString(payload.contractAddress) &&
      CONTRACT_NAME_SENDMANY === payload.contractName.content &&
      FUNCTION_NAME_SENDMANY === payload.functionName.content
    );
  }

  private sendParamsToFunctionArgs = (sendParams: SendParams[]): ClarityValue[] => [
    listCV(
      sendParams.map((recipient) =>
        tupleCV({
          to: standardPrincipalCV(recipient.address),
          ustx: uintCV(recipient.amount),
          memo: bufferCVFromString(recipient.memo || ''),
        })
      )
    ),
  ];

  private sendParamsToPostcondition(sendParams: SendParams[]): PostCondition[] {
    const sum: BigNum = sendParams.reduce((current, next) => current.add(new BigNum(next.amount)), new BigNum(0));
    return [
      makeStandardSTXPostCondition(
        getSTXAddressFromPubKeys(
          this._fromPubKeys,
          this._coinConfig.network.type === NetworkType.MAINNET
            ? AddressVersion.MainnetMultiSig
            : AddressVersion.TestnetMultiSig,
          this._fromPubKeys.length > 1 ? AddressHashMode.SerializeP2SH : AddressHashMode.SerializeP2PKH,
          this._numberSignatures
        ).address,
        FungibleConditionCode.Equal,
        sum
      ),
    ];
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    this._sendParams = functionArgsToSendParams((tx.stxTransaction.payload as ContractCallPayload).functionArgs);
  }

  /**
   *  Set a transfer
   *
   * @param {SendParams} sendParams - the sender address
   * @returns {TransactionBuilder} This transaction builder
   */
  send({ address, amount, memo }: SendParams): this {
    if (!address || !isValidAddress(address)) {
      throw new BuildTransactionError('Invalid or missing address, got: ' + address);
    }
    if (!amount || !isValidAmount(amount)) {
      throw new BuildTransactionError('Invalid or missing amount, got: ' + amount);
    }
    if (!!memo && !isValidMemo(memo)) {
      throw new BuildTransactionError('Invalid memo, got: ' + memo);
    }

    this._sendParams.push({ address, amount, memo });
    return this;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._contractAddress = (this._coinConfig.network as BitgoStacksNetwork).sendmanymemoContractAddress;
    this._contractName = CONTRACT_NAME_SENDMANY;
    this._functionName = FUNCTION_NAME_SENDMANY;
    this._functionArgs = this.sendParamsToFunctionArgs(this._sendParams);
    this._postConditionMode = PostConditionMode.Deny;
    this._postConditions = this.sendParamsToPostcondition(this._sendParams);
    return await super.buildImplementation();
  }
}
