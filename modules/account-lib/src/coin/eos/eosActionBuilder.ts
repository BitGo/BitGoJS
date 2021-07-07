import * as EosJs from 'eosjs';
import { TransactionBuilder as EosTxBuilder } from 'eosjs/dist/eosjs-api';
import { Action } from './ifaces';

export abstract class EosActionBuilder {
  protected action: Action;
  constructor(act: Action) {
    this.action = act;
  }

  /**
   * Build eos transaction action
   *
   * @param {EosTxBuilder} builder Eos transaction builder
   */
  abstract build(builder: EosTxBuilder): EosJs.Serialize.Action;
}
