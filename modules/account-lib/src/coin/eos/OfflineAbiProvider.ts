/* eslint-disable @typescript-eslint/ban-ts-comment */
import { TextEncoder, TextDecoder } from 'util';
import { Api, Numeric } from 'eosjs';
import { RawAbi } from './ifaces';
import abi from './abi';

const eosioAbi = Numeric.base64ToBinary(abi.value);
const eosioTokenAbi = Numeric.base64ToBinary(abi.token);
// @ts-ignore
const eosioNullAbi = new Api({ textDecoder: new TextDecoder(), textEncoder: new TextEncoder() }).jsonToRawAbi(
  JSON.parse(
    '{"version":"eosio::abi/1.1","types":[],"structs":[],"actions":[{"name":"nonce","type":"string","ricardian_contract":"---\\nspec_version: \\"0.2.0\\"\\ntitle: Nonce\\nsummary: Nonce to prevent duplicate transctions"}],"tables":[],"ricardian_clauses":[],"error_messages":[],"abi_extensions":[],"variants":[]}',
  ),
);

class OfflineAbiProvider {
  getRawAbi(account: string): RawAbi {
    const ret: RawAbi = {
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

export default OfflineAbiProvider;
