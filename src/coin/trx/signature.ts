import { BaseSignature } from "../..";

export class Signature implements BaseSignature {
  signature: string;
  
  failedSigning: boolean = false;

  isValid(): boolean {
    return !this.failedSigning;
  }
}
