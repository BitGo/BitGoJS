import { BuildTransactionError } from '@bitgo/sdk-core';
import { Constructor, DecodedUtxoObj } from '../iface';

export interface IUtxosBuilder {
  _utxos: DecodedUtxoObj[];
  /**
   * List of UTXO required as inputs.
   * A UTXO is a standalone representation of a transaction output.
   *
   * @param {DecodedUtxoObj[]} list of UTXOS
   */
  utxos(value: DecodedUtxoObj[]): this;

  /**
   * Check the list of UTXOS is empty and check each UTXO.
   * @param values
   */
  validateUtxos(values: DecodedUtxoObj[]): void;

  /**
   * Check the UTXO has expected fields.
   * @param UTXO
   */
  validateUtxo(value: DecodedUtxoObj): void;
}

function Utxos<T extends Constructor>(targetBuilder: T): Constructor<IUtxosBuilder> & T {
  return class UtxosBuilder extends targetBuilder implements IUtxosBuilder {
    _utxos: DecodedUtxoObj[];

    /**
     * List of UTXO required as inputs.
     * A UTXO is a standalone representation of a transaction output.
     *
     * @param {DecodedUtxoObj[]} list of UTXOS
     */
    utxos(value: DecodedUtxoObj[]): this {
      this.validateUtxos(value);
      this._utxos = value;
      return this;
    }

    /**
     * Check the list of UTXOS is empty and check each UTXO.
     * @param values
     */
    validateUtxos(values: DecodedUtxoObj[]): void {
      if (values.length === 0) {
        throw new BuildTransactionError("Utxos can't be empty array");
      }
      values.forEach(this.validateUtxo);
    }

    /**
     * Check the UTXO has expected fields.
     * @param UTXO
     */
    validateUtxo(value: DecodedUtxoObj): void {
      ['outputID', 'amount', 'txid', 'outputidx'].forEach((field) => {
        if (!value.hasOwnProperty(field)) throw new BuildTransactionError(`Utxos required ${field}`);
      });
    }
  };
}

export default Utxos;
