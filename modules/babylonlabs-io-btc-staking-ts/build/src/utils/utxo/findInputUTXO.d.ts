import { Input } from "bitcoinjs-lib/src/transaction";
import { UTXO } from "../../types/UTXO";
export declare const findInputUTXO: (inputUTXOs: UTXO[], input: Input) => UTXO;
