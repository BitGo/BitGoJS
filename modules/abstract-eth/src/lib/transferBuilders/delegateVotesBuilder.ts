import { BuildTransactionError, InvalidParameterValueError } from '@bitgo/sdk-core';
import { BigNumber } from 'ethers';

import { ContractCall } from '../contractCall';
import { isValidEthAddress } from '../utils';
import { delegateBySigMethodId, delegateBySigTypes } from '../walletUtil';

export interface DelegationSignature {
  v: number;
  r: string;
  s: string;
}

/**
 * Builds encoded calldata for ERC20Votes delegateBySig on-chain submission.
 *
 * Usage:
 *   const calldata = new DelegateVotesBuilder()
 *     .delegatee('0xHotWallet')
 *     .nonce(0)
 *     .expiry(Math.floor(Date.now() / 1000) + 3600)
 *     .signature({ v, r, s })
 *     .build();
 *
 * The calldata can then be submitted to the token contract via a ContractCall
 * transaction (TransactionType.ContractCall) with TransactionBuilder.data().
 *
 * EIP-712 domain for WLFI:
 *   name: "World Liberty Financial", version: "2", chainId: 1,
 *   verifyingContract: "0xdA5e1988097297dCdc1f90D4dFE7909e847CBeF6"
 *
 * The cold wallet signs the following typed data before calling build():
 *   primaryType: "Delegation"
 *   types: { Delegation: [
 *     { name: "delegatee", type: "address" },
 *     { name: "nonce",     type: "uint256" },
 *     { name: "expiry",    type: "uint256" }
 *   ]}
 */
export class DelegateVotesBuilder {
  private _delegatee: string;
  private _nonce: BigNumber;
  private _expiry: BigNumber;
  private _v: number;
  private _r: string;
  private _s: string;

  delegatee(address: string): this {
    if (!isValidEthAddress(address)) {
      throw new InvalidParameterValueError('Invalid delegatee address');
    }
    this._delegatee = address;
    return this;
  }

  nonce(value: number | string): this {
    const bn = BigNumber.from(value);
    if (bn.lt(0)) {
      throw new InvalidParameterValueError('Nonce must be non-negative');
    }
    this._nonce = bn;
    return this;
  }

  expiry(timestamp: number | string): this {
    const bn = BigNumber.from(timestamp);
    if (bn.lte(0)) {
      throw new InvalidParameterValueError('Expiry must be a positive unix timestamp');
    }
    this._expiry = bn;
    return this;
  }

  signature(sig: DelegationSignature): this {
    if (sig.v !== 27 && sig.v !== 28) {
      throw new InvalidParameterValueError('v must be 27 or 28');
    }
    if (!sig.r.match(/^0x[0-9a-fA-F]{64}$/)) {
      throw new InvalidParameterValueError('r must be a 32-byte hex string');
    }
    if (!sig.s.match(/^0x[0-9a-fA-F]{64}$/)) {
      throw new InvalidParameterValueError('s must be a 32-byte hex string');
    }
    this._v = sig.v;
    this._r = sig.r;
    this._s = sig.s;
    return this;
  }

  build(): string {
    if (
      this._delegatee === undefined ||
      this._nonce === undefined ||
      this._expiry === undefined ||
      this._v === undefined ||
      this._r === undefined ||
      this._s === undefined
    ) {
      throw new BuildTransactionError(
        'Missing required fields: delegatee, nonce, expiry, and signature (v, r, s) are all required'
      );
    }

    const contractCall = new ContractCall(delegateBySigMethodId, delegateBySigTypes, [
      this._delegatee,
      this._nonce,
      this._expiry,
      this._v,
      this._r,
      this._s,
    ]);
    return contractCall.serialize();
  }
}
