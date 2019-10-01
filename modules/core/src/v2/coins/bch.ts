import * as bitcoin from 'bitgo-utxo-lib';
import * as Bluebird from 'bluebird';
const cashaddress = require('cashaddress');
import * as _ from 'lodash';
import * as request from 'superagent';

import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { AbstractUtxoCoin, AddressInfo, UnspentInfo } from './abstractUtxoCoin';
import * as common from '../../common';
const co = Bluebird.coroutine;

const VALID_ADDRESS_VERSIONS = {
  base58: 'base58',
  // TODO(BG-11325): remove bech32 in future major version release
  bech32: 'bech32',
  cashaddr: 'cashaddr',
};

const containsMixedCaseCharacters = (str) => {
  return str !== _.toLower(str) && str !== _.toUpper(str);
};

export class Bch extends AbstractUtxoCoin {

  protected constructor(bitgo: BitGo, network?) {
    super(bitgo, network || bitcoin.networks.bitcoincash);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Bch(bitgo);
  }

  getChain() {
    return 'bch';
  }

  getFamily() {
    return 'bch';
  }

  getFullName() {
    return 'Bitcoin Cash';
  }

  getAddressPrefix() {
    return 'bitcoincash';
  }

  supportsBlockTarget() {
    return false;
  }

  /**
   * Canonicalize a Bitcoin Cash address for a specific version
   *
   * Starting on January 14th, 2018 Bitcoin Cash's bitcoin-abc node switched over to using cashaddr
   * encoding for all of their addresses in order to distinguish them from Bitcoin Core's.
   * https://www.bitcoinabc.org/cashaddr. We're sticking with the old base58 format because
   * migrating over to the new format will be laborious, and we want to see how the space evolves
   *
   * @param address
   * @param version the version of the desired address, 'base58' or 'cashaddr', defaulting to 'base58', 'bech32' is also
   *                supported for backwards compatibility but is deprecated and will be removed
   * @returns {*} address string
   */
  canonicalAddress(address, version = 'base58') {
    if (!_.includes(_.keys(VALID_ADDRESS_VERSIONS), version)) {
      throw new Error('version must be base58 or cashaddr');
    }

    const originalAddress = address; // used for error message

    let isValidBase58Address;
    let isValidCashAddr;
    try {
      isValidBase58Address = this.isValidAddress(address, true);
    } catch (e) {
      // ignore
    }
    try {
      isValidCashAddr = !!cashaddress.decode(address);
    } catch (e) {
      // try to coerce the address into a valid BCH cashaddr address if we know it's not a base58 address
      // We do this to remain compliant with the spec at https://github.com/Bitcoin-UAHF/spec/blob/master/cashaddr.md,
      // which says addresses do not need the prefix, and can be all lowercase XOR all uppercase
      if (!isValidBase58Address) {
        if (!_.startsWith(address, this.getAddressPrefix() + ':')) {
          address = this.getAddressPrefix() + ':' + address;
        }
        if (containsMixedCaseCharacters(address.split(':')[1])) {
          // we should reject these addresses
        } else {
          address = _.toLower(address);

          try {
            isValidCashAddr = !!cashaddress.decode(address);
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (!isValidBase58Address && !isValidCashAddr) {
      throw new Error('invalid address: ' + originalAddress);
    }

    // mapping to cashaddress's script versions
    const versionMap = {
      [this.network.pubKeyHash]: 'pubkeyhash',
      [this.network.scriptHash]: 'scripthash',
    };
    // another mapping to cashaddress's script versions
    const scriptVersionMap = {
      pubkeyhash: 'pubKeyHash',
      scripthash: 'scriptHash',
    };

    // convert from base58
    if (isValidBase58Address) {
      if (version === VALID_ADDRESS_VERSIONS.base58) {
        // no conversion needed
        return address;
      }
      const addressDetails = bitcoin.address.fromBase58Check(address);

      // JS annoyingly converts JSON Object variable keys to Strings, so we have to do so as well
      const addressVersionString = String(addressDetails.version);

      if (!_.includes(_.keys(versionMap), addressVersionString)) {
        throw new Error('invalid address version: ' + addressVersionString + '. Expected one of ' + _.keys(versionMap));
      }

      return cashaddress.encode(this.getAddressPrefix(), versionMap[addressVersionString], addressDetails.hash);
    }

    // convert from cashaddr
    if (version === VALID_ADDRESS_VERSIONS.cashaddr || version === VALID_ADDRESS_VERSIONS.bech32) {
      return address;
    }

    const rawBytes = cashaddress.decode(address);
    return bitcoin.address.toBase58Check(rawBytes.hash, this.network[scriptVersionMap[rawBytes.version]]);
  }

  /**
   * Checks if the unspent comes from the BitGo taint provider address
   * @param unspent
   * @returns {boolean}
   */
  isBitGoTaintedUnspent(unspent) {
    return unspent.address === '33p1q7mTGyeM5UnZERGiMcVUkY12SCsatA';
  }

  /**
   *
   * @param txBuilder
   * @returns {*}
   */
  prepareTransactionBuilder(txBuilder) {
    txBuilder.setVersion(2);
    return txBuilder;
  }

  /**
   * Calculate the hash to verify the signature against
   * @param transaction Transaction object
   * @param inputIndex
   * @param pubScript
   * @param amount The previous output's amount
   * @param hashType
   * @param isSegwitInput
   * @returns {*}
   */
  calculateSignatureHash(transaction, inputIndex, pubScript, amount, hashType, isSegwitInput) {
    return transaction.hashForCashSignature(inputIndex, pubScript, amount, hashType);
  }

  /**
   *
   * @returns {number}
   */
  public get defaultSigHashType() {
    return bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143;
  }

  recoveryBlockchainExplorerUrl(url) {
    return common.Environments[this.bitgo.env].bchExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58) {
    return co<AddressInfo>(function *getAddressInfoFromExplorer() {
      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58) {
    return co<UnspentInfo[]>(function *getUnspentInfoFromExplorer() {
      const unspents = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}/utxo`)).result();

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }
}
