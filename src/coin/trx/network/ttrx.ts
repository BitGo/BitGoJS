import { TrxBase } from "./coin";
import { coins } from "@bitgo/statics";

export class Ttrx extends TrxBase {
  constructor() {
    super(coins.get('ttrx'));
  }
}
