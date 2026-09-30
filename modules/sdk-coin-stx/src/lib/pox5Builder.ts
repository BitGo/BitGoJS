import { BaseCoin as CoinConfig, NetworkType, StacksNetwork as BitgoStacksNetwork } from '@bitgo/statics';
import {
  AddressHashMode,
  AddressVersion,
  bufferCV,
  ContractCallPayload,
  ClarityType,
  ClarityValue,
  listCV,
  noneCV,
  Pc,
  PostCondition,
  PostConditionMode,
  responseErrorCV,
  responseOkCV,
  someCV,
  tupleCV,
  uintCV,
  addressToString,
} from '@stacks/transactions';
import { InvalidParameterValueError } from '@bitgo/sdk-core';
import { ContractBuilder } from './contractBuilder';
import {
  CONTRACT_NAME_POX5,
  FUNCTION_NAME_ANNOUNCE_L1_EARLY_EXIT,
  FUNCTION_NAME_CALCULATE_REWARDS,
  FUNCTION_NAME_CLAIM_REWARDS,
  FUNCTION_NAME_CLAIM_STAKER_REWARDS,
  FUNCTION_NAME_REGISTER_FOR_BOND,
  FUNCTION_NAME_STAKE,
  FUNCTION_NAME_STAKE_UPDATE,
  FUNCTION_NAME_UNSTAKE,
  FUNCTION_NAME_UPDATE_BOND_REGISTRATION,
} from './constants';
import { contractPrincipalCVFromString, getSTXAddressFromPubKeys, standardPrincipalCVFromString } from './utils';
import { Transaction } from './transaction';

type Integer = bigint | number | string;
type ByteValue = Buffer | Uint8Array | string;

export interface Pox5LockupOutput {
  height: number;
  tx: ByteValue;
  outputIndex: number;
  header: ByteValue;
  leafHashes: ByteValue[];
  txCount: number;
  txIndex: number;
  amount: Integer;
  unlockBurnHeight: number;
}

export type Pox5Lockup =
  | {
      kind: 'btc';
      outputs: Pox5LockupOutput[];
      unlockBytes: ByteValue;
    }
  | {
      kind: 'sbtc';
      sbtcSats: Integer;
    };

export interface Pox5RegisterForBondParams {
  bondIndex: Integer;
  signerManager: string;
  amountUstx: Integer;
  lockup: Pox5Lockup;
  signerCalldata?: ByteValue;
}

export interface Pox5UpdateBondRegistrationParams {
  signerManager: string;
  oldSignerManager: string;
  signerCalldata?: ByteValue;
}

export interface Pox5AnnounceL1EarlyExitParams {
  staker: string;
  oldSignerManager: string;
}

export interface Pox5StakeParams {
  signerManager: string;
  amountUstx: Integer;
  numCycles: Integer;
  startBurnHt: Integer;
  signerCalldata?: ByteValue;
}

export interface Pox5StakeUpdateParams {
  signerManager: string;
  oldSignerManager: string;
  cyclesToExtend?: Integer;
  amountIncrease?: Integer;
  /**
   * The FULL staked amount after the update, not the increase. SIP-045 evaluates the 0x03
   * staking post-condition against the post-update stake: declaring only the increase delta
   * fails the node's post-condition check. Required when `amountIncrease` is non-zero.
   */
  postStakeAmount?: Integer;
  signerCalldata?: ByteValue;
}

export interface Pox5ClaimRewardsParams {
  bondIndices: Integer[];
  rewardCycle: Integer;
}

export interface Pox5ClaimStakerRewardsParams {
  staker: string;
  rewardCycle: Integer;
  bondIndex?: Integer;
}

function byteBuffer(value: ByteValue, field: string, expectedLength?: number): Buffer {
  // String inputs are hexadecimal, with an optional 0x prefix; use Buffer for text bytes.
  let buffer: Buffer;
  if (Buffer.isBuffer(value)) {
    buffer = value;
  } else if (value instanceof Uint8Array) {
    buffer = Buffer.from(value);
  } else {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
      throw new InvalidParameterValueError(`${field} must be an even-length hexadecimal string`);
    }
    buffer = Buffer.from(hex, 'hex');
  }
  if (expectedLength !== undefined && buffer.length !== expectedLength) {
    throw new InvalidParameterValueError(`${field} must be exactly ${expectedLength} bytes`);
  }
  return buffer;
}

function optionalBuffer(value: ByteValue | undefined): ClarityValue {
  return value === undefined ? noneCV() : someCV(bufferCV(byteBuffer(value, 'signerCalldata')));
}

