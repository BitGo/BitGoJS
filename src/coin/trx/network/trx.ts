import { TrxBase } from "./base";
import { Networks } from "@bitgo/statics";

export class Trx extends TrxBase {
  constructor() {
    super(Networks.main.trx);
  }
}
