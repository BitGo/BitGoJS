import * as EosJs from 'eosjs';

import * as boxAbi from './boxAbi.json';
import * as chexAbi from './chexAbi.json';
import * as eosioAbi from './eosioAbi.json';
import * as eosioNullAbi from './eosioNullAbi.json';
import * as eosioTokenAbi from './eosioTokenAbi.json';
import * as iqAbi from './iqAbi.json';
import * as testChexAbi from './testChexAbi.json';
import * as testIqAbi from './testIqAbi.json';
import * as usdtAbi from './usdtAbi.json';

const allAbis = [
  boxAbi,
  chexAbi,
  eosioAbi,
  eosioNullAbi,
  eosioTokenAbi,
  iqAbi,
  usdtAbi,
  testChexAbi,
  testIqAbi
];

export function bootstrapEosWithTokens(eosClient: EosJs): EosJs {
  allAbis.forEach(abi => eosClient.fc.abiCache.abi(abi.account_name, abi.abi));
  return eosClient;
}
