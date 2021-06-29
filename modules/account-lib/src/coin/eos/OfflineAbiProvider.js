const { TextEncoder, TextDecoder } = require('util');
const { Api, Numeric } = require('eosjs');
const abi = require('./abi');

const eosioAbi = Numeric.base64ToBinary(abi.value);
const eosioTokenAbi = Numeric.base64ToBinary(abi.token);
const eosioNullAbi = new Api({ textDecoder: new TextDecoder(), textEncoder: new TextEncoder() }).jsonToRawAbi(
  JSON.parse(
    '{"version":"eosio::abi/1.1","types":[],"structs":[],"actions":[{"name":"nonce","type":"string","ricardian_contract":"---\\nspec_version: \\"0.2.0\\"\\ntitle: Nonce\\nsummary: Nonce to prevent duplicate transctions"}],"tables":[],"ricardian_clauses":[],"error_messages":[],"abi_extensions":[],"variants":[]}',
  ),
);

class OfflineAbiProvider {
  getRawAbi(account) {
    const ret = {
      accountName: account,
    };
    if (account === 'eosio') {
      ret.abi = eosioAbi;
    } else if (account === 'eosio.token') {
      ret.abi = eosioTokenAbi;
    } else if (account === 'eosio.null') {
      ret.abi = eosioNullAbi;
    } else {
      throw new Error(`${account} is not supported by OfflineAbiProvider`);
    }

    return ret;
  }
}

exports.OfflineAbiProvider = OfflineAbiProvider;
