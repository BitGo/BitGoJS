import { AddressFormat, BaseUtils } from '@bitgo/sdk-core';
import {
  BaseAddress,
  PublicKey,
  Ed25519Signature,
  NetworkInfo,
  StakeCredential,
  RewardAddress,
  Transaction as CardanoTransaction,
} from '@emurgo/cardano-serialization-lib-nodejs';
import { KeyPair } from './keyPair';
import { bech32 } from 'bech32';

export class Utils implements BaseUtils {
  createBaseAddressWithStakeAndPaymentKey(
    stakeKeyPair: KeyPair,
    paymentKeyPair: KeyPair,
    network: AddressFormat
  ): string {
    let baseAddr;
    if (network === AddressFormat.mainnet) {
      // 1. create stake pubKey
      const key = stakeKeyPair.getKeys().pub;

      const stakePub = PublicKey.from_bytes(Buffer.from(key, 'hex'));
      // 2. create payment pubKey
      const paymentPub = PublicKey.from_bytes(Buffer.from(paymentKeyPair.getKeys().pub, 'hex'));
      // 3. create full base address for staking
      baseAddr = BaseAddress.new(
        NetworkInfo.mainnet().network_id(),
        StakeCredential.from_keyhash(paymentPub.hash()),
        StakeCredential.from_keyhash(stakePub.hash())
      );
      return baseAddr.to_address().to_bech32();
    } else if (network === AddressFormat.testnet) {
      // 1. create stake pubKey
      const stakePub = PublicKey.from_bytes(Buffer.from(stakeKeyPair.getKeys().pub, 'hex'));
      // 2. create payment pubKey
      const paymentPub = PublicKey.from_bytes(Buffer.from(paymentKeyPair.getKeys().pub, 'hex'));
      // 3. create full base address for staking
      const baseAddr = BaseAddress.new(
        NetworkInfo.testnet().network_id(),
        StakeCredential.from_keyhash(paymentPub.hash()),
        StakeCredential.from_keyhash(stakePub.hash())
      );
      return baseAddr.to_address().to_bech32();
    } else {
      throw new Error('Improper Network Type!');
    }
  }

  validateBlake2b(hash: string): boolean {
    if (!hash) {
      return false;
    }
    if (hash.length !== 64) {
      return false;
    }
    return hash.match(/^[a-zA-Z0-9]+$/) !== null;
  }

  getRewardAddress(stakingPubKey: string, coinName: string): string {
    const stakePub = PublicKey.from_bytes(Buffer.from(stakingPubKey, 'hex'));
    let rewardAddress;
    if (coinName === 'ada') {
      rewardAddress = RewardAddress.new(
        NetworkInfo.mainnet().network_id(),
        StakeCredential.from_keyhash(stakePub.hash())
      );
    } else {
      rewardAddress = RewardAddress.new(
        NetworkInfo.testnet().network_id(),
        StakeCredential.from_keyhash(stakePub.hash())
      );
    }
    return rewardAddress.to_address().to_bech32();
  }

  /** @inheritdoc */
  // this will validate both stake and payment addresses
  isValidAddress(address: string): boolean {
    const bech32PrefixList = ['addr', 'addr_test', 'stake', 'stake_test'];
    const BASE_ADDR_LEN = 92;
    const REWARD_AND_ENTERPRISE_ADDR_LEN = 47;
    const POINTER_ADDR_LEN = 52;
    const VALIDATOR_ADDR_LEN = 56;

    // test if this is a bech32 address first
    if (new RegExp(bech32PrefixList.join('|')).test(address)) {
      try {
        const decodedBech = bech32.decode(address, 108);
        const wordLength = decodedBech.words.length;
        if (!bech32PrefixList.includes(decodedBech.prefix)) {
          return false;
        }
        return (
          wordLength === BASE_ADDR_LEN ||
          wordLength === REWARD_AND_ENTERPRISE_ADDR_LEN ||
          wordLength === POINTER_ADDR_LEN
        );
      } catch (err) {
        return false;
      }
    } else {
      // maybe this is a validator address
      return new RegExp(`^(?!pool)[a-z0-9]\{${VALIDATOR_ADDR_LEN}\}$`).test(address);
    }
  }

  /** @inheritdoc */
  isValidBlockId(hash: string): boolean {
    return this.validateBlake2b(hash);
  }

  /** @inheritdoc */
  isValidPrivateKey(key: string): boolean {
    // this will return true for both extended and non-extended ED25519 keys
    return this.isValidKey(key);
  }

  isValidKey(key: string): boolean {
    try {
      new KeyPair({ prv: key });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidPublicKey(pubKey: string): boolean {
    try {
      new KeyPair({ pub: pubKey });
      return true;
    } catch {
      return false;
    }
  }

  /** @inheritdoc */
  isValidSignature(signature: string): boolean {
    try {
      Ed25519Signature.from_hex(signature);
      return true;
    } catch (err) {
      return false;
    }
  }

  /** @inheritdoc */
  isValidTransactionId(txId: string): boolean {
    return this.validateBlake2b(txId);
  }

  /**
   * Get the transaction body from a serialized transaction
   * @param {string} serializedTx - serialized transaction in hex or base64 format
   * @returns {string} transaction body in hex format
   */
  getTransactionBody(serializedTx: string): string {
    const HEX_REGEX = /^[0-9a-fA-F]+$/;
    const bufferRawTransaction = HEX_REGEX.test(serializedTx)
      ? Buffer.from(serializedTx, 'hex')
      : Buffer.from(serializedTx, 'base64');
    return Buffer.from(CardanoTransaction.from_bytes(bufferRawTransaction).body().to_bytes()).toString('hex');
  }
}

const utils = new Utils();

export default utils;
