const AbstractUtxoCoin = require('./abstractUtxoCoin');
const bitcoin = require('bitgo-utxo-lib');
const request = require('superagent');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../common');
const cashaddress = require('cashaddress');
const _ = require('lodash');

const VALID_ADDRESS_VERSIONS = {
  base58: 'base58',
  bech32: 'bech32'
};

const containsMixedCaseCharacters = (str) => {
  return str !== _.toLower(str) && str !== _.toUpper(str);
};

class Bch extends AbstractUtxoCoin {

  constructor() {
    super();
    this.network = bitcoin.networks.bitcoincash;
    this.bchPrefix = 'bitcoincash';
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

  supportsBlockTarget() {
    return false;
  }

  /**
   * Canonicalize a Bitcoin Cash address for a specific version
   *
   * Starting on January 14th, 2018 Bitcoin Cash's bitcoin-abc node switched over to using bech32
   * encoding for all of their addresses in order to distinguish them from Bitcoin Core's
   * https://www.bitcoinabc.org/cashaddr. We're sticking with the old base58 format because
   * migrating over to the new format will be laborious, and we want to see how the space evolves
   *
   * @param address
   * @param version the version of the desired address, 'base58' or 'bech32' defaulting to 'base58'
   * @returns {*} address string
   */
  canonicalAddress(address, version = 'base58') {
    if (!_.includes(_.keys(VALID_ADDRESS_VERSIONS), version)) {
      throw new Error('version needs to be either bech32 or base58');
    }

    const originalAddress = address; // used for error message

    let isValidBase58Address;
    let isValidBech32Address;
    try {
      isValidBase58Address = this.isValidAddress(address, true);
    } catch (e) {
      // ignore
    }
    try {
      isValidBech32Address = !!cashaddress.decode(address);
    } catch (e) {
      // try to coerce the address into a valid BCH bech32 address if we know it's not a base58 address
      // We do this to remain compliant with the spec at https://github.com/Bitcoin-UAHF/spec/blob/master/cashaddr.md,
      // which says addresses do not need the prefix, and can be all lowercase XOR all uppercase
      if (!isValidBase58Address) {
        if (!_.startsWith(address, this.bchPrefix + ':')) {
          address = this.bchPrefix + ':' + address;
        }
        if (containsMixedCaseCharacters(address.split(':')[1])) {
          // we should reject these addresses
        } else {
          address = _.toLower(address);

          try {
            isValidBech32Address = !!cashaddress.decode(address);
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (!isValidBase58Address && !isValidBech32Address) {
      throw new Error('invalid address: ' + originalAddress);
    }

    // mapping to cashaddress's script versions
    const versionMap = {
      [this.network.pubKeyHash]: 'pubkeyhash',
      [this.network.scriptHash]: 'scripthash'
    };
    // another mapping to cashaddress's script versions
    const scriptVersionMap = {
      pubkeyhash: 'pubKeyHash',
      scripthash: 'scriptHash'
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

      return cashaddress.encode(this.bchPrefix, versionMap[addressVersionString], addressDetails.hash);
    }

    // convert from bech32
    if (version === VALID_ADDRESS_VERSIONS.bech32) {
      // no conversion needed
      return address;
    }

    const rawBytes = cashaddress.decode(address);
    return bitcoin.address.toBase58Check(rawBytes.hash, this.network[scriptVersionMap[rawBytes.version]]);
  }

  /**
   *
   * @param txBuilder
   * @returns {*}
   */
  static prepareTransactionBuilder(txBuilder) {
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
  static get defaultSigHashType() {
    return bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143;
  }

  recoveryBlockchainExplorerUrl(url) {
    return common.Environments[this.bitgo.env].bchExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58) {
    return co(function *getAddressInfoFromExplorer() {
      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58) {
    return co(function *getUnspentInfoFromExplorer() {
      const unspents = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}/utxo`)).result();

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }
}

module.exports = Bch;
