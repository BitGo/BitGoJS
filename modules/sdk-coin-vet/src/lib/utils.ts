import { HexUInt, Transaction, TransactionClause } from '@vechain/sdk-core';
import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix, BN } from 'ethereumjs-util';
import { BaseUtils, TransactionRecipient, TransactionType } from '@bitgo-beta/sdk-core';
import {
  v4CreateForwarderMethodId,
  flushForwarderTokensMethodIdV4,
  getRawDecoded,
  getBufferedByteCode,
} from '@bitgo-beta/abstract-eth';
import {
  TRANSFER_TOKEN_METHOD_ID,
  STAKING_METHOD_ID,
  EXIT_DELEGATION_METHOD_ID,
  BURN_NFT_METHOD_ID,
  VET_ADDRESS_LENGTH,
  VET_BLOCK_ID_LENGTH,
  VET_TRANSACTION_ID_LENGTH,
  TRANSFER_NFT_METHOD_ID,
  CLAIM_BASE_REWARDS_METHOD_ID,
  CLAIM_STAKING_REWARDS_METHOD_ID,
} from './constants';
import { KeyPair } from './keyPair';

export class Utils implements BaseUtils {
  isValidAddress(address: string): boolean {
    return this.isValidHex(address, VET_ADDRESS_LENGTH);
  }

  isValidBlockId(hash: string): boolean {
    return this.isValidHex(hash, VET_BLOCK_ID_LENGTH);
  }

  isValidPrivateKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidPublicKey(key: string): boolean {
    try {
      new KeyPair({ pub: key });
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidSignature(signature: string): boolean {
    throw new Error('Method not implemented');
  }

  isValidTransactionId(txId: string): boolean {
    return this.isValidHex(txId, VET_TRANSACTION_ID_LENGTH);
  }

  isValidHex(value: string, length: number): boolean {
    const regex = new RegExp(`^(0x|0X)[a-fA-F0-9]{${length}}$`);
    return regex.test(value);
  }

  deserializeTransaction(serializedTransaction: string): Transaction {
    const txBytes = HexUInt.of(serializedTransaction).bytes;
    try {
      return Transaction.decode(txBytes, false);
    } catch (err) {
      if (err.message?.includes('Expected 9 items, but got 10')) {
        // Likely signed, so retry with isSigned = true
        return Transaction.decode(txBytes, true);
      }
      throw err;
    }
  }

  getTransactionTypeFromClause(clauses: TransactionClause[]): TransactionType {
    if (clauses[0].data === '0x') {
      return TransactionType.Send;
    } else if (clauses[0].data.startsWith(v4CreateForwarderMethodId)) {
      return TransactionType.AddressInitialization;
    } else if (clauses[0].data.startsWith(flushForwarderTokensMethodIdV4)) {
      return TransactionType.FlushTokens;
    } else if (clauses[0].data.startsWith(TRANSFER_TOKEN_METHOD_ID)) {
      return TransactionType.SendToken;
    } else if (clauses[0].data.startsWith(STAKING_METHOD_ID)) {
      return TransactionType.ContractCall;
    } else if (clauses[0].data.startsWith(EXIT_DELEGATION_METHOD_ID)) {
      return TransactionType.StakingUnlock;
    } else if (clauses[0].data.startsWith(BURN_NFT_METHOD_ID)) {
      return TransactionType.StakingWithdraw;
    } else if (
      clauses[0].data.startsWith(CLAIM_BASE_REWARDS_METHOD_ID) ||
      clauses[0].data.startsWith(CLAIM_STAKING_REWARDS_METHOD_ID)
    ) {
      return TransactionType.StakingClaim;
    } else if (clauses[0].data.startsWith(TRANSFER_NFT_METHOD_ID)) {
      return TransactionType.SendNFT;
    } else {
      return TransactionType.SendToken;
    }
  }

  getTransferTokenData(toAddress: string, amountWei: string): string {
    const methodName = 'transfer';
    const types = ['address', 'uint256'];
    const params = [toAddress, new BN(amountWei)];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);

    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }

  getTransferNFTData(from: string, to: string, tokenId: string): string {
    const methodName = 'transferFrom';
    const types = ['address', 'address', 'uint256'];
    const params = [from, to, new BN(tokenId)];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);

    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }

  /**
   * Encodes staking transaction data using ethereumjs-abi
   *
   * @param {string} stakingAmount - The amount to stake in wei
   * @returns {string} - The encoded transaction data
   */
  getStakingData(stakingAmount: string): string {
    const methodName = 'stake';
    const types = ['uint256'];
    const params = [new BN(stakingAmount)];

    const method = EthereumAbi.methodID(methodName, types);
    const args = EthereumAbi.rawEncode(types, params);

    return addHexPrefix(Buffer.concat([method, args]).toString('hex'));
  }

  decodeTransferTokenData(data: string): TransactionRecipient {
    const [address, amount] = getRawDecoded(
      ['address', 'uint256'],
      getBufferedByteCode(TRANSFER_TOKEN_METHOD_ID, data)
    );
    const recipientAddress = addHexPrefix(address.toString()).toLowerCase();
    return {
      address: recipientAddress,
      amount: amount.toString(),
    };
  }

  decodeTransferNFTData(data: string): {
    recipients: TransactionRecipient[];
    sender: string;
    tokenId: string;
  } {
    const [from, to, tokenIdBN] = getRawDecoded(
      ['address', 'address', 'uint256'],
      getBufferedByteCode(TRANSFER_NFT_METHOD_ID, data)
    );
    const recipientAddress = addHexPrefix(to.toString()).toLowerCase();
    const recipient: TransactionRecipient = {
      address: recipientAddress,
      amount: '1',
    };
    const sender = addHexPrefix(from.toString()).toLowerCase();
    const tokenId = tokenIdBN.toString();
    return {
      recipients: [recipient],
      sender,
      tokenId,
    };
  }
}

const utils = new Utils();

export default utils;
