import { TrxBase } from "./coin";
import { coins } from "@bitgo/statics";

export class Trx extends TrxBase {
  constructor() {
    super(coins.get('trx'));
  }
}