function lockupValue(lockup: Pox5Lockup): ClarityValue {
  if (lockup.kind === 'sbtc') {
    // PoX-5 ABI represents an sBTC lockup as err uint and an L1 BTC lockup as ok tuple.
    return responseErrorCV(uintCV(lockup.sbtcSats));
  }
  if (lockup.outputs.length === 0 || lockup.outputs.length > 10) {
    throw new InvalidParameterValueError('btc lockup outputs must contain between 1 and 10 outputs');
  }
  for (const [index, output] of lockup.outputs.entries()) {
    if (output.leafHashes.length > 14) {
      throw new InvalidParameterValueError(`btc lockup output ${index} has more than 14 merkle siblings`);
    }
  }
  return responseOkCV(
    tupleCV({
      outputs: listCV(
        lockup.outputs.map((output) =>
          tupleCV({
            height: uintCV(output.height),
            tx: bufferCV(byteBuffer(output.tx, 'tx')),
            'output-index': uintCV(output.outputIndex),
            header: bufferCV(byteBuffer(output.header, 'header', 80)),
            'leaf-hashes': listCV(output.leafHashes.map((hash) => bufferCV(byteBuffer(hash, 'leafHash', 32)))),
            'tx-count': uintCV(output.txCount),
            'tx-index': uintCV(output.txIndex),
            amount: uintCV(output.amount),
            'unlock-burn-height': uintCV(output.unlockBurnHeight),
          })
        )
      ),
      'staker-unlock-bytes': bufferCV(byteBuffer(lockup.unlockBytes, 'unlockBytes')),
    })
  );
}

