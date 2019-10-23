import { TrxBase } from "./base";
import { NetworkType, coins } from "@bitgo/statics";

export class Ttrx extends TrxBase {
  constructor() {
    super(NetworkType.TESTNET);
    this.staticsCoin = coins.get('ttrx');
  }
}
