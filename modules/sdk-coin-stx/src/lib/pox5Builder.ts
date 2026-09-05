import { BaseCoin as CoinConfig, StacksNetwork as BitgoStacksNetwork } from '@bitgo/statics';
import {
  bufferCV,
  contractPrincipalCV,
  ContractCallPayload,
  ClarityValue,
  listCV,
  noneCV,
  responseErrorCV,
  responseOkCV,
  someCV,
  standardPrincipalCV,
  tupleCV,
  uintCV,
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

function byteBuffer(value: ByteValue, field: string): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
    throw new InvalidParameterValueError(`${field} must be an even-length hexadecimal string`);
  }
  return Buffer.from(hex, 'hex');
}

function contractPrincipal(value: string): ClarityValue {
  const separator = value.indexOf('.');
  if (separator <= 0 || separator === value.length - 1 || value.indexOf('.', separator + 1) !== -1) {
    throw new InvalidParameterValueError(`${value} must have address.contract-name format`);
  }
  return contractPrincipalCV(value.slice(0, separator), value.slice(separator + 1));
}

function optionalBuffer(value: ByteValue | undefined): ClarityValue {
  return value === undefined ? noneCV() : someCV(bufferCV(byteBuffer(value, 'signerCalldata')));
}

function lockupValue(lockup: Pox5Lockup): ClarityValue {
  if (lockup.kind === 'sbtc') {
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
            header: bufferCV(byteBuffer(output.header, 'header')),
            'leaf-hashes': listCV(output.leafHashes.map((hash) => bufferCV(byteBuffer(hash, 'leafHash')))),
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

  public static isValidContractCall(payload: ContractCallPayload): boolean {
    return payload.contractName.content === CONTRACT_NAME_POX5;
  }

  registerForBond(params: Pox5RegisterForBondParams): this {
    this.functionName(FUNCTION_NAME_REGISTER_FOR_BOND);
    this.functionArgs([
      uintCV(params.bondIndex),
      contractPrincipal(params.signerManager),
      uintCV(params.amountUstx),
      lockupValue(params.lockup),
      optionalBuffer(params.signerCalldata),
    ]);
    return this;
  }

  updateBondRegistration(params: Pox5UpdateBondRegistrationParams): this {
    this.functionName(FUNCTION_NAME_UPDATE_BOND_REGISTRATION);
    this.functionArgs([
      contractPrincipal(params.signerManager),
      contractPrincipal(params.oldSignerManager),
      optionalBuffer(params.signerCalldata),
    ]);
    return this;
  }

  announceL1EarlyExit(params: Pox5AnnounceL1EarlyExitParams): this {
    this.functionName(FUNCTION_NAME_ANNOUNCE_L1_EARLY_EXIT);
    this.functionArgs([standardPrincipalCV(params.staker), contractPrincipal(params.oldSignerManager)]);
    return this;
  }

  stake(params: Pox5StakeParams): this {
    this.functionName(FUNCTION_NAME_STAKE);
    this.functionArgs([
      contractPrincipal(params.signerManager),
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
      contractPrincipal(params.signerManager),
      contractPrincipal(params.oldSignerManager),
      uintCV(params.cyclesToExtend ?? 0),
      uintCV(params.amountIncrease ?? 0),
      optionalBuffer(params.signerCalldata),
    ]);
    return this;
  }

  unstake(oldSignerManager: string): this {
    this.functionName(FUNCTION_NAME_UNSTAKE);
    this.functionArgs([contractPrincipal(oldSignerManager)]);
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
      standardPrincipalCV(params.staker),
      uintCV(params.rewardCycle),
      params.bondIndex === undefined ? noneCV() : someCV(uintCV(params.bondIndex)),
    ]);
    return this;
  }
}
