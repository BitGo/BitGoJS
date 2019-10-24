import { TrxBase } from "./base";
import { Networks } from "@bitgo/statics";

export class Ttrx extends TrxBase {
  constructor() {
    super(Networks.test.trx);
  }
}
