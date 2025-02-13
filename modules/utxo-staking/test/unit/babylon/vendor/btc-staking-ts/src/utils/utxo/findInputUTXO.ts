import { Input } from "bitcoinjs-lib/src/transaction";

import { UTXO } from "../../types/UTXO";
import { transactionIdToHash } from "../btc";

export const findInputUTXO = (inputUTXOs: UTXO[], input: Input): UTXO => {
  const inputUTXO = inputUTXOs.find(
    (u) =>
      transactionIdToHash(u.txid).toString("hex") ===
        input.hash.toString("hex") && u.vout === input.index,
  );
  if (!inputUTXO) {
    throw new Error(
      `Input UTXO not found for txid: ${Buffer.from(input.hash).reverse().toString("hex")} ` +
        `and vout: ${input.index}`,
    );
  }
  return inputUTXO;
};
