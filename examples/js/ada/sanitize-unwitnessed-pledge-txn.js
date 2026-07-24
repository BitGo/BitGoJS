// There are known serialization inconsistencies between the cardano-cli and nodejs libraries. As a workaround, ADA pledge txn
// needs to be re-serialized using the nodejs library before witnessed by node key and then submitted to BitGo pledge endpoint.
// This script helps to re-serialize the pledge txn using the nodejs library.
const fs = require('fs');
const BitGoJS = require('bitgo');
const { Transaction } = require('@bitgo/sdk-coin-ada');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const coin = 'tada';
const basecoin = bitgo.coin(coin);

const unwitnessedTxCborHex = 'replaced by CBOR hex of unwitnessed tx from cardano-cli';

const tx = new Transaction(basecoin);
tx.fromRawTransaction(unwitnessedTxCborHex);
const sanitizedUnwitnessedTxn = tx.toBroadcastFormat();

const unwitnessedTxn = JSON.stringify(
  {
    type: 'Unwitnessed Tx BabbageEra',
    description: 'Ledger Cddl Format',
    cborHex: sanitizedUnwitnessedTxn,
  },
  null,
  4
);

fs.writeFile('sanitized_unwitnessed_pledge_txn.tx', unwitnessedTxn, (err) => {
  if (err) {
    console.error('Error writing to sanitized txn.', err);
  } else {
    console.log('Successfully saved to sanitized txn.');
  }
});
