import { HexUInt, Transaction, TransactionClause } from '@vechain/sdk-core';
import EthereumAbi from 'ethereumjs-abi';
import { addHexPrefix, BN } from 'ethereumjs-util';
import { BaseUtils, TransactionRecipient, TransactionType } from '@bitgo/sdk-core';
import {
  v4CreateForwarderMethodId,
  flushForwarderTokensMethodIdV4,
  getRawDecoded,
  getBufferedByteCode,
} from '@bitgo/abstract-eth';
import {
  TRANSFER_TOKEN_METHOD_ID,
  STAKING_METHOD_ID,
  STAKE_CLAUSE_METHOD_ID,
  EXIT_DELEGATION_METHOD_ID,
  BURN_NFT_METHOD_ID,
  VET_ADDRESS_LENGTH,
  VET_BLOCK_ID_LENGTH,
  VET_TRANSACTION_ID_LENGTH,
  TRANSFER_NFT_METHOD_ID,
  CLAIM_BASE_REWARDS_METHOD_ID,
  CLAIM_STAKING_REWARDS_METHOD_ID,
  STARGATE_NFT_ADDRESS,
  STARGATE_NFT_ADDRESS_TESTNET,
  STARGATE_DELEGATION_ADDRESS,
  DELEGATE_CLAUSE_METHOD_ID,
  STARGATE_CONTRACT_ADDRESS_TESTNET,
  STARGATE_DELEGATION_ADDRESS_TESTNET,
} from './constants';
import { KeyPair } from './keyPair';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

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
    } else if (clauses[0].data.startsWith(STAKE_CLAUSE_METHOD_ID)) {
      return TransactionType.StakingActivate;
    } else if (clauses[0].data.startsWith(DELEGATE_CLAUSE_METHOD_ID)) {
      return TransactionType.StakingDelegate;
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
   * Decodes staking transaction data to extract levelId and autorenew
   *
   * @param {string} data - The encoded transaction data
   * @returns {object} - Object containing levelId and autorenew
   */
  decodeStakingData(data: string): { levelId: number; autorenew: boolean } {
    try {
      const parameters = data.slice(10);

      // Decode using ethereumjs-abi directly
      const decoded = EthereumAbi.rawDecode(['uint8', 'bool'], Buffer.from(parameters, 'hex'));

      return {
        levelId: Number(decoded[0]),
        autorenew: Boolean(decoded[1]),
      };
    } catch (error) {
      throw new Error(`Failed to decode staking data: ${error.message}`);
    }
  }

  /**
   * Decodes staking transaction data to extract levelId and autorenew
   *
   * @param {string} data - The encoded transaction data
   * @returns {object} - Object containing levelId and autorenew
   */
  decodeStakeClauseData(data: string): { levelId: number } {
    try {
      const parameters = data.slice(10);

      // Decode using ethereumjs-abi directly
      const decoded = EthereumAbi.rawDecode(['uint8'], Buffer.from(parameters, 'hex'));

      return {
        levelId: Number(decoded[0]),
      };
    } catch (error) {
      throw new Error(`Failed to decode staking data: ${error.message}`);
    }
  }

  /**
   * Decodes delegate transaction data to extract tokenId and validatorAddress
   *
   * @param {string} data - The encoded transaction data
   * @returns {object} - Object containing levelId and validator address
   */
  decodeDelegateClauseData(data: string): { tokenId: string; validator: string } {
    try {
      const parameters = data.slice(10);

      // Decode using ethereumjs-abi directly
      const decoded = EthereumAbi.rawDecode(['uint256', 'address'], Buffer.from(parameters, 'hex'));

      return {
        tokenId: String(decoded[0]),
        validator: addHexPrefix(decoded[1].toString()).toLowerCase(),
      };
    } catch (error) {
      throw new Error(`Failed to decode delegation data: ${error.message}`);
    }
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

  /**
   * Decodes claim rewards transaction data to extract tokenId
   *
   * @param {string} data - The encoded claim rewards method call data
   * @returns {string} - The tokenId as a string
   */
  decodeClaimRewardsData(data: string): string {
    try {
      // Remove method ID (first 10 characters: '0x' + 4-byte method ID)
      const methodData = data.slice(10);

      // Extract tokenId from first 32-byte slot
      // The tokenId is a uint256, so we take the full 64 hex characters
      const tokenIdHex = methodData.slice(0, 64);

      // Convert hex to decimal string
      return BigInt('0x' + tokenIdHex).toString();
    } catch (error) {
      throw new Error(`Failed to decode claim rewards data: ${error.message}`);
    }
  }

  /**
   * Decodes exit delegation transaction data to extract tokenId
   *
   * @param {string} data - The encoded exit delegation method call data
   * @returns {string} - The tokenId as a string
   */
  decodeExitDelegationData(data: string): string {
    try {
      if (!data.startsWith(EXIT_DELEGATION_METHOD_ID)) {
        throw new Error('Invalid exit delegation method data');
      }

      const tokenIdHex = data.slice(EXIT_DELEGATION_METHOD_ID.length);
      // Convert hex to decimal (matching original parseInt logic)
      return parseInt(tokenIdHex, 16).toString();
    } catch (error) {
      throw new Error(`Failed to decode exit delegation data: ${error.message}`);
    }
  }

  /**
   * Decodes burn NFT transaction data to extract tokenId
   *
   * @param {string} data - The encoded burn NFT method call data
   * @returns {string} - The tokenId as a string
   */
  decodeBurnNftData(data: string): string {
    try {
      if (!data.startsWith(BURN_NFT_METHOD_ID)) {
        throw new Error('Invalid burn NFT method data');
      }

      const tokenIdHex = data.slice(BURN_NFT_METHOD_ID.length);
      // Convert hex to decimal (matching original parseInt logic)
      return parseInt(tokenIdHex, 16).toString();
    } catch (error) {
      throw new Error(`Failed to decode burn NFT data: ${error.message}`);
    }
  }

  /**
   * Get the network-appropriate stargate contract address
   * @param {CoinConfig} coinConfig - The coin configuration object
   * @returns {string} The delegation contract address for the network
   */
  getDefaultDelegationAddress(coinConfig: Readonly<CoinConfig>): string {
    const isTestnet = coinConfig.network.type === 'testnet';
    return isTestnet ? STARGATE_CONTRACT_ADDRESS_TESTNET : STARGATE_DELEGATION_ADDRESS;
  }

  /**
   * Get the network-appropriate staking contract address
   * @param {CoinConfig} coinConfig - The coin configuration object
   * @returns {string} The staking contract address for the network
   */
  getDefaultStakingAddress(coinConfig: Readonly<CoinConfig>): string {
    const isTestnet = coinConfig.network.type === 'testnet';
    return isTestnet ? STARGATE_CONTRACT_ADDRESS_TESTNET : STARGATE_NFT_ADDRESS;
  }

  /**
   * Check if an address is a valid delegation contract address for any network
   * @param {string} address - The address to check
   * @returns {boolean} True if the address is a delegation contract address
   */
  isDelegationContractAddress(address: string): boolean {
    const lowerAddress = address.toLowerCase();
    return (
      lowerAddress === STARGATE_DELEGATION_ADDRESS.toLowerCase() ||
      lowerAddress === STARGATE_DELEGATION_ADDRESS_TESTNET.toLowerCase()
    );
  }

  /**
   * Check if an address is a valid NFT contract address for any network
   * @param {string} address - The address to check
   * @returns {boolean} True if the address is an NFT contract address
   */
  isNftContractAddress(address: string): boolean {
    const lowerAddress = address.toLowerCase();
    return (
      lowerAddress === STARGATE_NFT_ADDRESS.toLowerCase() || lowerAddress === STARGATE_NFT_ADDRESS_TESTNET.toLowerCase()
    );
  }

  /**
   * Validate that a contract address matches the expected stargate address for the network
   * @param {string} address - The contract address to validate
   * @param {CoinConfig} coinConfig - The coin configuration object
   * @throws {Error} If the address doesn't match the expected contract address
   */
  validateStakingContractAddress(address: string, coinConfig: Readonly<CoinConfig>): void {
    const expectedAddress = this.getDefaultStakingAddress(coinConfig);
    if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new Error(
        `Invalid staking contract address. Expected ${expectedAddress} for ${coinConfig.network.type}, got ${address}`
      );
    }
  }

  /**
   * Validate that a contract address matches the expected stargate contract for the network
   * @param {string} address - The contract address to validate
   * @param {CoinConfig} coinConfig - The coin configuration object
   * @throws {Error} If the address doesn't match the expected delegation contract address
   */
  validateDelegationContractAddress(address: string, coinConfig: Readonly<CoinConfig>): void {
    const expectedAddress = this.getDefaultDelegationAddress(coinConfig);
    if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new Error(
        `Invalid delegation contract address. Expected ${expectedAddress} for ${coinConfig.network.type}, got ${address}`
      );
    }
  }
}

const utils = new Utils();

export default utils;