export class Pox5Builder extends ContractBuilder {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._contractAddress = (coinConfig.network as BitgoStacksNetwork).stakingContractAddress;
    this._contractName = CONTRACT_NAME_POX5;
  }

  public static isValidContractCall(coinConfig: Readonly<CoinConfig>, payload: ContractCallPayload): boolean {
    return (
      (coinConfig.network as BitgoStacksNetwork).stakingContractAddress === addressToString(payload.contractAddress) &&
      payload.contractName.content === CONTRACT_NAME_POX5
    );
  }

  /**
   * The full post-update stake for a `stake-update` call, as passed via
   * {@link Pox5StakeUpdateParams.postStakeAmount}. Kept aside from the function args
   * because it is not part of the pox-5 ABI — the on-chain args only carry the increase.
   */
  private _stakeUpdatePostAmount?: Integer;

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (this._postConditions === undefined) {
      this._postConditions = this.derivePostConditions();
      this._postConditionMode = PostConditionMode.Deny;
    }
    return await super.buildImplementation();
  }

  /**
   * Derive the SIP-045 post-conditions the pox-5 contract call is evaluated against
   * (SIP-045 §3.4.3). In Deny mode the node rejects `stake`, `register-for-bond` and
   * `stake-update` without a matching 0x03 staking post-condition, and `unstake`,
   * `update-bond-registration` and `announce-l1-early-exit` without a 0x04 PoX
   * post-condition, so the builder attaches one whenever the caller has not supplied
   * their own via {@link AbstractContractBuilder.postConditions}.
   *
   * The derivation works from the stored function args, so it also covers transactions
   * re-built from a deserialized raw transaction.
   */
  private derivePostConditions(): PostCondition[] {
    const senderAddress = getSTXAddressFromPubKeys(
      this._fromPubKeys,
      this._coinConfig.network.type === NetworkType.MAINNET
        ? AddressVersion.MainnetMultiSig
        : AddressVersion.TestnetMultiSig,
      this._fromPubKeys.length > 1 ? AddressHashMode.P2SH : AddressHashMode.P2PKH,
      this._numberSignatures
    ).address;

    switch (this._functionName) {
      case FUNCTION_NAME_STAKE:
        return [Pc.principal(senderAddress).willSendEq(this.uintArgValue(1)).ustxToLock()];
      case FUNCTION_NAME_REGISTER_FOR_BOND:
        return [Pc.principal(senderAddress).willSendEq(this.uintArgValue(2)).ustxToLock()];
      case FUNCTION_NAME_STAKE_UPDATE:
        if (this._stakeUpdatePostAmount === undefined) {
          throw new InvalidParameterValueError(
            'pox-5 stake-update requires postStakeAmount (the full post-update stake, not the increase) ' +
              'for its SIP-045 staking post-condition; pass it in the stakeUpdate params or set postConditions() explicitly'
          );
        }
        return [Pc.principal(senderAddress).willSendEq(this._stakeUpdatePostAmount).ustxToLock()];
      case FUNCTION_NAME_UNSTAKE:
      case FUNCTION_NAME_UPDATE_BOND_REGISTRATION:
      case FUNCTION_NAME_ANNOUNCE_L1_EARLY_EXIT:
        return [Pc.principal(senderAddress).willPerformPox()];
      default:
        // read-only reward calls are not evaluated against SIP-045 staking/PoX post-conditions
        return [];
    }
  }

  /**
   * Read a uint function argument. The SIP-045 staking post-condition amounts mirror
   * the on-chain amount arguments, so the derivation can read them straight from the ABI args.
   */
  private uintArgValue(index: number): Integer {
    const arg = this._functionArgs[index];
    if (!arg || arg.type !== ClarityType.UInt) {
      throw new InvalidParameterValueError(`pox-5 ${this._functionName} expects a uint argument at position ${index}`);
    }
    return arg.value;
  }
  registerForBond(params: Pox5RegisterForBondParams): this {
    this.functionName(FUNCTION_NAME_REGISTER_FOR_BOND);
    this.functionArgs([
      uintCV(params.bondIndex),
      contractPrincipalCVFromString(params.signerManager),
      uintCV(params.amountUstx),
      lockupValue(params.lockup),
      optionalBuffer(params.signerCalldata),
    ]);
    return this;
  }

  updateBondRegistration(params: Pox5UpdateBondRegistrationParams): this {
    this.functionName(FUNCTION_NAME_UPDATE_BOND_REGISTRATION);
    this.functionArgs([
      contractPrincipalCVFromString(params.signerManager),
      contractPrincipalCVFromString(params.oldSignerManager),
      optionalBuffer(params.signerCalldata),
    ]);
    return this;
  }

  announceL1EarlyExit(params: Pox5AnnounceL1EarlyExitParams): this {
    this.functionName(FUNCTION_NAME_ANNOUNCE_L1_EARLY_EXIT);
    this.functionArgs([
      standardPrincipalCVFromString(params.staker),
      contractPrincipalCVFromString(params.oldSignerManager),
    ]);
    return this;
  }

  stake(params: Pox5StakeParams): this {
    this.functionName(FUNCTION_NAME_STAKE);
    this.functionArgs([
      contractPrincipalCVFromString(params.signerManager),
      uintCV(params.amountUstx),
      uintCV(params.numCycles),
      uintCV(params.startBurnHt),
      optionalBuffer(params.signerCalldata),
    ]);
    return this;
  }

  stakeUpdate(params: Pox5StakeUpdateParams): this {
    this.functionName(FUNCTION_NAME_STAKE_UPDATE);
    this.functionArgs([
      contractPrincipalCVFromString(params.signerManager),
      contractPrincipalCVFromString(params.oldSignerManager),
      // The PoX-5 ABI uses uint values; omitted values intentionally encode zero.
      uintCV(params.cyclesToExtend ?? 0),
      uintCV(params.amountIncrease ?? 0),
      optionalBuffer(params.signerCalldata),
    ]);
    this._stakeUpdatePostAmount = params.postStakeAmount;
    return this;
  }

  unstake(oldSignerManager: string): this {
    this.functionName(FUNCTION_NAME_UNSTAKE);
    this.functionArgs([contractPrincipalCVFromString(oldSignerManager)]);
    return this;
  }

  calculateRewards(bondIndices: Integer[]): this {
    this.functionName(FUNCTION_NAME_CALCULATE_REWARDS);
    this.functionArgs([listCV(bondIndices.map((bondIndex) => uintCV(bondIndex)))]);
    return this;
  }

  claimRewards(params: Pox5ClaimRewardsParams): this {
    this.functionName(FUNCTION_NAME_CLAIM_REWARDS);
    this.functionArgs([listCV(params.bondIndices.map((bondIndex) => uintCV(bondIndex))), uintCV(params.rewardCycle)]);
    return this;
  }

  claimStakerRewardsForSigner(params: Pox5ClaimStakerRewardsParams): this {
    this.functionName(FUNCTION_NAME_CLAIM_STAKER_REWARDS);
    this.functionArgs([
      standardPrincipalCVFromString(params.staker),
      uintCV(params.rewardCycle),
      params.bondIndex === undefined ? noneCV() : someCV(uintCV(params.bondIndex)),
    ]);
    return this;
  }
}
