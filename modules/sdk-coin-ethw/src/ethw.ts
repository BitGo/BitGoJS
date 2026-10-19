import request from 'superagent';

import { BN } from 'ethereumjs-util';

import {
  BaseCoin,
  BitGoBase,
  common,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Eth, optionalDeps, TransactionBuilder } from '@bitgo/sdk-coin-eth';

type FullNodeResponseBody = {
  jsonrpc: string;
  id: string;
  result?: string;
  error?: {
    code: number | string;
    message: string;
  };
};

export class Ethw extends Eth {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Ethw(bitgo, staticsCoin);
  }

  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }
  generateKeyPair(seed?: Buffer | undefined): KeyPair {
    throw new Error('Method not implemented.');
  }

  /**
   * Query full node for the balance of an address
   * @param {string} address the ETHw address
   * @returns {Promise<BN>} address balance
   */
  async queryAddressBalance(address: string): Promise<BN> {
    const result = await this.recoveryFullNodeRPCQuery('eth_getBalance', [address, 'latest']);
    // throw if the result does not exist or the result is not a valid number
    if (!result || !result.result) {
      throw new Error(`Could not obtain address balance for ${address} from full node, got: ${result?.result}`);
    }
    return new optionalDeps.ethUtil.BN(result.result.slice(2), 16);
  }

  /**
   * Queries the wallet contract (via RPC) whether an address is a signer on it.
   * Every recovery read for this coin goes through the full node, so the signer
   * probe shares that path instead of the explorer API.
   * @param {string} walletContractAddress address of the wallet contract
   * @param {string} signerAddress address to test for membership
   * @returns {Promise<boolean>} true if the address is a signer on the wallet contract
   */
  async queryIsWalletSigner(walletContractAddress: string, signerAddress: string): Promise<boolean> {
    const signerMethodSignature = optionalDeps.ethAbi.methodID('isSigner', ['address']);
    const signerMethodArgs = optionalDeps.ethAbi.rawEncode(['address'], [signerAddress]);
    const signerMethodData = Buffer.concat([signerMethodSignature, signerMethodArgs]).toString('hex');
    const signerMethodDataHex = optionalDeps.ethUtil.addHexPrefix(signerMethodData);
    const result = await this.recoveryFullNodeRPCQuery('eth_call', [
      { to: walletContractAddress, data: signerMethodDataHex },
      'latest',
    ]);
    if (!result || !result.result || optionalDeps.ethUtil.stripHexPrefix(result.result).length === 0) {
      throw new Error(
        `Could not read the signer set of wallet contract ${walletContractAddress} from the full node, got: ${result?.result}`
      );
    }
    return optionalDeps.ethAbi.rawDecode(['bool'], optionalDeps.ethUtil.toBuffer(result.result))[0] === true;
  }

  /**
   * Queries the contract (via RPC) for the next sequence ID
   * @param {string} address address of the contract
   * @returns {Promise<number>} sequence ID
   */
  async querySequenceId(address: string): Promise<number> {
    // Get sequence ID using contract call
    const sequenceIdMethodSignature = optionalDeps.ethAbi.methodID('getNextSequenceId', []);
    const sequenceIdArgs = optionalDeps.ethAbi.rawEncode([], []);
    const sequenceIdData = Buffer.concat([sequenceIdMethodSignature, sequenceIdArgs]).toString('hex');
    const sequenceIdDataHex = optionalDeps.ethUtil.addHexPrefix(sequenceIdData);
    const result = await this.recoveryFullNodeRPCQuery('eth_call', [
      { to: address, data: sequenceIdDataHex },
      'latest',
    ]);
    if (!result || !result.result) {
      throw new Error('Could not obtain sequence ID from full node, got: ' + result?.result);
    }
    const sequenceIdHex = result.result;
    return new optionalDeps.ethUtil.BN(sequenceIdHex.slice(2), 16).toNumber();
  }

  /**
   * Queries public full node to get the next ETHw nonce that should be used for the given ETH address
   * @param {string} address
   * @returns {Promise<number>} next ETHw nonce
   */
  async getAddressNonce(address: string): Promise<number> {
    const result = await this.recoveryFullNodeRPCQuery('eth_getTransactionCount', [address, 'latest']);
    if (!result || !result.result) {
      throw new Error('Unable to find next nonce from full node, got: ' + JSON.stringify(result));
    }
    return new optionalDeps.ethUtil.BN(result.result.slice(2), 16).toNumber();
  }

  /**
   * Make a RPC query to full node for information such as balance, token balance, solidity calls
   * @param {string} method RPC method to execute
   * @param {Array} params params to include in the RPC request
   * @returns {Promise<FullNodeResponseBody>} response from full node
   */
  async recoveryFullNodeRPCQuery(method: string, params: Array<unknown>): Promise<FullNodeResponseBody> {
    const response = await request.post(common.Environments[this.bitgo.getEnv()].ethwFullNodeRPCBaseUrl).send({
      method,
      params,
      id: 0,
      jsonrpc: '2.0',
    });

    if (!response.ok) {
      throw new Error('could not reach ETHW full node');
    }

    if (response.body.error) {
      throw new Error(`ETHW full node error: ${response.body.error.code} - ${response.body.error.message}`);
    }
    return response.body;
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getChain()));
  }
}
