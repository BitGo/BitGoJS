import { InvalidTransactionError } from '@bitgo/sdk-core';
import { Coin } from '@cosmjs/stargate';
import BigNumber from 'bignumber.js';

import { CosmosUtils, PubKeyType, PubKeyTypeUrl } from '@bitgo/abstract-cosmos';
import * as constants from './constants';
import { DecodedTxRaw } from '@cosmjs/proto-signing';
import { fromBase64, toBase64, toHex, fromHex } from '@cosmjs/encoding';
import { Pubkey } from '@cosmjs/amino';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { PubKey } from '../../resources/types/ethSecp256k1';
import { Hash } from 'crypto';
import Keccak from 'keccak';

export class IslmUtils extends CosmosUtils {
  /** @inheritdoc */
  isValidAddress(address: string): boolean {
    return constants.accountAddressRegex.test(address);
  }

  /** @inheritdoc */
  isValidValidatorAddress(address: string): boolean {
    return constants.validatorAddressRegex.test(address);
  }

  /** @inheritdoc */
  validateAmount(amount: Coin): void {
    const amountBig = BigNumber(amount.amount);
    if (amountBig.isLessThanOrEqualTo(0)) {
      throw new InvalidTransactionError('transactionBuilder: validateAmount: Invalid amount: ' + amount.amount);
    }
    if (!constants.validDenoms.find((denom) => denom === amount.denom)) {
      throw new InvalidTransactionError('transactionBuilder: validateAmount: Invalid denom: ' + amount.denom);
    }
  }

  /** @inheritdoc */
  getPublicKeyFromDecodedTx(decodedTx: DecodedTxRaw): string | undefined {
    const publicKeyUInt8Array = decodedTx.authInfo.signerInfos?.[0].publicKey?.value;
    if (publicKeyUInt8Array) {
      return toHex(fromBase64(this.decodePubkey(decodedTx.authInfo.signerInfos?.[0].publicKey)?.value));
    }
    return undefined;
  }

  /**
   * Decodes a single pubkey from ptotobuf `Any` into `Pubkey`.
   * @param {Any} pubkey
   * @returns {Pubkey} the Amino JSON representation (type/value wrapper) of the pubkey
   */
  decodePubkey(pubkey?: Any | null): Pubkey | null {
    if (!pubkey || !pubkey.value) {
      return null;
    }
    const { key } = PubKey.decode(pubkey.value);
    return this.encodeEthSecp256k1Pubkey(key);
  }

  /** @inheritdoc */
  getEncodedPubkey(pubkey: string): Any {
    return this.encodePubkey(this.encodeEthSecp256k1Pubkey(fromHex(pubkey)));
  }

  /**
   * Takes a pubkey in the Amino JSON object style (type/value wrapper)
   * and convertes it into a protobuf `Any`.
   * @param {Pubkey} pubkey Amino JSON object style pubkey
   * @returns {Any} pubkey encoded as protobuf `Any`
   */
  encodePubkey(pubkey: Pubkey): Any {
    const pubkeyProto = PubKey.fromPartial({
      key: fromBase64(pubkey.value),
    });
    return Any.fromPartial({
      typeUrl: PubKeyTypeUrl.ethSecp256k1,
      value: Uint8Array.from(PubKey.encode(pubkeyProto).finish()),
    });
  }

  /**
   * Takes a public key as raw bytes and returns the Amino JSON
   * representation of it (type/value wrapper).
   * @param {Uint8Array} pubkey public key as raw bytes
   * @returns {Any} Amino JSON style pubkey
   */
  encodeEthSecp256k1Pubkey(pubkey: Uint8Array): Pubkey {
    if (pubkey.length !== 33 || (pubkey[0] !== 0x02 && pubkey[0] !== 0x03)) {
      throw new Error('Public key must be compressed ethSecp256k1, i.e. 33 bytes starting with 0x02 or 0x03');
    }
    return {
      type: PubKeyType.ethSecp256k1,
      value: toBase64(pubkey),
    };
  }

  /** @inheritdoc */
  getHashFunction(): Hash {
    return Keccak('keccak256');
  }
}

const islmUtils: CosmosUtils = new IslmUtils();

export default islmUtils;
