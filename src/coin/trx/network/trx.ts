import { TrxBase } from "./base";
import { NetworkType, coins } from "@bitgo/statics";

export class Trx extends TrxBase {
  constructor() {
    super(NetworkType.MAINNET);
    this.staticsCoin = coins.get('trx');
  }
}
