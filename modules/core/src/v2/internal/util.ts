/**
 * @prettier
 * @hidden
 */

/**
 */
import * as bitcoin from 'bitgo-utxo-lib';
import * as Big from 'big.js';
import * as _ from 'lodash';
import * as crypto from 'crypto';
import * as debugLib from 'debug';
import { EthereumLibraryUnavailableError } from '../../errors';
import { RequestTracer as IRequestTracer } from '../types';

const debug = debugLib('bitgo:v2:util');

let ethUtil;
let isEthAvailable = false;

const ethImport = 'ethereumjs-util';
import('ethereumjs-util')
  .then(eth => {
    ethUtil = eth;
    isEthAvailable = true;
  })
  .catch(e => {
    // ethereum currently not supported
    debug('unable to load ethereumjs-util:');
    debug(e.stack);
  });

/**
 * Create a request tracer for tracing workflows which involve multiple round trips to the server
 */
export class RequestTracer implements IRequestTracer {
  private _seq = 0;
  private readonly _seed: Buffer;
  constructor() {
    this._seed = crypto.randomBytes(10);
  }

  inc() {
    this._seq++;
  }

  toString() {
    return `${this._seed.toString('hex')}-${_.padStart(this._seq.toString(16), 4, '0')}`;
  }
}

export class Util {
  private constructor() {}

  /**
   * @deprecated
   */
  static isEthAvailable() {
    return isEthAvailable;
  }

  /**
   * Convert a big.js big number to an array of unsigned bytes
   * @param bn
   * @deprecated
   */
  static bnToByteArrayUnsigned(bn: any): any {
    let ba = bn.abs().toByteArray();
    if (ba.length) {
      if (ba[0] === 0) {
        ba = ba.slice(1);
      }
      return ba.map(function(v) {
        return v < 0 ? v + 256 : v;
      });
    } else {
      // Empty array, nothing to do
      return ba;
    }
  }

  /**
   * Generate the output script for a BTC P2SH multisig address
   * @param m
   * @param pubKeys
   * @deprecated
   */
  static p2shMultisigOutputScript(m: number, pubKeys: Buffer[]) {
    const redeemScript = bitcoin.script.multisig.output.encode(m, pubKeys);
    const hash = bitcoin.crypto.hash160(redeemScript);
    return bitcoin.script.scriptHash.output.encode(hash);
  }

  /**
   * Utility method for handling arguments of pageable queries
   * @param params
   * @deprecated
   */
  static preparePageableQuery(params: { limit?: number; skip?: number } = {}): { limit?: number; skip?: number } {
    const query: any = {};
    if (params.limit) {
      if (!_.isNumber(params.limit)) {
        throw new Error('invalid limit argument, expecting number');
      }
      query.limit = params.limit;
    }
    if (params.skip) {
      if (!_.isNumber(params.skip)) {
        throw new Error('invalid skip argument, expecting number');
      }
      query.skip = params.skip;
    }
    return query;
  }

  /**
   * Create a request identifier for tracing multi-request workflows
   */
  static createRequestId(): RequestTracer {
    return new RequestTracer();
  }

  /**
   * Convert a BTC xpub to an Ethereum address (with 0x) prefix
   * @param xpub
   * @deprecated
   */
  static xpubToEthAddress(xpub: string): string {
    if (!isEthAvailable) {
      throw new EthereumLibraryUnavailableError(ethImport);
    }
    const hdNode = bitcoin.HDNode.fromBase58(xpub);
    const ethPublicKey = hdNode.keyPair.__Q.getEncoded(false).slice(1);
    return ethUtil.bufferToHex(ethUtil.publicToAddress(ethPublicKey, false));
  }

  /**
   * Convert a BTC xpriv to an Ethereum private key (without 0x prefix)
   * @param xprv
   * @deprecated
   */
  static xprvToEthPrivateKey(xprv: string): string {
    const hdNode = bitcoin.HDNode.fromBase58(xprv);
    const ethPrivateKey: Buffer = hdNode.keyPair.d.toBuffer(32);
    return ethPrivateKey.toString('hex');
  }

  /**
   * Sign a message using Ethereum's ECsign method and return the signature string
   * @param msgHash
   * @param privKey
   * @deprecated
   */
  static ethSignMsgHash(msgHash: string, privKey: string): string {
    if (!isEthAvailable) {
      throw new EthereumLibraryUnavailableError(ethImport);
    }
    const signatureInParts = ethUtil.ecsign(
      new Buffer(ethUtil.stripHexPrefix(msgHash), 'hex'),
      new Buffer(privKey, 'hex')
    );

    // Assemble strings from r, s and v
    const r = ethUtil.setLengthLeft(signatureInParts.r, 32).toString('hex');
    const s = ethUtil.setLengthLeft(signatureInParts.s, 32).toString('hex');
    const v = ethUtil.stripHexPrefix(ethUtil.intToHex(signatureInParts.v));

    // Concatenate the r, s and v parts to make the signature string
    return ethUtil.addHexPrefix(r.concat(s, v));
  }

  /**
   * Convert from wei string (or BN) to Ether (multiply by 1e18)
   * @param wei
   * @deprecated
   */
  static weiToEtherString(wei: any): string {
    if (!isEthAvailable) {
      throw new EthereumLibraryUnavailableError(ethImport);
    }
    let bn = wei;
    if (!(wei instanceof ethUtil.BN)) {
      bn = new ethUtil.BN(wei);
    }
    Big.E_POS = 256;
    Big.E_NEG = -18;
    const weiString = bn.toString(10);
    const big = new Big(weiString);
    // 10^18
    const ether = big.div('1000000000000000000');
    return ether.toPrecision();
  }

  /**
   * Recover an ethereum address from a signature and message hash
   * @param msgHash
   * @param signature
   * @deprecated
   */
  static ecRecoverEthAddress(msgHash: string, signature: string): string {
    msgHash = ethUtil.stripHexPrefix(msgHash);
    signature = ethUtil.stripHexPrefix(signature);

    const v = parseInt(signature.slice(128, 130), 16);
    const r = new Buffer(signature.slice(0, 64), 'hex');
    const s = new Buffer(signature.slice(64, 128), 'hex');

    const pubKey = ethUtil.ecrecover(new Buffer(msgHash, 'hex'), v, r, s);
    return ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
  }
}
