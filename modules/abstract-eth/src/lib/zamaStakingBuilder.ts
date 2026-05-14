import { BuildTransactionError } from '@bitgo/sdk-core';
import { isValidEthAddress } from './utils';
import { buildApproveCalldata, buildDepositCalldata, approveMethodId, depositMethodId } from './zamaStakingUtils';
import { StakingBuildResult } from './iface';

/**
 * Distinguishes between the two staking operations in the delegate flow.
 */
export enum ZamaStakingOperationType {
  /** ERC20 approve — grant OperatorStaking spending allowance. */
  APPROVE = 'approve',
  /** ERC4626 deposit — deposit ZAMA tokens into the OperatorStaking vault. */
  DEPOSIT = 'deposit',
}

/**
 * Fluent builder for ZAMA ERC-4626 staking delegate flow transactions.
 *
 * Used as a helper owned by the abstract-eth TransactionBuilder. Pass an instance
 * to `txBuilder.staking(builder)` to integrate it into the transaction pipeline.
 *
 * The delegate flow consists of two transactions:
 *
 * 1. **Approve (TX1):** ERC20 `approve(address,uint256)` on the ZAMA token contract,
 *    granting the OperatorStaking contract permission to transfer tokens.
 *
 * 2. **Deposit (TX2):** ERC4626 `deposit(uint256,address)` on the OperatorStaking
 *    contract, depositing ZAMA tokens and receiving stZAMA shares.
 *
 * Usage via TransactionBuilder:
 *   txBuilder.type(TransactionType.ContractCall);
 *   txBuilder.staking(
 *     new ZamaStakingBuilder()
 *       .type(ZamaStakingOperationType.APPROVE)
 *       .tokenContractAddress('0xZamaToken...')
 *       .spenderAddress('0xOperatorStaking...')
 *       .amount('1000000000000000000')
 *   );
 *   const tx = await txBuilder.build();
 */
export class ZamaStakingBuilder {
  private _type?: ZamaStakingOperationType;
  private _amount?: string;
  private _tokenContractAddress?: string;
  private _spenderAddress?: string;
  private _operatorAddress?: string;
  private _receiverAddress?: string;

  /**
   * Set the staking operation type.
   *
   * @param type APPROVE or DEPOSIT
   */
  type(type: ZamaStakingOperationType): this {
    this._type = type;
    return this;
  }

  /**
   * Set the amount of ZAMA tokens (18 decimals, as a decimal string).
   *
   * @param value Token amount
   */
  amount(value: string): this {
    if (!value || value === '0') {
      throw new BuildTransactionError('Invalid amount for staking transaction');
    }
    this._amount = value;
    return this;
  }

  /**
   * Set the ZAMA ERC-20 token contract address (used for APPROVE).
   *
   * @param address Token contract address
   */
  tokenContractAddress(address: string): this {
    if (!isValidEthAddress(address)) {
      throw new BuildTransactionError('Invalid token contract address: ' + address);
    }
    this._tokenContractAddress = address;
    return this;
  }

  /**
   * Set the OperatorStaking contract address — the approved spender (used for APPROVE).
   *
   * @param address Spender address
   */
  spenderAddress(address: string): this {
    if (!isValidEthAddress(address)) {
      throw new BuildTransactionError('Invalid spender address: ' + address);
    }
    this._spenderAddress = address;
    return this;
  }

  /**
   * Set the OperatorStaking contract address to deposit into (used for DEPOSIT).
   *
   * @param address Operator contract address
   */
  operatorAddress(address: string): this {
    if (!isValidEthAddress(address)) {
      throw new BuildTransactionError('Invalid operator address: ' + address);
    }
    this._operatorAddress = address;
    return this;
  }

  /**
   * Set the address that will receive the minted stZAMA shares (used for DEPOSIT).
   *
   * @param address Receiver address
   */
  receiverAddress(address: string): this {
    if (!isValidEthAddress(address)) {
      throw new BuildTransactionError('Invalid receiver address: ' + address);
    }
    this._receiverAddress = address;
    return this;
  }

  /**
   * Build the staking transaction.
   *
   * Validates required fields and produces a StakingBuildResult with the target
   * contract address and ABI-encoded calldata.
   *
   * @returns StakingBuildResult containing {address, data, value}
   * @throws BuildTransactionError if required fields are missing
   */
  build(): StakingBuildResult {
    if (this._type === undefined) {
      throw new BuildTransactionError('Missing staking operation type');
    }
    if (this._amount === undefined) {
      throw new BuildTransactionError('Missing amount for staking transaction');
    }

    switch (this._type) {
      case ZamaStakingOperationType.APPROVE:
        return this.buildApprove();
      case ZamaStakingOperationType.DEPOSIT:
        return this.buildDeposit();
      default:
        throw new BuildTransactionError('Invalid staking operation type: ' + this._type);
    }
  }

  private buildApprove(): StakingBuildResult {
    if (!this._tokenContractAddress) {
      throw new BuildTransactionError('Missing token contract address for approve');
    }
    if (!this._spenderAddress) {
      throw new BuildTransactionError('Missing spender address for approve');
    }

    return {
      address: this._tokenContractAddress,
      data: buildApproveCalldata(this._spenderAddress, this._amount!),
      value: '0',
    };
  }

  private buildDeposit(): StakingBuildResult {
    if (!this._operatorAddress) {
      throw new BuildTransactionError('Missing operator address for deposit');
    }
    if (!this._receiverAddress) {
      throw new BuildTransactionError('Missing receiver address for deposit');
    }

    return {
      address: this._operatorAddress,
      data: buildDepositCalldata(this._amount!, this._receiverAddress),
      value: '0',
    };
  }

  /**
   * Classify staking operation type from serialized calldata.
   *
   * @param data ABI-encoded calldata hex string
   * @returns true if the data matches a known ZAMA staking selector
   */
  static isStakingData(data: string): boolean {
    if (!data || data.length < 10) {
      return false;
    }
    const selector = data.slice(0, 10).toLowerCase();
    return selector === approveMethodId.toLowerCase() || selector === depositMethodId.toLowerCase();
  }
}
